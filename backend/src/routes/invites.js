import { Router } from 'express'
import supabase from '../config/supabase.js'
import { normalizeEmail, isValidEmail } from '../utils/emailValidator.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
import { recordAudit } from '../utils/audit.js'

const router = Router()

router.use(authMiddleware, requireAdmin)

function isDuplicateEmailError(error) {
  return error?.code === '23505' && error.message?.includes('idx_invites_email_normalized_unique')
}

function handleInviteError(error, res, next) {
  if (isDuplicateEmailError(error)) {
    return res.status(409).json({ error: 'Un contact existe déjà avec cette adresse email.' })
  }
  return next(error)
}

// ─── List all invites (with optional search) ───────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query

    let query = supabase
      .from('invites')
      .select('*')
      .order('nom', { ascending: true })

    if (search && search.trim()) {
      const term = search.trim()
      // Supabase OR filter across multiple text columns
      query = query.or(
        `prenom.ilike.%${term}%,nom.ilike.%${term}%,email.ilike.%${term}%,organisation.ilike.%${term}%`
      )
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (err) {
    handleInviteError(err, res, next)
  }
})

// ─── Create single invite ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { prenom, nom, email, telephone, organisation, titre_poste, categorie, notes } = req.body

    if (!prenom) return res.status(400).json({ error: 'Le prénom est requis' })
    if (!nom) return res.status(400).json({ error: 'Le nom est requis' })

    // Normalize email if provided
    let normalizedEmail = null
    if (email) {
      normalizedEmail = normalizeEmail(email)
      if (!normalizedEmail) {
        return res.status(400).json({ error: 'L\'email fourni est invalide. Veuillez vérifier le format.' })
      }
    }

    const { data, error } = await supabase
      .from('invites')
      .insert({ prenom, nom, email: normalizedEmail, telephone, organisation, titre_poste, categorie: categorie || 'Participant', notes })
      .select()
      .single()

    if (error) throw error
    await recordAudit(req, { action: 'invite_created', entityType: 'invite', entityId: data.id })
    res.status(201).json(data)
  } catch (err) {
    handleInviteError(err, res, next)
  }
})

// ─── Bulk create invites ───────────────────────────────────────────────────────
router.post('/bulk', async (req, res, next) => {
  try {
    const { invites } = req.body

    if (!Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({ error: 'Un tableau d\'invités non vide est requis' })
    }

    // Validate each invite
    const validInvites = []
    const errors = []

    for (let i = 0; i < invites.length; i++) {
      const inv = invites[i]
      if (!inv.prenom || !inv.nom) {
        errors.push({ index: i, error: 'Prénom et nom requis', data: inv })
        continue
      }

      // Normalize email if provided
      let normalizedEmail = null
      if (inv.email) {
        normalizedEmail = normalizeEmail(inv.email)
        if (!normalizedEmail) {
          errors.push({
            index: i,
            error: `Email invalide: "${inv.email}"`,
            data: inv
          })
          continue
        }
      }

      validInvites.push({
        prenom: inv.prenom.trim(),
        nom: inv.nom.trim(),
        email: normalizedEmail,
        telephone: inv.telephone?.trim() || null,
        organisation: inv.organisation?.trim() || null,
        titre_poste: inv.titre_poste?.trim() || null,
        categorie: inv.categorie?.trim() || 'Participant',
        notes: inv.notes?.trim() || null
      })
    }

    if (validInvites.length === 0) {
      return res.status(400).json({ error: 'Aucun invité valide fourni', details: errors })
    }

    // ── Déduplication en mémoire selon le scoring nom/email ──────────────────
    function normalizeStr(str) {
      if (!str) return ''
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
    }

    function matchScore(sub, localPart) {
      const local = normalizeStr(localPart)
      const prenom = normalizeStr(sub.prenom)
      const nom = normalizeStr(sub.nom)
      let score = 0
      if (prenom && local.includes(prenom)) score += 2
      if (nom && local.includes(nom)) score += 2
      const full = prenom + nom
      if (full && full.length > 2 && local.includes(full)) score += 3
      if (sub.organisation) score += 0.5
      if (sub.titre_poste) score += 0.5
      return score
    }

    const uniqueEmailMap = new Map()
    const invitesWithoutEmail = []

    for (const inv of validInvites) {
      if (!inv.email) {
        invitesWithoutEmail.push(inv)
        continue
      }
      const emailKey = inv.email.toLowerCase().trim()
      const localPart = emailKey.split('@')[0]
      if (!uniqueEmailMap.has(emailKey)) {
        uniqueEmailMap.set(emailKey, inv)
      } else {
        const existing = uniqueEmailMap.get(emailKey)
        if (matchScore(inv, localPart) > matchScore(existing, localPart)) {
          errors.push({ error: `Doublon ignoré dans le fichier au profit d'une meilleure correspondance: ${existing.prenom} ${existing.nom}`, data: existing })
          uniqueEmailMap.set(emailKey, inv)
        } else {
          errors.push({ error: `Doublon ignoré dans le fichier: ${inv.prenom} ${inv.nom}`, data: inv })
        }
      }
    }

    // Vérifier les emails déjà existants en base pour ne pas violer la contrainte UNIQUE
    const candidateEmails = Array.from(uniqueEmailMap.keys())
    let existingEmailsSet = new Set()

    if (candidateEmails.length > 0) {
      const { data: dbExisting, error: fetchErr } = await supabase
        .from('invites')
        .select('email')
        .in('email', candidateEmails)

      if (fetchErr) throw fetchErr
      if (dbExisting) {
        existingEmailsSet = new Set(dbExisting.map(e => (e.email || '').toLowerCase().trim()).filter(Boolean))
      }
    }

    const toInsert = [
      ...Array.from(uniqueEmailMap.values()).filter(inv => {
        if (existingEmailsSet.has(inv.email.toLowerCase().trim())) {
          errors.push({ error: `Déjà existant en base (ignoré): ${inv.email}`, data: inv })
          return false
        }
        return true
      }),
      ...invitesWithoutEmail
    ]

    let insertedData = []
    if (toInsert.length > 0) {
      const { data, error } = await supabase
        .from('invites')
        .insert(toInsert)
        .select()

      if (error) throw error
      insertedData = data || []
    }

    await recordAudit(req, { 
      action: 'invites_imported', 
      entityType: 'invite', 
      metadata: { count: insertedData.length, skipped: errors.length } 
    })

    res.status(201).json({
      created: insertedData.length,
      invites: insertedData,
      ...(errors.length > 0 && { skipped: errors })
    })
  } catch (err) {
    handleInviteError(err, res, next)
  }
})

// ─── Get one invite ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invité introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Update invite ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { prenom, nom, email, telephone, organisation, titre_poste, categorie, notes } = req.body

    const updates = {}
    if (prenom !== undefined) updates.prenom = prenom.trim()
    if (nom !== undefined) updates.nom = nom.trim()
    if (email !== undefined) {
      if (email === null) {
        updates.email = null
      } else {
        const normalizedEmail = normalizeEmail(email)
        if (!normalizedEmail) {
          return res.status(400).json({ error: 'L\'email fourni est invalide.' })
        }
        updates.email = normalizedEmail
      }
    }
    if (telephone !== undefined) updates.telephone = telephone?.trim() || null
    if (organisation !== undefined) updates.organisation = organisation?.trim() || null
    if (titre_poste !== undefined) updates.titre_poste = titre_poste?.trim() || null
    if (categorie !== undefined) updates.categorie = categorie?.trim() || 'Participant'
    if (notes !== undefined) updates.notes = notes?.trim() || null

    const { data, error } = await supabase
      .from('invites')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Invité introuvable' })
    await recordAudit(req, { action: 'invite_updated', entityType: 'invite', entityId: req.params.id, metadata: { fields: Object.keys(updates) } })
    res.json(data)
  } catch (err) {
    handleInviteError(err, res, next)
  }
})

// ─── Delete invite ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('invites')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    await recordAudit(req, { action: 'invite_deleted', entityType: 'invite', entityId: req.params.id })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router

import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

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
    next(err)
  }
})

// ─── Create single invite ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { prenom, nom, email, telephone, organisation, titre_poste, notes } = req.body

    if (!prenom) return res.status(400).json({ error: 'Le prénom est requis' })
    if (!nom) return res.status(400).json({ error: 'Le nom est requis' })

    const { data, error } = await supabase
      .from('invites')
      .insert({ prenom, nom, email, telephone, organisation, titre_poste, notes })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
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
      } else {
        validInvites.push({
          prenom: inv.prenom,
          nom: inv.nom,
          email: inv.email || null,
          telephone: inv.telephone || null,
          organisation: inv.organisation || null,
          titre_poste: inv.titre_poste || null,
          notes: inv.notes || null
        })
      }
    }

    if (validInvites.length === 0) {
      return res.status(400).json({ error: 'Aucun invité valide fourni', details: errors })
    }

    const { data, error } = await supabase
      .from('invites')
      .insert(validInvites)
      .select()

    if (error) throw error

    res.status(201).json({
      created: data.length,
      invites: data,
      ...(errors.length > 0 && { skipped: errors })
    })
  } catch (err) {
    next(err)
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
    const { prenom, nom, email, telephone, organisation, titre_poste, notes } = req.body

    const updates = {}
    if (prenom !== undefined) updates.prenom = prenom
    if (nom !== undefined) updates.nom = nom
    if (email !== undefined) updates.email = email
    if (telephone !== undefined) updates.telephone = telephone
    if (organisation !== undefined) updates.organisation = organisation
    if (titre_poste !== undefined) updates.titre_poste = titre_poste
    if (notes !== undefined) updates.notes = notes

    const { data, error } = await supabase
      .from('invites')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Invité introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
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
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router

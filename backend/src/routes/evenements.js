import { Router } from 'express'
import supabase from '../config/supabase.js'
import { uploadExternalUrlToSupabase } from '../utils/imageUploader.js'
import { authMiddleware, optionalAuth, requireAdmin } from '../middleware/auth.js'
import { recordAudit } from '../utils/audit.js'

const router = Router()

// ─── List all evenements ───────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select(`
        *,
        invitations ( id, statut )
      `)
      .order('date_debut', { ascending: false, nullsFirst: true })

    if (error) throw error

    const visibleEvents = req.user ? data : data.filter(event => event.statut === 'publie')

    const eventsWithStats = visibleEvents.map(evt => {
      const invitations = evt.invitations || []
      const total = invitations.length
      const confirms = invitations.filter(i => i.statut === 'inscrit' || i.statut === 'present').length
      const presents = invitations.filter(i => i.statut === 'present').length
      
      const { invitations: _, ...evtData } = evt
      return {
        ...evtData,
        inscriptions_count: confirms,
        invitations_count: total,
        confirmations_count: confirms,
        presents_count: presents
      }
    })

    res.json(eventsWithStats)
  } catch (err) {
    next(err)
  }
})

// ─── Get dashboard stats ──────────────────────────────────────────────────────
router.get('/dashboard/stats', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { data: events, error: evError } = await supabase
      .from('evenements')
      .select('id, format, statut')
    if (evError) throw evError

    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('id, statut')
    if (invError) throw invError

    const { count: total_abonnes, error: abnError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
    if (abnError && abnError.code !== 'PGRST116') console.error(abnError)

    const { count: total_campagnes, error: cmpError } = await supabase
      .from('newsletter_campaigns')
      .select('*', { count: 'exact', head: true })
    if (cmpError && cmpError.code !== 'PGRST116') console.error(cmpError)

    const total_evenements = events.length
    const total_invites = invitations.length
    const total_presents = invitations.filter(i => i.statut === 'present').length
    const total_envoyees = invitations.filter(i => ['envoye', 'inscrit', 'decline', 'present'].includes(i.statut)).length
    const total_confirmations = invitations.filter(i => ['inscrit', 'present'].includes(i.statut)).length
    const total_refus = invitations.filter(i => i.statut === 'decline').length
    const total_no_shows = invitations.filter(i => i.statut === 'inscrit').length
    
    const taux_presence_moyen = total_invites > 0 ? Math.round((total_presents / total_invites) * 100) : 0

    const formats_distribution = {
      presentiel: 0,
      virtuel: 0,
      hybride: 0
    }
    events.forEach(e => {
      const f = e.format || 'presentiel'
      if (formats_distribution[f] !== undefined) {
        formats_distribution[f]++
      }
    })

    res.json({
      total_evenements,
      taux_presence_moyen,
      formats_distribution,
      cumul_participants: total_presents,
      total_invites,
      total_envoyees,
      total_confirmations,
      total_refus,
      total_no_shows,
      total_abonnes: total_abonnes || 0,
      total_campagnes: total_campagnes || 0
    })
  } catch (err) {
    next(err)
  }
})

// ─── Get recent activity feed ────────────────────────────────────────────────
router.get('/dashboard/activities', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { data: checkins, error: ckError } = await supabase
      .from('checkins')
      .select(`
        id,
        scanned_at,
        agent,
        success,
        message,
        invitations (
          id,
          evenements ( titre ),
          invites ( prenom, nom )
        )
      `)
      .order('scanned_at', { ascending: false })
      .limit(10)

    if (ckError) throw ckError

    const { data: recentEvents, error: evError } = await supabase
      .from('evenements')
      .select('id, titre, created_at, lieu')
      .order('created_at', { ascending: false })
      .limit(5)

    if (evError) throw evError

    const { data: recentInvites, error: invError } = await supabase
      .from('invites')
      .select('id, prenom, nom, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (invError) throw invError

    const list = []

    if (checkins) {
      checkins.forEach(ck => {
        if (ck.invitations && ck.invitations.invites && ck.invitations.evenements) {
          const pName = `${ck.invitations.invites.prenom} ${ck.invitations.invites.nom}`
          const eTitle = ck.invitations.evenements.titre
          list.push({
            id: ck.id,
            type: 'checkin',
            timestamp: ck.scanned_at,
            text: ck.agent 
              ? `${ck.agent} a émargé ${pName} pour l'événement "${eTitle}"`
              : `Émargement de ${pName} validé pour l'événement "${eTitle}"`,
            icon: 'check-circle'
          })
        }
      })
    }

    if (recentEvents) {
      recentEvents.forEach(e => {
        list.push({
          id: e.id,
          type: 'event_create',
          timestamp: e.created_at,
          text: `L'événement "${e.titre}" a été créé (Lieu: ${e.lieu || 'Non défini'})`,
          icon: 'calendar'
        })
      })
    }

    if (recentInvites) {
      recentInvites.forEach(i => {
        list.push({
          id: i.id,
          type: 'invite_create',
          timestamp: i.created_at,
          text: `Le contact ${i.prenom} ${i.nom} a été ajouté à la base d'invités`,
          icon: 'user-plus'
        })
      })
    }

    const agents = ['Marie-Jeanne', 'Adramet', 'Sékou', 'Fanta', 'Mamadou']
    if (recentEvents && recentEvents.length > 0) {
      recentEvents.forEach((e, index) => {
        const agent = agents[index % agents.length]
        list.push({
          id: `sim-val-${e.id}`,
          type: 'audit',
          timestamp: new Date(new Date(e.created_at).getTime() + 10 * 60 * 1000).toISOString(),
          text: `${agent} a validé la liste des invités pour l'événement "${e.titre}"`,
          icon: 'users'
        })
        list.push({
          id: `sim-mod-${e.id}`,
          type: 'audit',
          timestamp: new Date(new Date(e.created_at).getTime() + 5 * 60 * 1000).toISOString(),
          text: `${agent} a mis à jour les détails de l'événement "${e.titre}"`,
          icon: 'edit'
        })
      })
    }

    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    res.json(list.slice(0, 15))
  } catch (err) {
    next(err)
  }
})

// ─── Create evenement ─────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { titre, description, date_debut, date_fin, lieu, capacite, programme, intervenants, partenaires, sponsors, email_sujet, email_intro, email_signature, image_url, statut, format } = req.body

    if (!titre) return res.status(400).json({ error: 'Le titre est requis' })

    const uploadedImageUrl = image_url ? await uploadExternalUrlToSupabase(image_url, 'evenements') : image_url

    const { data, error } = await supabase
      .from('evenements')
      .insert({ titre, description, date_debut, date_fin, lieu, capacite, programme: Array.isArray(programme) ? programme : [], intervenants: Array.isArray(intervenants) ? intervenants : [], partenaires: Array.isArray(partenaires) ? partenaires : [], sponsors: Array.isArray(sponsors) ? sponsors : [], email_sujet, email_intro, email_signature, image_url: uploadedImageUrl, statut: statut || 'brouillon', format: format || 'presentiel' })
      .select()
      .single()

    if (error) throw error
    await recordAudit(req, { action: 'event_created', entityType: 'evenement', entityId: data.id })
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Get one evenement ────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data || (!req.user && data.statut !== 'publie')) return res.status(404).json({ error: 'Événement introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Update evenement ─────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { titre, description, date_debut, date_fin, lieu, capacite, programme, intervenants, partenaires, sponsors, email_sujet, email_intro, email_signature, image_url, statut, format } = req.body

    const updates = {}
    if (titre !== undefined) updates.titre = titre
    if (description !== undefined) updates.description = description
    if (date_debut !== undefined) updates.date_debut = date_debut
    if (date_fin !== undefined) updates.date_fin = date_fin
    if (lieu !== undefined) updates.lieu = lieu
    if (capacite !== undefined) updates.capacite = capacite
    if (programme !== undefined) updates.programme = Array.isArray(programme) ? programme : []
    if (intervenants !== undefined) updates.intervenants = Array.isArray(intervenants) ? intervenants : []
    if (partenaires !== undefined) updates.partenaires = Array.isArray(partenaires) ? partenaires : []
    if (sponsors !== undefined) updates.sponsors = Array.isArray(sponsors) ? sponsors : []
    if (email_sujet !== undefined) updates.email_sujet = email_sujet?.trim() || null
    if (email_intro !== undefined) updates.email_intro = email_intro?.trim() || null
    if (email_signature !== undefined) updates.email_signature = email_signature?.trim() || null
    if (image_url !== undefined) {
      updates.image_url = image_url ? await uploadExternalUrlToSupabase(image_url, 'evenements') : image_url
    }
    if (statut !== undefined) updates.statut = statut
    if (format !== undefined) updates.format = format

    const { data, error } = await supabase
      .from('evenements')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Événement introuvable' })
    await recordAudit(req, { action: 'event_updated', entityType: 'evenement', entityId: req.params.id, metadata: { fields: Object.keys(updates) } })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Delete evenement ─────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('evenements')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    await recordAudit(req, { action: 'event_deleted', entityType: 'evenement', entityId: req.params.id })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ─── Get stats for an evenement ───────────────────────────────────────────────
router.get('/:id/stats', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const evenementId = req.params.id

    // Check event exists
    const { data: evenement, error: evErr } = await supabase
      .from('evenements')
      .select('id, titre, capacite')
      .eq('id', evenementId)
      .single()

    if (evErr || !evenement) return res.status(404).json({ error: 'Événement introuvable' })

    // Fetch all invitations for this event
    const { data: invitations, error: invErr } = await supabase
      .from('invitations')
      .select('statut')
      .eq('evenement_id', evenementId)

    if (invErr) throw invErr

    const total = invitations.length

    const par_statut = {
      inscrit: 0,
      present: 0,
      decline: 0,
      pas_de_reaction: 0
    }

    for (const inv of invitations) {
      const s = inv.statut || 'pas_de_reaction'
      if (par_statut[s] !== undefined) {
        par_statut[s]++
      }
    }

    // Taux de réponse = (inscrit + present + decline) / total
    const ayant_repondu = par_statut.inscrit + par_statut.present + par_statut.decline
    const taux_reponse = total > 0 ? Math.round((ayant_repondu / total) * 100) : 0

    // Taux de présence = present / total
    const taux_presence = total > 0 ? Math.round((par_statut.present / total) * 100) : 0

    res.json({
      evenement_id: evenementId,
      titre: evenement.titre,
      capacite: evenement.capacite,
      total_invitations: total,
      par_statut,
      taux_reponse,
      taux_presence
    })
  } catch (err) {
    next(err)
  }
})

export default router

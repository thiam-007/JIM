import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

// ─── List all evenements ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .order('date_debut', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Create evenement ─────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { titre, description, date_debut, date_fin, lieu, capacite, image_url, statut } = req.body

    if (!titre) return res.status(400).json({ error: 'Le titre est requis' })
    if (!date_debut) return res.status(400).json({ error: 'La date de début est requise' })

    const { data, error } = await supabase
      .from('evenements')
      .insert({ titre, description, date_debut, date_fin, lieu, capacite, image_url, statut: statut || 'brouillon' })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Get one evenement ────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Événement introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Update evenement ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { titre, description, date_debut, date_fin, lieu, capacite, image_url, statut } = req.body

    const updates = {}
    if (titre !== undefined) updates.titre = titre
    if (description !== undefined) updates.description = description
    if (date_debut !== undefined) updates.date_debut = date_debut
    if (date_fin !== undefined) updates.date_fin = date_fin
    if (lieu !== undefined) updates.lieu = lieu
    if (capacite !== undefined) updates.capacite = capacite
    if (image_url !== undefined) updates.image_url = image_url
    if (statut !== undefined) updates.statut = statut

    const { data, error } = await supabase
      .from('evenements')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Événement introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Delete evenement ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('evenements')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ─── Get stats for an evenement ───────────────────────────────────────────────
router.get('/:id/stats', async (req, res, next) => {
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

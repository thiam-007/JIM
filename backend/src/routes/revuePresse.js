import express from 'express'
import supabase from '../config/supabase.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/revue-presse (Public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('revue_presse')
      .select('*')
      .order('date_publication', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erreur get revue_presse:', err.message)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// POST /api/revue-presse (Admin)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { titre, media_nom, description, url_lien, date_publication, image_url } = req.body
    const { data, error } = await supabase
      .from('revue_presse')
      .insert([{ titre, media_nom, description, url_lien, date_publication, image_url }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Erreur create revue_presse:', err.message)
    res.status(500).json({ error: "Erreur lors de la création" })
  }
})

// PUT /api/revue-presse/:id (Admin)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { titre, media_nom, description, url_lien, date_publication, image_url } = req.body
    
    const { data, error } = await supabase
      .from('revue_presse')
      .update({ titre, media_nom, description, url_lien, date_publication, image_url })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erreur update revue_presse:', err.message)
    res.status(500).json({ error: "Erreur lors de la mise à jour" })
  }
})

// DELETE /api/revue-presse/:id (Admin)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('revue_presse')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ message: "Article de presse supprimé" })
  } catch (err) {
    console.error('Erreur delete revue_presse:', err.message)
    res.status(500).json({ error: "Erreur lors de la suppression" })
  }
})

export default router

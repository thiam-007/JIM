import express from 'express'
import supabase from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /api/livre-dor (Public)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('livre_dor')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table doesn't exist yet, return empty array gracefully
      return res.json([])
    }
    res.json(data || [])
  } catch (err) {
    console.error('Erreur GET livre_dor:', err.message)
    res.json([])
  }
})

// POST /api/livre-dor (Public or Admin)
router.post('/', async (req, res) => {
  try {
    const { author, location, genre, text, date } = req.body
    if (!author || !text) {
      return res.status(400).json({ error: "Le nom et le message sont requis." })
    }

    const { data, error } = await supabase
      .from('livre_dor')
      .insert([{
        author,
        location: location || '',
        genre: genre || 'homme',
        text,
        date: date || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('Erreur POST livre_dor:', err.message)
    res.status(500).json({ error: "Erreur lors de l'enregistrement du message." })
  }
})

// PUT /api/livre-dor/:id (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { author, location, genre, text, date } = req.body

    const { data, error } = await supabase
      .from('livre_dor')
      .update({ author, location, genre, text, date })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erreur PUT livre_dor:', err.message)
    res.status(500).json({ error: "Erreur lors de la mise à jour du message." })
  }
})

// DELETE /api/livre-dor/:id (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('livre_dor')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ message: "Message supprimé avec succès." })
  } catch (err) {
    console.error('Erreur DELETE livre_dor:', err.message)
    res.status(500).json({ error: "Erreur lors de la suppression." })
  }
})

export default router

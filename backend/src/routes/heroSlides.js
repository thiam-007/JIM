import { Router } from 'express'
import crypto from 'crypto'
import supabase from '../config/supabase.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = Router()

// ─── Obtenir tous les slides (PUBLIC) ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      // Les visiteurs ne voient que les actifs
      .eq('actif', true)
      .order('ordre', { ascending: true })

    if (error) {
      // Si la table n'existe pas encore (avant migration) ou erreur de permission, on renvoie un tableau vide pour ne pas crasher
      if (error.code === '42P01' || error.code === '42501') {
        return res.json([])
      }
      throw error
    }
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// ─── Obtenir tous les slides (ADMIN) ──────────────────────────────────────────
router.get('/admin/all', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('ordre', { ascending: true })

    if (error) {
       if (error.code === '42P01' || error.code === '42501') return res.json([])
       throw error
    }
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// ─── Uploader un media (PROTECTED) ────────────────────────────────────────────
router.post('/upload', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { file, fileName, mimeType } = req.body

    if (!file || !fileName) {
      return res.status(400).json({ error: 'Fichier et nom de fichier requis' })
    }

    const base64Data = file.includes(';base64,') ? file.split(';base64,')[1] : file
    if (!/^[A-Za-z0-9+/=\s]+$/.test(base64Data)) {
      return res.status(400).json({ error: 'Données base64 invalides' })
    }
    const fileBuffer = Buffer.from(base64Data, 'base64')
    if (fileBuffer.length === 0 || fileBuffer.length > 8 * 1024 * 1024) {
      return res.status(413).json({ error: 'Fichier vide ou supérieur à 8 Mo' })
    }

    const finalMime = mimeType || 'image/jpeg'
    
    // Validate extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm']
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: `Extension non autorisée. Formats acceptés : ${allowedExtensions.join(', ')}` })
    }
    
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`
    const bucketName = 'hero_slides' // Ensure this bucket exists in Supabase!

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: finalMime,
        upsert: true
      })

    if (error) {
        if (error.message.includes('Bucket not found')) {
            return res.status(400).json({ error: "Le bucket 'hero_slides' n'existe pas dans Supabase Storage." })
        }
        throw error
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName)

    res.status(200).json({ url: data.publicUrl })
  } catch (err) {
    next(err)
  }
})

// ─── Créer un slide (PROTECTED) ───────────────────────────────────────────────
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { titre_principal, titre_secondaire, sous_titre, media_url, media_type, ordre, actif } = req.body

    if (!media_url) return res.status(400).json({ error: 'Le média est requis' })

    const { data, error } = await supabase
      .from('hero_slides')
      .insert({ 
        titre_principal, 
        titre_secondaire, 
        sous_titre, 
        media_url, 
        media_type: media_type || 'image', 
        ordre: ordre || 0, 
        actif: actif !== undefined ? actif : true 
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Mettre à jour un slide (PROTECTED) ───────────────────────────────────────
router.put('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { titre_principal, titre_secondaire, sous_titre, media_url, media_type, ordre, actif } = req.body

    const updates = {}
    if (titre_principal !== undefined) updates.titre_principal = titre_principal
    if (titre_secondaire !== undefined) updates.titre_secondaire = titre_secondaire
    if (sous_titre !== undefined) updates.sous_titre = sous_titre
    if (media_url !== undefined) updates.media_url = media_url
    if (media_type !== undefined) updates.media_type = media_type
    if (ordre !== undefined) updates.ordre = ordre
    if (actif !== undefined) updates.actif = actif

    const { data, error } = await supabase
      .from('hero_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Slide introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Supprimer un slide (PROTECTED) ───────────────────────────────────────────
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router

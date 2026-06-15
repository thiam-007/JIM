import { Router } from 'express'
import crypto from 'crypto'
import supabase from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { uploadExternalUrlToSupabase } from '../utils/imageUploader.js'

const router = Router()

// ─── Get all news (PUBLIC) ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('date_evenement', { ascending: false, nullsFirst: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    next(err)
  }
})

// ─── Get a single news by ID (PUBLIC) ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Article introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Upload image to Supabase Storage (PROTECTED) ────────────────────────────
router.post('/upload', authMiddleware, async (req, res, next) => {
  try {
    const { file, fileName, mimeType, bucket } = req.body

    if (!file || !fileName) {
      return res.status(400).json({ error: 'Fichier et nom de fichier requis' })
    }

    // Decode base64 image data (removes data:image/png;base64, header if present)
    const base64Data = file.includes(';base64,') ? file.split(';base64,')[1] : file
    const fileBuffer = Buffer.from(base64Data, 'base64')

    // Clean mimeType or set default
    const finalMime = mimeType || 'image/jpeg'

    // Generate unique name
    const fileExtension = fileName.split('.').pop() || 'jpg'
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`

    const bucketName = bucket || process.env.SUPABASE_NEWS_BUCKET || 'actualites'

    // Upload to Supabase Storage bucket
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: finalMime,
        upsert: true
      })

    if (error) throw error

    // Get public URL of the uploaded image
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName)

    res.status(200).json({ url: data.publicUrl })
  } catch (err) {
    next(err)
  }
})

// ─── Create single news (PROTECTED) ───────────────────────────────────────────
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { titre, description, contenu, image_url, image_detail_url, date_evenement } = req.body

    if (!titre) return res.status(400).json({ error: 'Le titre est requis' })

    const uploadedImageUrl = image_url ? await uploadExternalUrlToSupabase(image_url, 'actualites') : image_url
    const uploadedImageDetailUrl = image_detail_url ? await uploadExternalUrlToSupabase(image_detail_url, 'actualites') : image_detail_url

    const { data, error } = await supabase
      .from('actualites')
      .insert({ titre, description, contenu, image_url: uploadedImageUrl, image_detail_url: uploadedImageDetailUrl, date_evenement })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Update single news (PROTECTED) ───────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { titre, description, contenu, image_url, image_detail_url, date_evenement } = req.body

    const updates = {}
    if (titre !== undefined) updates.titre = titre
    if (description !== undefined) updates.description = description
    if (contenu !== undefined) updates.contenu = contenu
    if (date_evenement !== undefined) updates.date_evenement = date_evenement
    if (image_url !== undefined) {
      updates.image_url = image_url ? await uploadExternalUrlToSupabase(image_url, 'actualites') : image_url
    }
    if (image_detail_url !== undefined) {
      updates.image_detail_url = image_detail_url ? await uploadExternalUrlToSupabase(image_detail_url, 'actualites') : image_detail_url
    }

    const { data, error } = await supabase
      .from('actualites')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Article introuvable' })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Delete single news (PROTECTED) ───────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('actualites')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router

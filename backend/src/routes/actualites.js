import { Router } from 'express'
import crypto from 'crypto'
import supabase from '../config/supabase.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
import { uploadExternalUrlToSupabase } from '../utils/imageUploader.js'

const router = Router()

// ─── Get all news (PUBLIC) ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('date_evenement', { ascending: false, nullsFirst: true })

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
router.post('/upload', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { file, fileName, mimeType, bucket } = req.body

    if (!file || !fileName) {
      return res.status(400).json({ error: 'Fichier et nom de fichier requis' })
    }

    // Decode base64 image data (removes data:image/png;base64, header if present)
    const base64Data = file.includes(';base64,') ? file.split(';base64,')[1] : file
    if (!/^[A-Za-z0-9+/=\s]+$/.test(base64Data)) {
      return res.status(400).json({ error: 'Données base64 invalides' })
    }
    const fileBuffer = Buffer.from(base64Data, 'base64')
    if (fileBuffer.length === 0 || fileBuffer.length > 8 * 1024 * 1024) {
      return res.status(413).json({ error: 'Fichier vide ou supérieur à 8 Mo' })
    }

    // Clean mimeType or set default
    const finalMime = mimeType || 'image/jpeg'

    // Validate extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm']
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ error: `Extension non autorisée. Formats acceptés : ${allowedExtensions.join(', ')}` })
    }

    // Generate unique name
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`

    const allowedBuckets = new Set([
      process.env.SUPABASE_NEWS_BUCKET || 'actualites',
      process.env.SUPABASE_HERO_BUCKET || 'hero',
      'evenements'
    ])
    const bucketName = bucket || process.env.SUPABASE_NEWS_BUCKET || 'actualites'
    if (!allowedBuckets.has(bucketName)) return res.status(400).json({ error: 'Bucket non autorisé' })

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
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { titre, description, contenu, auteur, image_url, image_detail_url, date_evenement } = req.body

    if (!titre) return res.status(400).json({ error: 'Le titre est requis' })

    const uploadedImageUrl = image_url ? await uploadExternalUrlToSupabase(image_url, 'actualites') : image_url
    const uploadedImageDetailUrl = image_detail_url ? await uploadExternalUrlToSupabase(image_detail_url, 'actualites') : image_detail_url

    const { data, error } = await supabase
      .from('actualites')
      .insert({ titre, description, contenu, auteur, image_url: uploadedImageUrl, image_detail_url: uploadedImageDetailUrl, date_evenement })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
})

// ─── Update single news (PROTECTED) ───────────────────────────────────────────
router.put('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { titre, description, contenu, auteur, image_url, image_detail_url, date_evenement } = req.body

    const updates = {}
    if (titre !== undefined) updates.titre = titre
    if (description !== undefined) updates.description = description
    if (contenu !== undefined) updates.contenu = contenu
    if (auteur !== undefined) updates.auteur = auteur
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
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
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

// ─── Increment view count (PUBLIC) ────────────────────────────────────────────
router.post('/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params

    // Fetch current views
    const { data: article, error: fetchErr } = await supabase
      .from('actualites')
      .select('id, views')
      .eq('id', id)
      .single()

    if (fetchErr || !article) return res.status(404).json({ error: 'Article introuvable' })

    const { data, error } = await supabase
      .from('actualites')
      .update({ views: (article.views || 0) + 1 })
      .eq('id', id)
      .select('id, views')
      .single()

    if (error) throw error
    res.json({ views: data.views })
  } catch (err) {
    next(err)
  }
})

// ─── Get article rating stats (PUBLIC) ────────────────────────────────────────
router.get('/:id/rating', async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('article_ratings')
      .select('rating')
      .eq('article_id', id)

    if (error) throw error

    const count = (data || []).length
    const avg = count > 0
      ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0

    res.json({ avg, count })
  } catch (err) {
    next(err)
  }
})

// ─── Submit a rating (PUBLIC, once per IP per article) ────────────────────────
router.post('/:id/rate', async (req, res, next) => {
  try {
    const { id } = req.params
    const { rating } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' })
    }

    // Hash the IP to preserve privacy
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex')

    // Upsert: if the same IP already voted, update their rating
    const { data, error } = await supabase
      .from('article_ratings')
      .upsert(
        { article_id: id, rating: parseInt(rating), ip_hash: ipHash },
        { onConflict: 'article_id,ip_hash' }
      )
      .select()
      .single()

    if (error) throw error

    // Return updated stats
    const { data: allRatings } = await supabase
      .from('article_ratings')
      .select('rating')
      .eq('article_id', id)

    const count = (allRatings || []).length
    const avg = count > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0

    res.json({ success: true, avg, count, userRating: parseInt(rating) })
  } catch (err) {
    next(err)
  }
})

export default router

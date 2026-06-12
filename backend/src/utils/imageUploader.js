import crypto from 'crypto'
import supabase from '../config/supabase.js'

/**
 * Downloads an external image from a URL and uploads it to a Supabase storage bucket.
 * Returns the public Supabase URL if successful, otherwise returns the original URL.
 * 
 * @param {string} url - The external image URL
 * @param {string} bucketName - The target Supabase storage bucket
 * @returns {Promise<string|null>} The uploaded image URL or original URL
 */
export async function uploadExternalUrlToSupabase(url, bucketName) {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // If it's already a Supabase storage URL for this project, or not a http URL, return as-is
  const supabaseUrl = process.env.SUPABASE_URL
  if (supabaseUrl && trimmed.startsWith(supabaseUrl)) {
    return trimmed
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed
  }

  try {
    console.log(`[ImageUploader] Fetching external image: ${trimmed}`)
    const response = await fetch(trimmed, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      console.warn(`[ImageUploader] Failed to fetch external image: ${response.status} ${response.statusText}`)
      return trimmed // fallback
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      console.warn(`[ImageUploader] Fetched URL content-type is not an image: ${contentType}`)
      return trimmed // fallback
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const urlPath = trimmed.split('?')[0]
    const fileExtension = urlPath.split('.').pop() || 'jpg'
    const cleanExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension.toLowerCase()) ? fileExtension : 'jpg'
    const uniqueFileName = `${crypto.randomUUID()}.${cleanExtension}`

    console.log(`[ImageUploader] Uploading fetched image to bucket "${bucketName}" as "${uniqueFileName}"`)
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, buffer, {
        contentType: contentType,
        upsert: true
      })

    if (error) throw error

    // Get public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName)

    console.log(`[ImageUploader] Successfully uploaded external image. Public URL: ${data.publicUrl}`)
    return data.publicUrl
  } catch (err) {
    console.error(`[ImageUploader] Error uploading external image ${trimmed}:`, err.message)
    return trimmed // fallback to original URL
  }
}

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import supabase from './src/config/supabase.js'

async function upload() {
  try {
    const filePath = path.resolve('../frontend/public/images/logo-white.png')
    const fileBuffer = fs.readFileSync(filePath)
    
    const { data, error } = await supabase.storage
      .from('actualites')
      .upload('logo-white.png', fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error('Upload failed:', error)
    } else {
      console.log('Upload success! Public URL:', `${process.env.SUPABASE_URL}/storage/v1/object/public/actualites/logo-white.png`)
    }
  } catch (err) {
    console.error('Error running script:', err.message)
  }
}

upload()

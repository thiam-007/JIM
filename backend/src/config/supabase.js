import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY environment variables')
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const storageBuckets = [
  { name: process.env.SUPABASE_NEWS_BUCKET || 'actualites', public: true },
  { name: process.env.SUPABASE_HERO_BUCKET || 'hero', public: true },
  { name: 'evenements', public: true }
]

export async function ensureStorageBuckets() {
  try {
    const { data: existingBuckets = [], error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError

    const existingNames = new Set((existingBuckets || []).map((bucket) => bucket.name))

    for (const bucket of storageBuckets) {
      if (existingNames.has(bucket.name)) continue

      const { error: createError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public
      })

      if (createError) {
        console.warn(`[supabase] impossible de créer le bucket ${bucket.name}:`, createError.message)
      }
    }
  } catch (err) {
    console.warn('[supabase] initialisation storage ignorée:', err.message)
  }
}

export default supabase

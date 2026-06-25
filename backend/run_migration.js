import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running migration to create hero_slides table...')

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS hero_slides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      titre_principal VARCHAR,
      titre_secondaire VARCHAR,
      sous_titre TEXT,
      media_url TEXT NOT NULL,
      media_type VARCHAR DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
      ordre INTEGER DEFAULT 0,
      actif BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  const createTriggerQuery = `
    CREATE OR REPLACE TRIGGER trg_hero_slides_updated
      BEFORE UPDATE ON hero_slides
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `

  // Execute using postgres function or raw RPC if available, 
  // but since we might not have RPC for arbitrary SQL, we will use a workaround or try to insert dummy data to see if it fails.
  // Actually, Supabase REST API doesn't allow raw DDL via supabase-js directly unless we have a specific RPC like 'exec_sql'.
  console.log('NOTE: To execute DDL (CREATE TABLE), you must run this SQL directly in the Supabase Dashboard SQL Editor.')
  console.log('Query:\\n', createTableQuery, '\\n', createTriggerQuery)
}

runMigration()

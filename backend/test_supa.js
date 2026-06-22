import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('revue_presse')
    .select('*')
    .order('date_publication', { ascending: false })
  
  if (error) {
    console.error("Supabase Error:", error)
  } else {
    console.log("Supabase Data:", data)
  }
}

test()

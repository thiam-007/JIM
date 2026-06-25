import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSelect() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .limit(1);

  console.log(JSON.stringify({ data, error }, null, 2));
}

testSelect();

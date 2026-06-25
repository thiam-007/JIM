import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdate() {
  const payload = {
    prenom: 'Test2',
    nom: 'Kolié',
    institution: 'Indépendant',
    fonction: 'Expert juridique - Musée virtuel',
    email: 'aimebernardkolie87@gmail.com7'
  };

  console.log("Updating with payload:", payload);
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update(payload)
    .eq('id', 'a9712f62-6fd1-4e9c-a983-109997789859')
    .select()
    .single();

  console.log(JSON.stringify({ data, error }, null, 2));
}

testUpdate();

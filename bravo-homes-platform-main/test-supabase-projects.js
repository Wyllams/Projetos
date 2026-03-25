import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkProjects() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  console.log('Sample project:', data);
  console.log('Error:', error);
}

checkProjects();

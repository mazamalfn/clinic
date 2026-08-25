import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) console.error(error);
  console.log('Users in DB:');
  for (const u of users) {
    const match = await bcrypt.compare('Secretaire123!', u.mot_de_passe);
    console.log(`User: ${u.email}`);
    console.log(`  Hash in DB: "${u.mot_de_passe}"`);
    console.log(`  Length of hash: ${u.mot_de_passe ? u.mot_de_passe.length : 0}`);
    console.log(`  bcrypt.compare('Secretaire123!'): ${match}`);
  }
}

check();

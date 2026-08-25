import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const correctHash = '$2b$10$BbVw5nzdUU0rZrYJq32XseuipqfHikxsF6tVHkBhYG6zEfqzXzWya';

async function fixPasswords() {
  const { data, error } = await supabase
    .from('users')
    .update({ mot_de_passe: correctHash })
    .not('id', 'is', null);

  if (error) {
    console.error('Error updating passwords:', error);
  } else {
    console.log('Successfully updated all user password hashes in Supabase!');
  }
}

fixPasswords();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('Key defined:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function testSeed() {
  const tables = ['users', 'patients', 'appointments', 'consultations', 'prescriptions', 'prescription_items'];
  console.log('\n--- Checking Supabase tables ---');
  let allOk = true;
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    if (error) {
      console.error(`❌ Table '${table}': ERROR ->`, error.message);
      allOk = false;
    } else {
      console.log(`✅ Table '${table}': ${data.length} row(s) found.`);
      if (data.length > 0) {
        console.log(`   Sample:`, JSON.stringify(data[0]).substring(0, 120) + '...');
      }
    }
  }
  return allOk;
}

testSeed()
  .then((ok) => {
    if (!ok) process.exit(1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

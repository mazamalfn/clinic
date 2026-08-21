import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('your-project-id')) {
  console.warn('⚠️ ATTENTION: SUPABASE_URL n\'est pas encore configuré dans server/.env');
}

if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key')) {
  console.warn('⚠️ ATTENTION: SUPABASE_SERVICE_ROLE_KEY n\'est pas encore configuré dans server/.env');
}

// Client Supabase avec la clé Service Role pour autoriser les requêtes d'administration backend
export const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

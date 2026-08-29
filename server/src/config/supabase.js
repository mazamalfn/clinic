/**
 * ==============================================================================
 * CLIENT SUPABASE BACKEND (server/src/config/supabase.js)
 * ==============================================================================
 * Rôle : Initialise l'instance unique du client Supabase avec la clé "Service Role".
 * Cette clé permet au serveur d'exécuter des opérations d'administration directe
 * sur la base de données PostgreSQL sans restriction RLS côté serveur.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Avertissements en console si les identifiants Supabase ne sont pas saisis dans .env
if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('your-project-id')) {
  console.warn('⚠️ ATTENTION: SUPABASE_URL n\'est pas encore configuré dans server/.env');
}

if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key')) {
  console.warn('⚠️ ATTENTION: SUPABASE_SERVICE_ROLE_KEY n\'est pas encore configuré dans server/.env');
}

/**
 * Instance du client Supabase réutilisée par tous les services backend
 */
export const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
  {
    auth: {
      persistSession: false, // Pas de persistance de session utilisateur côté serveur
      autoRefreshToken: false,
    },
  }
);

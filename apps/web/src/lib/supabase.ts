import { createClient } from '@supabase/supabase-js';

import { env } from './env';

/**
 * The single Supabase client for the whole app.
 *
 * V1 is Supabase-first: authenticated CRUD goes straight from the browser to
 * PostgreSQL and Row Level Security is the authorization boundary. Only the
 * anon key is used here — it is public by design and grants nothing on its own.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'dcafolio.auth',
  },
});

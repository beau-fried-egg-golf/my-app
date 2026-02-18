import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

// Auth client — for sign-in, sign-out, session management
export const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY);

// Data client — uses service role key to bypass RLS, never picks up user session
export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  global: {
    headers: SERVICE_KEY ? { Authorization: `Bearer ${SERVICE_KEY}` } : {},
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

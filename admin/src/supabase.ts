import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
}

// Use anon key for API gateway (sb_publishable_ format), but override
// Authorization header with service role JWT to bypass RLS
export const supabase = createClient(SUPABASE_URL, ANON_KEY, SERVICE_KEY ? {
  global: {
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  },
} : undefined);

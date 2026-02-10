import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY env vars');
}

// Admin client uses service_role key — bypasses RLS
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

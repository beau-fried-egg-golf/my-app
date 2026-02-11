import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://maylqohoflkarvgadttn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5AW9GTC_H9yzgVkd2P25dw_FxjokPg5';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

// Safe to use at module level — lazily initialized on first property access
// For SSR (expo export), we need to avoid creating the client at import time
export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : new Proxy({} as ReturnType<typeof createClient>, {
      get(_target, prop, receiver) {
        const client = getSupabase();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
          return value.bind(client);
        }
        return value;
      },
    });

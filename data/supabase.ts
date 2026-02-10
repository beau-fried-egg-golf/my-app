import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://maylqohoflkarvgadttn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5AW9GTC_H9yzgVkd2P25dw_FxjokPg5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

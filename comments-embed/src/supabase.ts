export const SUPABASE_URL = 'https://maylqohoflkarvgadttn.supabase.co';
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
export const REST_URL = `${SUPABASE_URL}/rest/v1`;
export const ANON_KEY = 'sb_publishable_5AW9GTC_H9yzgVkd2P25dw_FxjokPg5';

export const restHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

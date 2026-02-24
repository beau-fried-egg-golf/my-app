import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://maylqohoflkarvgadttn.supabase.co',
  'sb_publishable_5AW9GTC_H9yzgVkd2P25dw_FxjokPg5'
);

// Try hiding the 0-byte photo
const { error: hideErr } = await sb
  .from('photos')
  .update({ hidden: true })
  .eq('id', '4275afbd-0283-4009-98c4-a90a327a2cc3');

console.log('Hide photo:', hideErr ? 'FAILED - ' + hideErr.message : 'OK');

// Verify
const { data } = await sb
  .from('photos')
  .select('id, hidden')
  .eq('id', '4275afbd-0283-4009-98c4-a90a327a2cc3')
  .single();

console.log('Photo after update:', JSON.stringify(data));

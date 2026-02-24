import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://maylqohoflkarvgadttn.supabase.co',
  'sb_publishable_5AW9GTC_H9yzgVkd2P25dw_FxjokPg5'
);

// Check profile images
const { data: profiles } = await sb.from('profiles').select('id, name, image').not('image', 'is', null).limit(10);
console.log('Profiles with images:');
for (const p of profiles ?? []) {
  try {
    const resp = await fetch(p.image, { method: 'HEAD' });
    console.log(`  ${p.name}: ${resp.status} ${resp.statusText} (${resp.headers.get('content-length')} bytes) - ${p.image.slice(0, 80)}...`);
  } catch (e) {
    console.log(`  ${p.name}: FETCH ERROR - ${e.message}`);
  }
}

// Check the Supabase storage bucket for photos
const { data: photos } = await sb.from('photos').select('id, url, created_at').order('created_at', { ascending: false }).limit(5);
console.log('\nRecent photos:');
for (const ph of photos ?? []) {
  try {
    const resp = await fetch(ph.url, { method: 'HEAD' });
    console.log(`  ${ph.id.slice(0,8)}: ${resp.status} (${resp.headers.get('content-length')} bytes) - ${ph.url.slice(0, 80)}...`);
  } catch (e) {
    console.log(`  ${ph.id.slice(0,8)}: FETCH ERROR - ${e.message}`);
  }
}

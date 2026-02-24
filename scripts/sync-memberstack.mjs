/**
 * One-time migration script: Sync Memberstack member IDs to Supabase profiles.
 *
 * Pulls all members from the Memberstack Admin API and writes `memberstack_id`
 * to matching profiles in Supabase (matched by email via `get_user_id_by_email` RPC).
 *
 * Usage:
 *   MEMBERSTACK_SECRET_KEY=sk_... \
 *   SUPABASE_URL=https://maylqohoflkarvgadttn.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/sync-memberstack.mjs [--dry-run]
 */

const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MEMBERSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: MEMBERSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('=== DRY RUN MODE — no writes will be made ===\n');

async function fetchMemberstackMembers() {
  const members = [];
  let hasMore = true;
  let after = undefined;

  while (hasMore) {
    const params = new URLSearchParams({ limit: '100' });
    if (after) params.set('after', after);

    const resp = await fetch(`https://admin.memberstack.com/members?${params}`, {
      headers: { 'X-API-KEY': MEMBERSTACK_SECRET_KEY },
    });

    if (!resp.ok) {
      console.error('Memberstack API error:', resp.status, await resp.text());
      process.exit(1);
    }

    const data = await resp.json();
    members.push(...(data.data || []));

    hasMore = data.hasNextPage ?? false;
    after = data.endCursor;

    console.log(`  Fetched ${members.length} members so far...`);
  }

  return members;
}

async function supabaseRpc(fnName, params) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function supabaseUpdate(table, id, fields) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  return resp.ok;
}

async function main() {
  console.log('Fetching Memberstack members...');
  const members = await fetchMemberstackMembers();
  console.log(`\nTotal Memberstack members: ${members.length}\n`);

  let matched = 0;
  let notFound = 0;
  let errors = 0;

  for (const member of members) {
    const email = member.auth?.email;
    if (!email) {
      console.log(`  SKIP: No email for member ${member.id}`);
      continue;
    }

    const userId = await supabaseRpc('get_user_id_by_email', { lookup_email: email });

    if (!userId) {
      console.log(`  NOT FOUND: ${email}`);
      notFound++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  WOULD UPDATE: ${email} → profile ${userId}, memberstack_id=${member.id}`);
      matched++;
      continue;
    }

    const ok = await supabaseUpdate('profiles', userId, { memberstack_id: member.id });
    if (ok) {
      console.log(`  UPDATED: ${email} → memberstack_id=${member.id}`);
      matched++;
    } else {
      console.log(`  ERROR: Failed to update profile for ${email}`);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Matched & updated: ${matched}`);
  console.log(`  Not found in app:  ${notFound}`);
  console.log(`  Errors:            ${errors}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes were written)');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

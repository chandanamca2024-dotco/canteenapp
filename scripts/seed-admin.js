// Seed an admin user in Supabase (email + password) and upsert profile
// Usage (PowerShell on Windows):
// $env:SUPABASE_URL="https://drhkxyhffyndzvsgdufd.supabase.co"; \
// $env:SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY>"; \
// $env:ADMIN_EMAIL="admin@dinedesk.com"; \
// $env:ADMIN_PASSWORD="StrongAdminPassword123!"; \
// node scripts/seed-admin.js

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL;
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY; // SERVICE ROLE KEY ONLY
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!url || !srk || !email || !password) {
    console.error('[seed-admin] Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
    process.exit(1);
  }

  const adminClient = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } });

  let userId = null;

  // 1) Try to create the user
  const createRes = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', is_admin: true },
  });

  if (createRes.error && createRes.error.message && !createRes.error.message.includes('already registered')) {
    console.error('[seed-admin] Create user error:', createRes.error);
    process.exit(1);
  }

  if (createRes.data && createRes.data.user) {
    userId = createRes.data.user.id;
    console.log('[seed-admin] Admin user created:', email);
  } else {
    // Already exists: fetch by email
    const listRes = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1, email });
    const found = listRes.data?.users?.find(u => (u.email || '').toLowerCase() === email);
    if (!found) {
      console.error('[seed-admin] Could not find existing user after create attempt.');
      process.exit(1);
    }
    userId = found.id;
    console.log('[seed-admin] Admin user already existed. Using id:', userId);
  }

  // 2) Upsert into profiles
  const upsertRes = await adminClient.from('profiles').upsert({
    id: userId,
    email,
    role: 'Admin',
    is_admin: true,
  }, { onConflict: 'id' });

  if (upsertRes.error) {
    console.error('[seed-admin] Upsert profiles error:', upsertRes.error);
    process.exit(1);
  }

  // 3) Optional: seed an admin login record
  await adminClient.from('admin_logins').insert({
    admin_user: userId,
    email,
    device: 'seed',
    app_version: 'seed',
    success: true,
  }).catch(() => {});

  console.log('[seed-admin] Admin seeded successfully. Email:', email);
}

main().catch((e) => {
  console.error('[seed-admin] Fatal error:', e);
  process.exit(1);
});

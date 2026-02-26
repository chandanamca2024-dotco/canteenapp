-- Run this SQL in your Supabase SQL editor or psql to inspect your user data
SELECT id, name, email, role, is_admin, is_active, created_at
FROM profiles
ORDER BY created_at DESC;

-- To check for users that should show up in your admin panel:
SELECT id, name, email, role, is_admin, is_active, created_at
FROM profiles
WHERE (role = 'Student' OR role = 'Staff') AND is_admin = false;

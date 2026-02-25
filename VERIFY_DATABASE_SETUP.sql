-- =====================================================
-- VERIFY DATABASE SETUP FOR LOGIN
-- =====================================================
-- Run each query in Supabase SQL Editor to verify
-- your database is properly configured for login

-- ✅ Query 1: Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'profiles'
) as "profiles_table_exists";
-- Expected result: true

-- ✅ Query 2: Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
-- Expected columns: id, email, name, phone, role, is_active, created_at, updated_at, login_type, status

-- ✅ Query 3: Check RLS is enabled on profiles
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- Expected result: schemaname=public, tablename=profiles, rowsecurity=true

-- ✅ Query 4: Check all RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname, cmd;
-- Expected to show 6-8 policies including:
-- - "Users can insert own profile" (INSERT)
-- - "Users can view own profile" (SELECT)
-- - "Users can update own profile" (UPDATE)
-- - "Admins can view all profiles" (SELECT)
-- - "Staff can view all profiles" (SELECT)
-- - "Admins can update all profiles" (UPDATE)

-- ✅ Query 5: Check if profiles table has data
SELECT COUNT(*) as "user_count", 
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as "admin_count",
       COUNT(CASE WHEN role = 'canteen staff' THEN 1 END) as "staff_count",
       COUNT(CASE WHEN role = 'Student' THEN 1 END) as "student_count"
FROM public.profiles;
-- Expected result: Shows count of users by role

-- ✅ Query 6: Check if auth.users table exists (Supabase Auth)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users' 
  AND table_schema = 'auth'
) as "auth_users_table_exists";
-- Expected result: true (Supabase creates this automatically)

-- ✅ Query 7: Check foreign key relationship
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'profiles'
AND column_name = 'id';
-- Expected: profiles.id → auth.users.id (with ON DELETE CASCADE)

-- ✅ Query 8: Test as an authenticated user (run after logging in)
-- This query won't work in the console, but shows what happens during login
-- SELECT id, email, role, is_active FROM profiles WHERE id = auth.uid();
-- Expected result: Returns your own profile

-- ✅ Query 9: Check trigger exists
SELECT schemaname, tablename, triggerfunction, triggername
FROM (
  SELECT n.nspname AS schemaname,
         c.relname AS tablename,
         p.proname AS triggerfun, 
         t.tgname AS triggername,
         p.proname as triggerfunc
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
) foo
WHERE tablename = 'profiles';
-- Expected: Should show update_profiles_updated_at trigger for update_updated_at_column function

-- ✅ Query 10: Verify Supabase configuration
-- Check that your credentials are working by running a simple query
SELECT auth.uid() as "current_user_id", 
       now() as "server_time";
-- Expected result: Shows current authenticated user (if logged in) and server time

-- =====================================================
-- IF ANYTHING ABOVE FAILS:
-- =====================================================
-- 1. Run FIX_LOGIN_COMPLETE.sql to fix RLS policies
-- 2. Then run this verification script again
-- 3. All checks should pass

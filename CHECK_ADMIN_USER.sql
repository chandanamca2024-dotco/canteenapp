-- Run this in your Supabase SQL Editor to check if admin user exists

-- 1. Check if admin user exists in auth.users
SELECT 
  id, 
  email, 
  created_at,
  confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@dinedesk.com';

-- 2. Check if admin profile exists in profiles table
SELECT 
  id, 
  email, 
  role,
  is_admin,
  created_at
FROM profiles 
WHERE email = 'admin@dinedesk.com';

-- 3. If admin user doesn't exist, create it:
-- IMPORTANT: Run these commands ONE AT A TIME in Supabase SQL Editor

-- Step 1: Create admin auth user (if not exists)
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@dinedesk.com
-- Password: Admin@123 (or your choice)
-- ✅ Check "Auto Confirm User"

-- Step 2: After creating user in UI, run this to create/update profile:
INSERT INTO profiles (id, email, name, role, is_admin, is_active)
SELECT 
  id,
  'admin@dinedesk.com',
  'Admin User',
  'admin',
  true,
  true
FROM auth.users
WHERE email = 'admin@dinedesk.com'
ON CONFLICT (id) 
DO UPDATE SET
  role = 'admin',
  is_admin = true,
  is_active = true;

-- Step 3: Verify admin user is set up correctly
SELECT 
  au.id,
  au.email as auth_email,
  au.confirmed_at,
  p.email as profile_email,
  p.role,
  p.is_admin,
  p.is_active
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@dinedesk.com';

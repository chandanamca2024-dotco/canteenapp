-- ========================================
-- FIX COLLEGE STAFF ROLE ISSUE
-- Run this in Supabase SQL Editor
-- ========================================

-- STEP 1: Check all users and their current roles
SELECT 
  email,
  name,
  role,
  is_active
FROM profiles
ORDER BY created_at DESC;

-- STEP 2: Update YOUR email to 'Staff' role
-- REPLACE 'your-email@example.com' with your actual email address
UPDATE profiles 
SET role = 'Staff'
WHERE email = 'your-email@example.com';

-- STEP 3: Verify the update worked
SELECT 
  email,
  name,
  role
FROM profiles
WHERE email = 'your-email@example.com';

-- ========================================
-- POSSIBLE ROLE VALUES:
-- 'Student' - Regular students
-- 'Staff' - College staff (recommended)
-- 'canteen staff' - Canteen staff
-- 'admin' - Administrators
-- ========================================

-- =====================================================
-- FIX ROLE STRUCTURE FOR STUDENT AND STAFF
-- =====================================================
-- This script updates the profiles table to use:
-- - 'Student' for regular users
-- - 'Staff' for staff users
-- - 'admin' for administrators
-- - 'canteen staff' for kitchen staff
-- Run this in your Supabase SQL Editor

-- Step 1: Remove existing constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update the role column with new default
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'Student';

-- Step 3: Add new constraint with correct role values
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('Student', 'Staff', 'admin', 'canteen staff'));

-- Step 4: Migrate existing data to use new role format
UPDATE profiles 
SET role = 'Student' 
WHERE role = 'user' OR role = 'User';

UPDATE profiles 
SET role = 'Staff' 
WHERE role = 'staff' AND role != 'canteen staff';

-- Step 5: Verify the changes
-- Run this query to see all roles:
-- SELECT DISTINCT role, COUNT(*) as count FROM profiles GROUP BY role;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- Database now uses:
-- - 'Student' for regular student users
-- - 'Staff' for staff users
-- - 'admin' for administrators
-- - 'canteen staff' for kitchen staff

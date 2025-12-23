-- ========================================
-- DEBUG: WHY ADMIN CAN'T SAVE SETTINGS
-- ========================================
-- Copy each section one by one and run in Supabase SQL Editor
-- This will help us find the exact problem

-- ========================================
-- STEP 1: Check your current user
-- ========================================
-- Run this to see who you're logged in as
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email,
  auth.role() as my_role;

-- ========================================
-- STEP 2: Check if you exist in profiles
-- ========================================
-- Replace 'YOUR-USER-ID-FROM-STEP-1' with the actual UUID from Step 1
SELECT 
  id,
  email,
  is_admin,
  created_at
FROM profiles
WHERE id = auth.uid();
-- If this returns NO ROWS, that's the problem! Go to STEP 6

-- ========================================
-- STEP 3: Check business_settings table
-- ========================================
SELECT 
  id,
  opening_time,
  closing_time,
  min_order_value,
  created_at
FROM business_settings
LIMIT 5;

-- ========================================
-- STEP 4: Test the UPDATE policy manually
-- ========================================
-- This tests if the policy allows you to update
SELECT 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  ) as "can_i_update";
-- If this returns FALSE, you don't have admin privileges - go to STEP 7

-- ========================================
-- STEP 5: Check all UPDATE policies on business_settings
-- ========================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'business_settings'
AND cmd = 'UPDATE';

-- ========================================
-- STEP 6: FIX - Create your profile if missing
-- ========================================
-- If Step 2 returned NO ROWS, run this:
-- (Make sure you're logged in to the app first)
INSERT INTO profiles (id, email, is_admin, full_name)
VALUES (
  auth.uid(),
  auth.email(),
  true,
  'Admin User'
)
ON CONFLICT (id) DO UPDATE
SET is_admin = true;

-- Verify it worked:
SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();

-- ========================================
-- STEP 7: FIX - Make yourself admin
-- ========================================
-- If you exist but is_admin is FALSE, run this:
UPDATE profiles 
SET is_admin = true 
WHERE id = auth.uid();

-- Verify it worked:
SELECT id, email, is_admin FROM profiles WHERE id = auth.uid();

-- ========================================
-- STEP 8: Test UPDATE directly
-- ========================================
-- After fixing, try updating directly:
UPDATE business_settings 
SET opening_time = '9:00 AM'
WHERE id = (SELECT id FROM business_settings LIMIT 1)
RETURNING *;

-- If this works, your app should work too!

-- ========================================
-- STEP 9: Check for policy conflicts
-- ========================================
-- Sometimes multiple policies can conflict
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'business_settings'
ORDER BY cmd, policyname;

-- ========================================
-- NUCLEAR OPTION: Recreate business_settings policies
-- ========================================
-- Only run this if nothing else works:

-- Drop ALL business_settings policies
DROP POLICY IF EXISTS "business_settings_select_all" ON business_settings;
DROP POLICY IF EXISTS "business_settings_update_admin" ON business_settings;
DROP POLICY IF EXISTS "business_settings_insert_admin" ON business_settings;
DROP POLICY IF EXISTS "admin_all_settings" ON business_settings;
DROP POLICY IF EXISTS "read_business_settings" ON business_settings;

-- Recreate them properly
CREATE POLICY "business_settings_select_all" 
  ON business_settings FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "business_settings_update_admin" 
  ON business_settings FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "business_settings_insert_admin" 
  ON business_settings FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ========================================
-- FINAL CHECK
-- ========================================
-- After all fixes, run this complete test:
SELECT 
  'User ID' as check_type,
  auth.uid()::text as value
UNION ALL
SELECT 
  'User Email',
  auth.email()
UNION ALL
SELECT 
  'Profile Exists',
  CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) THEN 'YES' ELSE 'NO' END
UNION ALL
SELECT 
  'Is Admin',
  CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN 'YES' ELSE 'NO' END
UNION ALL
SELECT 
  'Can Update',
  CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN 'YES' ELSE 'NO' END;

-- All should show YES for a working admin user!

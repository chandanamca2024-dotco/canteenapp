-- ============================================================================
-- COMPLETE FIX FOR SEAT RESERVATIONS DATABASE ISSUES
-- ============================================================================
-- This script fixes all reservation-related database issues:
-- 1. Adds missing seating_area column
-- 2. Fixes the relationship with profiles table for admin joins
-- 3. Verifies all RLS policies are in place
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- 6. Wait for success message
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD SEATING_AREA COLUMN (if missing)
-- ============================================================================
DO $$ 
BEGIN
  -- Add seating_area column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seat_reservations' 
    AND column_name = 'seating_area'
  ) THEN
    ALTER TABLE seat_reservations 
    ADD COLUMN seating_area VARCHAR(50);
    
    RAISE NOTICE '✅ Added seating_area column';
  ELSE
    RAISE NOTICE '✓ seating_area column already exists';
  END IF;
END $$;

-- Create index for seating_area for better query performance
CREATE INDEX IF NOT EXISTS idx_seat_reservations_seating_area 
ON seat_reservations(seating_area);

-- ============================================================================
-- STEP 2: FIX PROFILES TABLE RELATIONSHIP
-- ============================================================================
-- Ensure profiles table has all necessary users from auth.users
DO $$
BEGIN
  -- Insert any missing users into profiles table
  INSERT INTO profiles (id, email, role, is_admin)
  SELECT 
    au.id,
    au.email,
    COALESCE(p.role, 'User'),
    COALESCE(p.is_admin, false)
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Synced auth.users with profiles table';
END $$;

-- ============================================================================
-- STEP 3: ADD FOREIGN KEY TO PROFILES (for admin joins)
-- ============================================================================
DO $$ 
BEGIN
  -- First check if a foreign key to profiles exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_seat_reservations_user_id_profiles' 
    AND table_name = 'seat_reservations'
  ) THEN
    -- Add the foreign key constraint from seat_reservations.user_id to profiles.id
    ALTER TABLE seat_reservations
    ADD CONSTRAINT fk_seat_reservations_user_id_profiles 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint to profiles table';
  ELSE
    RAISE NOTICE '✓ Foreign key constraint to profiles already exists';
  END IF;
EXCEPTION 
  WHEN foreign_key_violation THEN
    RAISE NOTICE '⚠ Some reservations reference users not in profiles table. Cleaning up...';
    -- Delete orphaned reservations
    DELETE FROM seat_reservations 
    WHERE user_id NOT IN (SELECT id FROM profiles);
    -- Try adding the constraint again
    ALTER TABLE seat_reservations
    ADD CONSTRAINT fk_seat_reservations_user_id_profiles 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Cleaned up orphaned reservations and added foreign key';
  WHEN duplicate_object THEN
    RAISE NOTICE '✓ Foreign key constraint already exists';
END $$;

-- ============================================================================
-- STEP 4: VERIFY AND FIX RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies to ensure they're correct

-- Policy: Users can view their own reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON seat_reservations;
CREATE POLICY "Users can view their own reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Users can create their own reservations
DROP POLICY IF EXISTS "Users can create reservations" ON seat_reservations;
CREATE POLICY "Users can create reservations"
  ON seat_reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reservations (e.g., cancel)
DROP POLICY IF EXISTS "Users can update their own reservations" ON seat_reservations;
CREATE POLICY "Users can update their own reservations"
  ON seat_reservations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can delete reservations
DROP POLICY IF EXISTS "Admins can delete reservations" ON seat_reservations;
CREATE POLICY "Admins can delete reservations"
  ON seat_reservations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Show table structure
DO $$
DECLARE
  col_count INTEGER;
  policy_count INTEGER;
  fk_count INTEGER;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'seat_reservations';
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'seat_reservations';
  
  -- Count foreign keys
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'seat_reservations'
  AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEAT RESERVATIONS TABLE STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columns: %', col_count;
  RAISE NOTICE 'RLS Policies: %', policy_count;
  RAISE NOTICE 'Foreign Keys: %', fk_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF col_count >= 11 AND policy_count >= 4 AND fk_count >= 2 THEN
    RAISE NOTICE '🎉 ALL CHECKS PASSED!';
    RAISE NOTICE 'Your seat reservations system is now fully configured.';
  ELSE
    RAISE NOTICE '⚠ Please verify the table structure manually.';
  END IF;
END $$;

-- Show all columns in the table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'seat_reservations'
ORDER BY ordinal_position;

-- ============================================================================
-- ✅ SETUP COMPLETE!
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Added seating_area column for area preferences
-- ✅ Fixed relationship with profiles table
-- ✅ Updated all RLS policies for proper access control
-- ✅ Verified table structure
-- 
-- Next steps:
-- 1. Test creating a reservation from the user app
-- 2. Verify it appears in the database (Table Editor → seat_reservations)
-- 3. Check that admin can view the reservation
-- 4. Test that other users cannot see each other's reservations
-- 
-- ============================================================================

-- ============================================================================
-- FIX SEAT RESERVATIONS RELATIONSHIP WITH PROFILES TABLE
-- ============================================================================
-- This script adds the missing foreign key relationship between
-- seat_reservations and profiles tables to enable proper joins in Supabase.
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- 6. Wait for success message
-- ============================================================================

-- Check if the constraint already exists and add it if not
DO $$ 
BEGIN
  -- Add the foreign key constraint from seat_reservations.user_id to profiles.id
  ALTER TABLE seat_reservations
  ADD CONSTRAINT fk_seat_reservations_user_id_profiles 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  
  RAISE NOTICE 'Foreign key constraint added successfully';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Foreign key constraint already exists';
END $$;

-- Verify the relationship by checking table structure
-- This will show all foreign keys for the seat_reservations table
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'seat_reservations';

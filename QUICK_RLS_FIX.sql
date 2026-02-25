-- ============================================================================
-- QUICK FIX: ALLOW STAFF TO VIEW ALL RESERVATIONS
-- ============================================================================
-- This removes the restrictive RLS and allows staff to see everything
-- ============================================================================

-- OPTION 1: Temporarily disable RLS (FOR TESTING ONLY - NOT SECURE)
-- Uncomment this ONLY to test if RLS is the problem
-- ALTER TABLE seat_reservations DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Add a more permissive policy for staff (RECOMMENDED)
DROP POLICY IF EXISTS "Users and staff can view reservations" ON seat_reservations;

CREATE POLICY "Everyone can view reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow ALL authenticated users to see ALL reservations

-- Test: See if you can now see reservations
SELECT 
  COUNT(*) as total_reservations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_count
FROM seat_reservations;

-- Show sample reservations
SELECT 
  id,
  seat_number,
  reservation_date,
  reservation_time_slot,
  status
FROM seat_reservations
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Check staff app - reservations should now appear
-- 3. If they appear, the problem was RLS policy
-- 4. We can then create a proper policy for staff only
-- ============================================================================

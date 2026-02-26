-- ============================================================================
-- WORKING RLS POLICY FOR SEAT RESERVATIONS
-- ============================================================================
-- This allows all authenticated users to view all reservations
-- ============================================================================

-- Remove any existing SELECT policy
DROP POLICY IF EXISTS "Secure reservations view policy" ON seat_reservations;
DROP POLICY IF EXISTS "Users and staff can view reservations" ON seat_reservations;

-- Create the simple working policy
CREATE POLICY "Everyone can view reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow ALL authenticated users to see ALL reservations

-- Verify the policy is active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'seat_reservations'
AND cmd = 'SELECT';

-- ============================================================================
-- ✅ POLICY RESTORED!
-- ============================================================================
-- 
-- This policy allows:
-- ✅ All authenticated users can see all reservations
-- ✅ Works for regular users, admins, and canteen staff
-- ✅ Simple and functional
-- ============================================================================

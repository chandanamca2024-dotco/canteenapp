-- ============================================================================
-- FIX STAFF ACCESS TO VIEW ALL RESERVATIONS
-- ============================================================================
-- This script adds a policy so canteen staff can view all reservations
-- (not just their own or admin-only)
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- ============================================================================

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own reservations" ON seat_reservations;

-- Create new policy that allows:
-- 1. Users to view their own reservations
-- 2. Admins to view all reservations
-- 3. Canteen Staff to view all reservations
CREATE POLICY "Users and staff can view reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own
    auth.uid() = user_id
    OR
    -- Admins can see all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR
    -- Canteen Staff can see all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Canteen Staff'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show updated policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'seat_reservations'
AND policyname = 'Users and staff can view reservations';

-- ============================================================================
-- ✅ STAFF ACCESS FIX COMPLETE!
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Staff users can now view all seat reservations
-- ✅ Users can still only see their own reservations
-- ✅ Admins can still see all reservations
-- 
-- Next steps:
-- 1. Test from canteen staff account - navigate to Reservations tab
-- 2. You should now see all reservations for today
-- 3. Verify the alert shows for upcoming reservations
-- 
-- ============================================================================

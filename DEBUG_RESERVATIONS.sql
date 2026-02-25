-- ============================================================================
-- DEBUG: CHECK RESERVATIONS AND STAFF ACCESS
-- ============================================================================
-- Run this to diagnose why staff can't see reservations
-- ============================================================================

-- Check 1: See ALL reservations in the database
SELECT 
  id,
  user_id,
  seat_number,
  reservation_date,
  reservation_time_slot,
  status,
  created_at
FROM seat_reservations
ORDER BY created_at DESC
LIMIT 10;

-- Check 2: Count total reservations
SELECT COUNT(*) as total_reservations
FROM seat_reservations;

-- Check 3: Check current authenticated user (run from app context)
SELECT 
  auth.uid() as current_user_id,
  email
FROM auth.users
WHERE id = auth.uid();

-- Check 4: See all user profiles and their roles
SELECT 
  id,
  email,
  role,
  is_admin,
  name
FROM profiles
ORDER BY created_at DESC;

-- Check 5: Check if current user has Canteen Staff role
SELECT 
  id,
  email,
  role,
  is_admin
FROM profiles
WHERE id = auth.uid();

-- Check 6: Test the RLS policy - what can current user see?
-- This simulates what the app query does
SELECT 
  sr.id,
  sr.seat_number,
  sr.reservation_date,
  sr.status,
  p.name as user_name,
  p.role as user_role
FROM seat_reservations sr
LEFT JOIN profiles p ON p.id = sr.user_id
ORDER BY sr.created_at DESC;

-- ============================================================================
-- EXPECTED RESULTS:
-- - Check 1-2: Should show existing reservations
-- - Check 4-5: Should show staff user with role = 'Canteen Staff'
-- - Check 6: Should return reservations if RLS policy is working
-- ============================================================================

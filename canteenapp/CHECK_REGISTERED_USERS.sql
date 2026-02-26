-- ========================================
-- CHECK REGISTERED USERS
-- ========================================
-- Run this query in Supabase SQL Editor to view all registered users

-- View all registered users with their details
SELECT 
  id,
  email,
  name,
  phone,
  role,
  is_admin,
  is_active,
  status,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC;

-- ========================================
-- COUNT USERS BY STATUS
-- ========================================
SELECT 
  status,
  COUNT(*) as count
FROM profiles
GROUP BY status;

-- ========================================
-- COUNT USERS BY ROLE
-- ========================================
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role;

-- ========================================
-- GET ACTIVE USERS ONLY
-- ========================================
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM profiles
WHERE is_active = true
ORDER BY created_at DESC;

-- ========================================
-- GET INACTIVE USERS
-- ========================================
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM profiles
WHERE is_active = false
ORDER BY created_at DESC;

-- ========================================
-- GET ADMINS
-- ========================================
SELECT 
  id,
  email,
  name,
  is_active,
  created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;

-- ============================================================================
-- POPULATE PROFILE NAMES AND CHECK AVATAR URLS
-- ============================================================================
-- This script checks and updates profile information
-- ============================================================================

-- Check current profile data
SELECT 
  id,
  email,
  name,
  avatar_url,
  role
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Update profiles without names - use email username as name
UPDATE profiles
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '';

-- Verify the update
SELECT 
  id,
  email,
  name,
  avatar_url,
  role
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Count profiles with avatars
SELECT 
  COUNT(*) as total_profiles,
  COUNT(avatar_url) as profiles_with_avatar,
  COUNT(name) as profiles_with_name
FROM profiles;

-- ============================================================================
-- ✅ PROFILE UPDATE COMPLETE!
-- ============================================================================
-- 
-- What this does:
-- ✅ Populates 'name' field from email username if empty
-- ✅ Shows avatar URL status
-- ✅ Displays statistics on profile data
-- 
-- Now staff orders will show actual customer names!
-- Avatar URLs need to be uploaded by users in their profile settings
-- ============================================================================

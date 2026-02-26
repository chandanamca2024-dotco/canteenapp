-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Test if current policies allow reading profiles
-- This should return data if RLS allows it
SELECT 
  id,
  email,
  name,
  avatar_url,
  role
FROM profiles
LIMIT 5;

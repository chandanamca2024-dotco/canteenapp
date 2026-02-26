-- =====================================================
-- RESET AND SETUP AVATARS STORAGE BUCKET
-- =====================================================
-- Use this if you already have an 'avatars' bucket
-- This will clean up old policies and set up fresh ones

-- =====================================================
-- STEP 1: DROP EXISTING POLICIES (if any)
-- =====================================================
-- Run these to remove any old or conflicting policies

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public users can view avatars" ON storage.objects;

-- =====================================================
-- STEP 2: CREATE FRESH POLICIES
-- =====================================================

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow public read access to all avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running these queries:
-- 1. Go to Storage > avatars bucket > Policies tab
-- 2. You should see exactly 4 policies
-- 3. Try uploading a profile picture from the app
-- 4. It should work now!

-- =====================================================
-- IMPORTANT: Bucket Settings
-- =====================================================
-- Make sure your 'avatars' bucket has these settings:
-- - Public bucket: ON ✓
-- - File size limit: 2MB (2097152 bytes)
-- - Allowed MIME types: image/jpeg,image/png,image/jpg,image/webp
--
-- You can check/update these in:
-- Supabase Dashboard > Storage > avatars bucket > Settings

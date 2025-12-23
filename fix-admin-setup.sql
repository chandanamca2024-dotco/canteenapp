-- Complete fix for admin@dinedesk.com settings save issue
-- Run this entire file in Supabase SQL Editor

-- 1. Set admin status for admin@dinedesk.com
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@dinedesk.com';

-- 2. Verify admin status was set
SELECT id, email, is_admin, role, created_at 
FROM profiles 
WHERE email = 'admin@dinedesk.com';

-- 3. Drop and recreate RLS policies for business_settings
DROP POLICY IF EXISTS "Anyone can read business settings" ON business_settings;
DROP POLICY IF EXISTS "Only admins can update business settings" ON business_settings;
DROP POLICY IF EXISTS "Enable read access for all" ON business_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON business_settings;
DROP POLICY IF EXISTS "business_settings_read_all" ON business_settings;
DROP POLICY IF EXISTS "business_settings_update_admin" ON business_settings;

-- 4. Create new RLS policies
CREATE POLICY "business_settings_read_all" 
ON business_settings FOR SELECT 
USING (true);

CREATE POLICY "business_settings_update_admin" 
ON business_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 5. Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'business_settings';

-- 6. Check current business_settings data
SELECT * FROM business_settings;

-- 7. Test update (this should work after running the above)
-- Uncomment the next line to test:
-- UPDATE business_settings SET closing_time = '9:00 PM' WHERE id = (SELECT id FROM business_settings LIMIT 1);

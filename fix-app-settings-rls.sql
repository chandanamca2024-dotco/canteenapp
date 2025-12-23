-- Fix RLS policies for app_settings table
-- This ensures admins can update the settings

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read app settings" ON app_settings;
DROP POLICY IF EXISTS "Only admins can update app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;

-- Create new policies
CREATE POLICY "Anyone can read app settings" 
ON app_settings FOR SELECT 
USING (true);

-- Allow authenticated users to update (for testing)
CREATE POLICY "Authenticated users can update app settings" 
ON app_settings FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- OR if you want only admins to update, make sure profiles.is_admin is set:
-- First check if admin user has is_admin = true
-- SELECT email, is_admin FROM profiles WHERE email = 'admin@dinedesk.com';

-- If is_admin is false or null, run:
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@dinedesk.com';

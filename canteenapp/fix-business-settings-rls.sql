-- Fix business_settings RLS policies to check profiles.is_admin
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read business settings" ON business_settings;
DROP POLICY IF EXISTS "Only admins can update business settings" ON business_settings;
DROP POLICY IF EXISTS "Enable read access for all" ON business_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON business_settings;
DROP POLICY IF EXISTS "business_settings_read_all" ON business_settings;
DROP POLICY IF EXISTS "business_settings_update_admin" ON business_settings;

-- Create new policies that check profiles table
CREATE POLICY "business_settings_read_all" ON business_settings FOR SELECT USING (true);

CREATE POLICY "business_settings_update_admin" ON business_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Verify the table has data
SELECT * FROM business_settings LIMIT 1;

-- If no data exists, insert default settings (12-hour format)
INSERT INTO business_settings (opening_time, closing_time, min_order_value)
SELECT '9:00 AM', '4:45 PM', 50
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

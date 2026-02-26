-- Complete setup for business_settings table

-- Check if business_settings exists and show structure
SELECT * FROM business_settings LIMIT 1;

-- Insert default row if not exists (business_settings uses UUID for id)
INSERT INTO business_settings (opening_time, closing_time, min_order_value)
SELECT '9:00 AM', '4:45 PM', 50
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- Disable RLS for testing
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;

-- Check if settings row exists
SELECT * FROM business_settings;

-- Make sure admin user is_admin = true
UPDATE profiles SET is_admin = true WHERE email = 'admin@dinedesk.com';

-- Verify admin user
SELECT id, email, is_admin FROM profiles WHERE email = 'admin@dinedesk.com';

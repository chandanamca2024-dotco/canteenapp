-- Create business_settings table for managing canteen opening and closing times
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_time TEXT NOT NULL DEFAULT '9:00 am',
  closing_time TEXT NOT NULL DEFAULT '4:45 pm',
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read business settings
CREATE POLICY "Anyone can view business settings"
  ON business_settings FOR SELECT
  USING (true);

-- Policy: Only admins can update business settings
CREATE POLICY "Only admins can update business settings"
  ON business_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Insert default business hours (run this once)
INSERT INTO business_settings (opening_time, closing_time, is_open)
SELECT '9:00 am', '4:45 pm', true
WHERE NOT EXISTS (SELECT 1 FROM business_settings);

-- Optional: Set specific hours for your canteen
-- UPDATE business_settings SET opening_time = '8:00 AM', closing_time = '5:00 PM';

-- Verify the data
SELECT * FROM business_settings;

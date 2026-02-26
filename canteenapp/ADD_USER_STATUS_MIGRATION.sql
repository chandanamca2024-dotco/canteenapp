-- ========================================
-- MIGRATION: ADD USER STATUS FIELDS
-- ========================================
-- Run this if you already have a profiles table
-- This adds is_active and status columns to track user registration and activity

-- Add is_active column (if it doesn't exist)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add status column (if it doesn't exist)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update all existing users to be active (if they don't have a status)
UPDATE profiles
SET is_active = true, status = 'active'
WHERE is_active IS NULL OR status IS NULL;

-- Create index for active user queries (improves performance)
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email_active ON profiles(email, is_active);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

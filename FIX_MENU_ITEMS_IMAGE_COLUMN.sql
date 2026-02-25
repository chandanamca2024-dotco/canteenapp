-- Fix: Add image column to menu_items if missing, and refresh schema cache
-- Run this in Supabase SQL editor

BEGIN;

-- Add image_url column if it doesn't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Also add image column as alias (some code uses 'image', some uses 'image_url')
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image TEXT;

-- Grant privileges
GRANT SELECT, INSERT, UPDATE ON TABLE menu_items TO authenticated;
GRANT SELECT ON TABLE menu_items TO anon;

-- Reload schema cache - this is critical!
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Fix: Correct order_items schema to use 'quantity' instead of 'qty'
-- Run this in Supabase SQL editor

BEGIN;

-- Check current schema
-- \d order_items

-- Drop qty column if it exists  
ALTER TABLE order_items DROP COLUMN IF EXISTS qty;

-- Add/ensure quantity column exists with correct type
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Update any existing data (shouldn't be necessary but safe)
UPDATE order_items SET quantity = 1 WHERE quantity IS NULL;

-- Verify the schema is correct
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY ordinal_position;

-- Grant privileges
GRANT SELECT, INSERT, UPDATE ON TABLE order_items TO authenticated;
GRANT SELECT ON TABLE order_items TO anon;

-- Reload schema cache
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

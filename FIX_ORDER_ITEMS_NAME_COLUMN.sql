-- Fix: Remove or make optional the 'name' column in order_items
-- Run this in Supabase SQL editor

BEGIN;

-- Option 1: Drop the name column entirely (recommended - name is in menu_items already)
ALTER TABLE order_items DROP COLUMN IF EXISTS name;

-- Option 2: If you want to keep it, make it nullable instead
-- ALTER TABLE order_items ALTER COLUMN name DROP NOT NULL;

-- Ensure qty column exists
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1;

-- Also ensure quantity column is removed if it exists to avoid confusion
ALTER TABLE order_items DROP COLUMN IF EXISTS quantity;

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

-- Verify the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

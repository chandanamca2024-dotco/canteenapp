-- Fix: Ensure `qty` column exists and is visible to API roles
-- Run this in Supabase SQL editor.
BEGIN;

-- 1) Add the column if missing
ALTER TABLE IF EXISTS order_items
  ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1;

-- 2) Make sure standard roles can see/use the column
GRANT SELECT, INSERT, UPDATE ON TABLE order_items TO authenticated;
GRANT SELECT ON TABLE order_items TO anon;

-- 3) Optional: refresh PostgREST schema cache immediately
-- (helps if you recently changed schema and still get cache errors)
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
  -- ignore if extension/listener not present
  NULL;
END $$;

COMMIT;
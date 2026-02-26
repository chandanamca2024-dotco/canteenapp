-- ============================================================================
-- FIX ORDER_ITEMS TABLE SCHEMA ISSUES
-- ============================================================================
-- This script fixes the order_items table to have the correct schema
-- Remove conflicting columns and ensure proper structure
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- ============================================================================

BEGIN;

-- Step 1: Drop ALL problematic columns if they exist
ALTER TABLE IF EXISTS order_items DROP COLUMN IF EXISTS name;
ALTER TABLE IF EXISTS order_items DROP COLUMN IF EXISTS price;
ALTER TABLE IF EXISTS order_items DROP COLUMN IF EXISTS qty;

-- Step 2: Ensure the correct columns exist
-- The order_items table should only have: id, order_id, menu_item_id, quantity, created_at

-- Add quantity column if it doesn't exist
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Step 3: Verify and show the correct schema
-- This should show: id, order_id, menu_item_id, quantity, created_at

-- Reload schema cache
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- ============================================
-- FORCE FIX: Remove ALL old triggers and create clean new one
-- ============================================
-- This aggressively removes any old stock deduction triggers

-- Step 1: Drop ALL possible triggers on order_items
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers 
              WHERE event_object_table = 'order_items') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON order_items CASCADE';
    END LOOP;
END $$;

-- Step 2: Drop ALL related functions
DROP FUNCTION IF EXISTS update_stock_on_order() CASCADE;
DROP FUNCTION IF EXISTS reduce_stock_on_order_item() CASCADE;
DROP FUNCTION IF EXISTS decrease_stock_on_order() CASCADE;
DROP FUNCTION IF EXISTS deduct_raw_inventory_on_order() CASCADE;

-- Step 3: Create the NEW clean function (no stock_history dependency)
CREATE OR REPLACE FUNCTION reduce_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
  -- Log that trigger was called
  RAISE NOTICE 'Trigger called for menu_item_id: %, qty: %', NEW.menu_item_id, NEW.qty;
  
  -- Simply reduce stock_quantity in menu_items
  UPDATE menu_items
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - NEW.qty, 0)
  WHERE id = NEW.menu_item_id;
  
  -- Log result
  RAISE NOTICE 'Stock updated for item: %', NEW.menu_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER trigger_reduce_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW 
    EXECUTE FUNCTION reduce_stock_on_order_item();

-- Step 5: Verify it was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- ============================================
-- COMPLETE STOCK DEDUCTION FIX
-- ============================================
-- This will diagnose and fix the stock deduction issue

-- Step 1: Check what columns actually exist
DO $$
DECLARE
    has_qty BOOLEAN;
    has_quantity BOOLEAN;
BEGIN
    -- Check if 'qty' column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'qty'
    ) INTO has_qty;
    
    -- Check if 'quantity' column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'quantity'
    ) INTO has_quantity;
    
    RAISE NOTICE 'Column check - qty exists: %, quantity exists: %', has_qty, has_quantity;
END $$;

-- Step 2: Drop ALL old triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers 
              WHERE event_object_table = 'order_items') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON order_items CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Step 3: Drop old functions
DROP FUNCTION IF EXISTS update_stock_on_order() CASCADE;
DROP FUNCTION IF EXISTS reduce_stock_on_order_item() CASCADE;
DROP FUNCTION IF EXISTS decrease_stock_on_order() CASCADE;
DROP FUNCTION IF EXISTS deduct_raw_inventory_on_order() CASCADE;

-- Step 4: Create the working function with robust column handling
CREATE OR REPLACE FUNCTION reduce_stock_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
    quantity_value INTEGER;
BEGIN
    -- Try to get quantity from either 'qty' or 'quantity' column
    BEGIN
        quantity_value := NEW.qty;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            quantity_value := NEW.quantity;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not find qty or quantity column';
            RETURN NEW;
        END;
    END;
    
    RAISE NOTICE '=== STOCK DEDUCTION TRIGGER FIRED ===';
    RAISE NOTICE 'Order Item ID: %', NEW.id;
    RAISE NOTICE 'Menu Item ID: %', NEW.menu_item_id;
    RAISE NOTICE 'Quantity to deduct: %', quantity_value;
    
    -- Update the stock
    UPDATE menu_items
    SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - quantity_value, 0)
    WHERE id = NEW.menu_item_id;
    
    -- Check if update happened
    IF FOUND THEN
        RAISE NOTICE 'Stock successfully updated for menu_item_id: %', NEW.menu_item_id;
    ELSE
        RAISE NOTICE 'WARNING: No menu item found with id: %', NEW.menu_item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER trigger_reduce_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW 
    EXECUTE FUNCTION reduce_stock_on_order_item();

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION reduce_stock_on_order_item() TO authenticated;
GRANT EXECUTE ON FUNCTION reduce_stock_on_order_item() TO anon;

-- Step 7: Verify setup
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- Step 8: Show current stock levels
SELECT 
    id, 
    name, 
    stock_quantity,
    available
FROM menu_items 
ORDER BY name;
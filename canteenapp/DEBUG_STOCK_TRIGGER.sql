-- ============================================
-- DEBUG: Check why stock is not updating
-- ============================================

-- Step 1: Check the actual columns in order_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Step 2: Check the actual columns in menu_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;

-- Step 3: Check recent order_items to see what data is being inserted
SELECT * FROM order_items 
LIMIT 10;

-- Step 4: Check if the trigger function has the right permissions
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.proname = 'reduce_stock_on_order_item';

-- Step 5: Manually test the stock update query
-- (Replace the UUID with an actual menu_item_id from your database)
-- This simulates what the trigger should do
DO $$
DECLARE
    test_item_id UUID := 'defc2b34-5774-4bee-809f-82b49e6409a9'; -- Chicken Biryani
    test_qty INTEGER := 1;
BEGIN
    UPDATE menu_items
    SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - test_qty, 0)
    WHERE id = test_item_id;
    
    RAISE NOTICE 'Manual stock update test completed';
END $$;

-- Step 6: Check the stock after manual test
SELECT id, name, stock_quantity FROM menu_items 
WHERE name = 'Chicken Biryani';

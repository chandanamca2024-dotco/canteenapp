-- ============================================
-- TEST: Verify Trigger is Working
-- ============================================

-- Step 1: Get current stock BEFORE test
SELECT id, name, stock_quantity FROM menu_items 
WHERE name = 'Samosa'
ORDER BY name;

-- Step 2: Manually insert a test order_item to see if trigger fires
-- (This will show us if the trigger is working)
DO $$
DECLARE
    test_order_id UUID;
    test_menu_id UUID;
    stock_before INTEGER;
    stock_after INTEGER;
BEGIN
    -- Get a test menu item (Samosa)
    SELECT id INTO test_menu_id FROM menu_items WHERE name = 'Samosa' LIMIT 1;
    
    -- Get stock before
    SELECT stock_quantity INTO stock_before FROM menu_items WHERE id = test_menu_id;
    RAISE NOTICE 'Stock BEFORE insert: %', stock_before;
    
    -- Create a test order
    INSERT INTO orders (user_id, total_price, status)
    VALUES (auth.uid(), 100, 'Pending')
    RETURNING id INTO test_order_id;
    
    -- Insert a test order_item (This should trigger the stock deduction)
    INSERT INTO order_items (order_id, menu_item_id, name, price, qty)
    VALUES (test_order_id, test_menu_id, 'Samosa', 30, 2);
    
    -- Get stock after
    SELECT stock_quantity INTO stock_after FROM menu_items WHERE id = test_menu_id;
    RAISE NOTICE 'Stock AFTER insert: %', stock_after;
    RAISE NOTICE 'Difference: %', (stock_before - stock_after);
    
    IF (stock_before - stock_after) = 2 THEN
        RAISE NOTICE '✅ TRIGGER WORKS! Stock was deducted by 2';
    ELSE
        RAISE NOTICE '❌ TRIGGER NOT WORKING! Stock was not deducted';
    END IF;
END $$;

-- Step 3: Check final stock
SELECT id, name, stock_quantity FROM menu_items 
WHERE name = 'Samosa'
ORDER BY name;

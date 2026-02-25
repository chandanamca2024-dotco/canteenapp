-- ============================================
-- DIAGNOSE & FIX STOCK DEDUCTION
-- ============================================

-- Step 1: Check order_items structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Step 2: Check recent orders placed
SELECT * FROM orders ORDER BY created_at DESC LIMIT 3;

-- Step 3: Check recent order_items
SELECT * FROM order_items LIMIT 10;

-- Step 4: Check current menu_items stock before any update
SELECT id, name, stock_quantity FROM menu_items ORDER BY name;

-- Step 5: Manually test stock update (SIMULATED)
-- Take the first order item and see what qty value it has
DO $$
DECLARE
    test_menu_id UUID;
    test_qty INTEGER;
    current_stock INTEGER;
BEGIN
    -- Get a recent order item
    SELECT menu_item_id, qty INTO test_menu_id, test_qty
    FROM order_items 
    LIMIT 1;
    
    IF test_menu_id IS NOT NULL THEN
        RAISE NOTICE 'Test: menu_item_id=%, qty=%', test_menu_id, test_qty;
        
        -- Get current stock
        SELECT stock_quantity INTO current_stock
        FROM menu_items
        WHERE id = test_menu_id;
        
        RAISE NOTICE 'Current stock for this item: %', current_stock;
        RAISE NOTICE 'If trigger worked, stock should be %', GREATEST(COALESCE(current_stock, 0) - COALESCE(test_qty, 0), 0);
    ELSE
        RAISE NOTICE 'No order items found to test';
    END IF;
END $$;

-- Step 6: Check if trigger exists and what it looks like
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- Step 7: Get the actual trigger function code
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
WHERE p.proname LIKE '%stock%' OR p.proname LIKE '%order%'
LIMIT 10;

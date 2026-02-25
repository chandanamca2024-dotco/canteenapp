-- ============================================
-- FINAL FIX: Ensure trigger is properly attached
-- ============================================

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_order ON order_items;

-- Create the trigger (function already exists)
CREATE TRIGGER trigger_reduce_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW 
    EXECUTE FUNCTION reduce_stock_on_order_item();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'order_items' 
AND trigger_name = 'trigger_reduce_stock_on_order';

-- Show all triggers on order_items
SELECT 
    trigger_name,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- Check current stock
SELECT id, name, stock_quantity FROM menu_items ORDER BY name;

-- Check recent order_items
SELECT * FROM order_items LIMIT 5;

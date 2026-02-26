-- ============================================
-- FIX: Stock Deduction Trigger
-- ============================================
-- ISSUE: The trigger was using NEW.quantity but the actual column is 'qty'
-- This fixes the trigger to properly deduct stock when orders are placed

BEGIN;

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trigger_update_stock_on_order ON order_items;
DROP FUNCTION IF EXISTS update_stock_on_order();

-- Create the corrected function using the right column name (qty)
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update menu_items stock_quantity by deducting the qty ordered
  UPDATE menu_items
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - NEW.qty, 0)
  WHERE id = NEW.menu_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again with the corrected function
CREATE TRIGGER trigger_update_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_stock_on_order();

COMMIT;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the trigger was created:
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_stock_on_order';

-- Check stock_quantity in menu_items (should see current stock values)
SELECT id, name, stock_quantity FROM menu_items ORDER BY name;

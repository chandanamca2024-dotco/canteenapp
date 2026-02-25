-- Verify and optimize order flow for production
-- Run this to ensure all tables are set up correctly

-- 1. Verify orders table
SELECT 'orders' as table_name, COUNT(*) as record_count FROM orders;

-- 2. Verify order_items table
SELECT 'order_items' as table_name, COUNT(*) as record_count FROM order_items;

-- 3. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items');

-- 4. Verify all order_items columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 5. Verify all orders columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 6. Check RLS policies on orders
SELECT policyname, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- 7. Check RLS policies on order_items
SELECT policyname, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items';

-- 8. View sample orders (if any exist)
SELECT id, token_number, user_id, total_price, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 9. View sample order items
SELECT oi.id, oi.order_id, oi.menu_item_id, oi.name, oi.price, oi.qty
FROM order_items oi
ORDER BY oi.id DESC
LIMIT 10;

-- 10. Summary: Orders with their items
SELECT 
  o.id,
  o.token_number,
  o.status,
  COUNT(oi.id) as item_count,
  o.total_price,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.token_number, o.status, o.total_price, o.created_at
ORDER BY o.created_at DESC
LIMIT 10;
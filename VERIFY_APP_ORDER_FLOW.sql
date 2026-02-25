-- ============================================
-- VERIFY: Check actual orders placed through the app
-- ============================================

-- Get recent orders and their items
SELECT 
  o.id,
  o.user_id,
  o.total_price,
  o.status,
  o.created_at,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_qty
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at > NOW() - INTERVAL '2 hours'
GROUP BY o.id, o.user_id, o.total_price, o.status, o.created_at
ORDER BY o.created_at DESC
LIMIT 10;

-- Get items from most recent order with quantities
SELECT 
  oi.id,
  oi.order_id,
  oi.menu_item_id,
  oi.name,
  oi.price,
  oi.qty,
  mi.stock_quantity
FROM order_items oi
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE oi.order_id IN (
  SELECT id FROM orders 
  WHERE created_at > NOW() - INTERVAL '2 hours'
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY oi.created_at;

-- Show trigger is working correctly
SELECT 
  name,
  stock_quantity,
  CASE 
    WHEN stock_quantity < 25 THEN 'Stock was reduced ✅'
    WHEN stock_quantity = 25 THEN 'No change (trigger may not be firing)'
  END as status
FROM menu_items
WHERE name IN ('Samosa', 'Veg Biryani', 'Dosa')
ORDER BY name;

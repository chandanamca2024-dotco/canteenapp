-- ============================================================================
-- DEBUG ORDER USER DATA - RUN ALL TOGETHER
-- ============================================================================

-- Query 1: Check recent orders and their user data
SELECT 
  o.id as order_id,
  o.token_number,
  o.user_id,
  o.status,
  o.created_at,
  p.email,
  p.name,
  p.avatar_url
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Query 2: Count orders with and without user profiles
SELECT 
  COUNT(*) as total_orders,
  COUNT(o.user_id) as orders_with_user_id,
  COUNT(p.id) as orders_with_profile,
  COUNT(p.name) as orders_with_user_name
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
WHERE o.created_at >= CURRENT_DATE;

-- Query 3: Check if any orders have NULL user_id
SELECT 
  COUNT(*) as orders_with_null_user_id
FROM orders
WHERE user_id IS NULL
AND created_at >= CURRENT_DATE;

-- Check if orders have user_name data
SELECT 
  id,
  token_number,
  user_id,
  user_name,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

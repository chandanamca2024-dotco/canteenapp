-- VERIFY: Check if all duplicate tokens have been fixed

-- 1. Check for any remaining duplicate tokens (should be empty)
SELECT 
  DATE(created_at) as order_date,
  token_number,
  COUNT(*) as order_count,
  STRING_AGG(DISTINCT user_id::text, ', ') as user_ids
FROM orders
GROUP BY DATE(created_at), token_number
HAVING COUNT(*) > 1
ORDER BY order_date DESC, token_number;
-- Expected: No results = Fix successful ✅
-- If results shown = Fix incomplete ⚠️

-- 2. Show top dates with most orders
SELECT 
  DATE(created_at AT TIME ZONE 'UTC') as order_date,
  COUNT(*) as total_orders,
  MAX(token_number) as max_token,
  'Tokens: ' || MIN(token_number) || '-' || MAX(token_number) as token_range
FROM orders
GROUP BY DATE(created_at AT TIME ZONE 'UTC')
ORDER BY total_orders DESC
LIMIT 15;

-- 3. Sample orders from 2026-02-22 to verify uniqueness
SELECT 
  token_number,
  id,
  user_id,
  total_price,
  status,
  created_at
FROM orders
WHERE DATE(created_at) = '2026-02-22'
ORDER BY token_number;

-- 4. Sample orders from 2026-02-17 to verify it's fixed
SELECT 
  token_number,
  id,
  user_id,
  total_price,
  status,
  created_at
FROM orders
WHERE DATE(created_at) = '2026-02-17'
ORDER BY token_number;

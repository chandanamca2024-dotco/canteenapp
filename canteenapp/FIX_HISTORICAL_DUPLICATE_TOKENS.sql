-- FIX HISTORICAL DATA: Reassign Unique Tokens to All Orders
-- This fixes all existing duplicate token numbers

-- 1. First, reset the daily_tokens counter
TRUNCATE TABLE daily_tokens;

-- 2. Create a CTE to generate unique sequential tokens per day
WITH ordered_orders AS (
  SELECT 
    id,
    DATE(created_at AT TIME ZONE 'UTC') as order_date,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY DATE(created_at AT TIME ZONE 'UTC') ORDER BY created_at ASC) as new_token
  FROM orders
  ORDER BY created_at ASC
),
-- 3. Update each order with its new unique token
update_orders AS (
  UPDATE orders
  SET token_number = ordered_orders.new_token
  FROM ordered_orders
  WHERE orders.id = ordered_orders.id
)
-- 4. Rebuild daily_tokens table with correct counters
INSERT INTO daily_tokens (token_date, last_token)
SELECT 
  DATE(created_at AT TIME ZONE 'UTC'),
  MAX(token_number)
FROM orders
GROUP BY DATE(created_at AT TIME ZONE 'UTC')
ON CONFLICT (token_date) DO UPDATE SET last_token = EXCLUDED.last_token;

-- 5. Verify the fix - should show no duplicates
SELECT 
  DATE(created_at) as order_date,
  token_number,
  COUNT(*) as order_count
FROM orders
GROUP BY order_date, token_number
HAVING COUNT(*) > 1
ORDER BY order_date DESC, token_number;
-- (This should return no rows if fix was successful)

-- 6. Show summary of tokens per day
SELECT 
  DATE(created_at AT TIME ZONE 'UTC') as order_date,
  COUNT(*) as total_orders,
  MAX(token_number) as max_token,
  MIN(token_number) as min_token
FROM orders
GROUP BY DATE(created_at AT TIME ZONE 'UTC')
ORDER BY order_date DESC
LIMIT 10;

-- 7. Verify daily_tokens is correct
SELECT * FROM daily_tokens ORDER BY token_date DESC LIMIT 10;

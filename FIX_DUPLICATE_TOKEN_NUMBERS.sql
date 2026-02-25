-- FIX: Unique Daily Token Assignment
-- This prevents multiple orders from getting the same token number

-- 1. Drop the old broken trigger and function
DROP TRIGGER IF EXISTS trigger_assign_daily_token ON orders;
DROP FUNCTION IF EXISTS assign_daily_token();

-- 2. Drop the daily_tokens table and recreate with proper structure
DROP TABLE IF EXISTS daily_tokens;

CREATE TABLE IF NOT EXISTS daily_tokens (
  token_date DATE PRIMARY KEY,
  last_token INTEGER DEFAULT 0
);

-- 3. Create improved token assignment function with proper row-level locking
CREATE OR REPLACE FUNCTION assign_daily_token()
RETURNS TRIGGER AS $$
DECLARE
  d DATE := DATE(NEW.created_at AT TIME ZONE 'UTC');
  next_token INTEGER;
BEGIN
  -- First, try to insert a new row for today if it doesn't exist
  INSERT INTO daily_tokens (token_date, last_token)
  VALUES (d, 0)
  ON CONFLICT (token_date) DO NOTHING;
  
  -- Now update with proper locking - this ensures atomic increment
  UPDATE daily_tokens 
  SET last_token = last_token + 1 
  WHERE token_date = d 
  RETURNING last_token INTO next_token;
  
  -- Set the token number
  NEW.token_number := COALESCE(next_token, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate the trigger with proper execution
CREATE TRIGGER trigger_assign_daily_token
  BEFORE INSERT ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION assign_daily_token();

-- 5. Verify the structure
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers
WHERE event_object_table = 'orders' 
AND trigger_name = 'trigger_assign_daily_token';

-- 6. Show current daily tokens status
SELECT * FROM daily_tokens ORDER BY token_date DESC LIMIT 5;

-- 7. Show orders grouped by token to verify uniqueness
SELECT 
  DATE(created_at) as order_date,
  token_number,
  COUNT(*) as order_count,
  STRING_AGG(DISTINCT user_id::text, ', ') as user_ids
FROM orders
GROUP BY order_date, token_number
HAVING COUNT(*) > 1
ORDER BY order_date DESC, token_number;

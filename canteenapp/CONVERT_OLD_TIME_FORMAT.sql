-- Convert requested_time to TEXT so we store only the local pickup time
-- This avoids timezone shifts and keeps the user's selected time intact

BEGIN;

ALTER TABLE orders
  ALTER COLUMN requested_time TYPE TEXT
  USING CASE
    WHEN requested_time IS NULL THEN NULL
    ELSE TO_CHAR(requested_time::timestamp, 'HH12:MI AM')
  END;

COMMIT;

-- Verify the conversion worked
SELECT 
  COUNT(*) as total_with_time,
  COUNT(CASE WHEN requested_time ~ '^[0-9]{2}:[0-9]{2} (AM|PM)$' THEN 1 END) as new_format_count
FROM orders
WHERE requested_time IS NOT NULL;

-- Show sample of converted times
SELECT id, requested_time FROM orders WHERE requested_time IS NOT NULL ORDER BY created_at DESC LIMIT 10;

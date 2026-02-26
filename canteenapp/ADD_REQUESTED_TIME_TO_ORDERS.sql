-- Add requested_time column to orders to store user's preferred pickup time
-- Run this in Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS requested_time TIMESTAMP;

-- Optional index to query by requested_time
CREATE INDEX IF NOT EXISTS idx_orders_requested_time ON orders(requested_time);

-- Force PostgREST to reload schema so new column appears immediately
DO $$ BEGIN
	PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
	NULL; -- ignore if listener not present
END $$;

-- Preview columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
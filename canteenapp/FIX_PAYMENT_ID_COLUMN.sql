-- Add payment_id column to orders table for Razorpay integration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

ALTER TABLE orders ADD COLUMN payment_id TEXT DEFAULT NULL;

-- Optional: Add index for faster lookups by payment_id
CREATE INDEX idx_orders_payment_id ON orders(payment_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_id';

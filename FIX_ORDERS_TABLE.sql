-- Add missing columns to orders table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Add token_number column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS token_number INTEGER;

-- Add payment_id column if it doesn't exist  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_token_number ON orders(token_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

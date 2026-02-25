-- Add seat_number column to orders table for showing seat in receipt

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seat_number VARCHAR(10);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_seat_number 
ON orders(seat_number);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'seat_number';

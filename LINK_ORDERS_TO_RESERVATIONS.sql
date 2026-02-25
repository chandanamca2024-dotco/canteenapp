-- Add order_id and token_number columns to seat_reservations table
-- This links each reservation to the order placed from that reservation

ALTER TABLE seat_reservations 
ADD COLUMN IF NOT EXISTS order_id UUID;

ALTER TABLE seat_reservations 
ADD COLUMN IF NOT EXISTS token_number INTEGER;

-- Create a foreign key constraint to orders table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'seat_reservations' AND constraint_name = 'fk_seat_reservations_order_id'
  ) THEN
    ALTER TABLE seat_reservations
    ADD CONSTRAINT fk_seat_reservations_order_id 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups by order_id
CREATE INDEX IF NOT EXISTS idx_seat_reservations_order_id 
ON seat_reservations(order_id);

-- Create index for faster lookups by token_number
CREATE INDEX IF NOT EXISTS idx_seat_reservations_token_number 
ON seat_reservations(token_number);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seat_reservations' 
  AND column_name IN ('order_id', 'token_number');

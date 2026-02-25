-- Make reservation_time_slot nullable since time is now selected at payment
-- This allows reservations to be created without a time, which gets filled in when order is placed

ALTER TABLE seat_reservations
ALTER COLUMN reservation_time_slot DROP NOT NULL;

-- Verify the column is now nullable
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'seat_reservations'
  AND column_name = 'reservation_time_slot';

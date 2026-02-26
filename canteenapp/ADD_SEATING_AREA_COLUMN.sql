-- Add seating_area column to seat_reservations table
ALTER TABLE seat_reservations
ADD COLUMN seating_area TEXT;

-- Add check constraint to ensure only valid areas
ALTER TABLE seat_reservations
ADD CONSTRAINT valid_seating_area CHECK (seating_area IN ('window', 'quiet', 'social', 'corner'));

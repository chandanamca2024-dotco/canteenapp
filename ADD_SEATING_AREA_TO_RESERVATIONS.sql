-- ============================================================================
-- ADD SEATING_AREA COLUMN TO SEAT_RESERVATIONS TABLE
-- ============================================================================
-- This script adds the missing seating_area column to the seat_reservations table
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- 6. Wait for success message
-- ============================================================================

-- Add the seating_area column if it doesn't exist
ALTER TABLE seat_reservations 
ADD COLUMN IF NOT EXISTS seating_area VARCHAR(50);

-- Create index for seating_area for better query performance
CREATE INDEX IF NOT EXISTS idx_seat_reservations_seating_area 
ON seat_reservations(seating_area);

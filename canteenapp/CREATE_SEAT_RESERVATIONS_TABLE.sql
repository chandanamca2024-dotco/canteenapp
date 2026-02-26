-- ============================================================================
-- SEAT RESERVATIONS TABLE SETUP FOR DINEDESK
-- ============================================================================
-- This script creates the seat reservations table for students and staff
-- to book seats in advance at the canteen.
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- 6. Wait for success message
-- ============================================================================

-- ============================================================================
-- 1. CREATE SEAT_RESERVATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time_slot VARCHAR(20) NOT NULL, -- e.g., '9:00-10:00', '10:00-11:00'
  number_of_seats INTEGER NOT NULL DEFAULT 1 CHECK (number_of_seats >= 1 AND number_of_seats <= 12),
  purpose TEXT, -- e.g., 'Study', 'Meeting', 'Lunch', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled', 'Completed', 'No-show')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Index for querying reservations by user
CREATE INDEX IF NOT EXISTS idx_seat_reservations_user_id 
ON seat_reservations(user_id);

-- Index for querying reservations by date
CREATE INDEX IF NOT EXISTS idx_seat_reservations_date 
ON seat_reservations(reservation_date);

-- Index for querying reservations by status
CREATE INDEX IF NOT EXISTS idx_seat_reservations_status 
ON seat_reservations(status);

-- Composite index for finding available slots
CREATE INDEX IF NOT EXISTS idx_seat_reservations_date_time 
ON seat_reservations(reservation_date, reservation_time_slot);

-- ============================================================================
-- 3. CREATE FUNCTION TO UPDATE TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_seat_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMP
-- ============================================================================
DROP TRIGGER IF EXISTS set_seat_reservations_updated_at ON seat_reservations;

CREATE TRIGGER set_seat_reservations_updated_at
  BEFORE UPDATE ON seat_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_seat_reservations_updated_at();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own reservations
DROP POLICY IF EXISTS "Users can view their own reservations" ON seat_reservations;
CREATE POLICY "Users can view their own reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own reservations
DROP POLICY IF EXISTS "Users can create reservations" ON seat_reservations;
CREATE POLICY "Users can create reservations"
  ON seat_reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reservations (e.g., cancel)
DROP POLICY IF EXISTS "Users can update their own reservations" ON seat_reservations;
CREATE POLICY "Users can update their own reservations"
  ON seat_reservations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can view all reservations (check if user is admin via profiles table)
DROP POLICY IF EXISTS "Admins can view all reservations" ON seat_reservations;
CREATE POLICY "Admins can view all reservations"
  ON seat_reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Admin can update all reservations
DROP POLICY IF EXISTS "Admins can update all reservations" ON seat_reservations;
CREATE POLICY "Admins can update all reservations"
  ON seat_reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy: Admin can delete reservations
DROP POLICY IF EXISTS "Admins can delete reservations" ON seat_reservations;
CREATE POLICY "Admins can delete reservations"
  ON seat_reservations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- 7. CREATE FUNCTION TO CHECK SEAT AVAILABILITY
-- ============================================================================
CREATE OR REPLACE FUNCTION check_seat_availability(
  p_date DATE,
  p_time_slot VARCHAR(20),
  p_seat_number VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  reservation_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM seat_reservations 
    WHERE reservation_date = p_date 
    AND reservation_time_slot = p_time_slot 
    AND seat_number = p_seat_number
    AND status = 'Confirmed'
  ) INTO reservation_exists;
  
  RETURN NOT reservation_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Check if table was created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'seat_reservations'
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'seat_reservations';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'seat_reservations';

-- ============================================================================
-- 9. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================================
-- Uncomment the lines below to insert sample reservations for testing

/*
-- Get a test user ID (replace with actual user ID from your profiles table)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first non-admin user
  SELECT id INTO test_user_id 
  FROM profiles 
  WHERE is_admin = false 
  LIMIT 1;

  -- Insert sample reservations
  IF test_user_id IS NOT NULL THEN
    INSERT INTO seat_reservations (user_id, seat_number, reservation_date, reservation_time_slot, number_of_seats, purpose, status)
    VALUES 
      (test_user_id, 'A1', CURRENT_DATE + INTERVAL '1 day', '9:00-10:00', 2, 'Study Session', 'Confirmed'),
      (test_user_id, 'B3', CURRENT_DATE + INTERVAL '2 days', '11:00-12:00', 1, 'Lunch Break', 'Confirmed'),
      (test_user_id, 'C5', CURRENT_DATE + INTERVAL '1 day', '14:00-15:00', 4, 'Group Meeting', 'Confirmed');
    
    RAISE NOTICE 'Sample reservations created successfully for user: %', test_user_id;
  ELSE
    RAISE NOTICE 'No non-admin users found. Create a user first.';
  END IF;
END $$;
*/

-- ============================================================================
-- ✅ SETUP COMPLETE!
-- ============================================================================
-- Your seat reservation system is now ready!
-- 
-- Features enabled:
-- ✅ Seat reservations table with all necessary fields
-- ✅ Automatic timestamp updates
-- ✅ Row-level security for user privacy
-- ✅ Admin can view and manage all reservations
-- ✅ Users can only see/manage their own reservations
-- ✅ Indexes for fast queries
-- ✅ Helper function to check seat availability
-- 
-- Next steps:
-- 1. Test creating a reservation from your app
-- 2. Verify it appears in Table Editor → seat_reservations
-- 3. Test admin viewing all reservations
-- 4. Test user viewing only their reservations
-- ============================================================================

-- Add 'Cancelled' status to orders table (IDEMPOTENT - Safe to run multiple times)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_status_check' 
    AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Add new constraint with 'Cancelled' status
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'));

  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Users can cancel their pending orders" ON orders;

  -- Create policy to allow users to cancel their pending orders
  CREATE POLICY "Users can cancel their pending orders"
    ON orders FOR UPDATE
    USING (
      auth.uid() = user_id 
      AND status = 'Pending'
    )
    WITH CHECK (
      auth.uid() = user_id 
      AND status = 'Cancelled'
    );

  RAISE NOTICE 'Migration completed successfully. Cancelled status added to orders.';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed or already applied: %', SQLERRM;
END $$;

-- Verify the changes
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conname LIKE '%orders%status%'
  AND n.nspname = 'public';

-- Check policies
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

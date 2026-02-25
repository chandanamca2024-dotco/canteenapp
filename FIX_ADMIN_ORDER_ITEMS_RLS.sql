-- ============================================================================
-- FIX ADMIN ORDER ITEMS RLS POLICY
-- ============================================================================
-- This script updates the RLS policy for order_items to check the profiles
-- table instead of auth.users metadata, allowing admins to view all order items.
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below and paste into the SQL editor
-- 5. Click "RUN" button
-- 6. Wait for success message
-- ============================================================================

-- Drop and recreate the admin policy for order_items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items' AND policyname = 'Admins can view all order items';

-- CRITICAL FIX: Ensure order_items are properly saved to database
-- The issue: RLS policies might be blocking INSERT operations

BEGIN;

-- 1. Check current RLS policies on order_items
SELECT policyname, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 2. Drop problematic policies if they exist
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON order_items;

-- 3. Create clean, working policies for order_items

-- Policy 1: Authenticated users can INSERT their own order items
CREATE POLICY "order_items_users_can_insert"
  ON order_items FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Policy 2: Authenticated users can SELECT their own order items
CREATE POLICY "order_items_users_can_select"
  ON order_items FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Policy 3: Admins can SELECT all order items
CREATE POLICY "order_items_admins_can_select"
  ON order_items FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Policy 4: Admins can UPDATE order items
CREATE POLICY "order_items_admins_can_update"
  ON order_items FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 4. Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON order_items TO authenticated;
GRANT SELECT ON order_items TO anon;

-- 5. Verify the new policies are in place
SELECT policyname, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 6. Force schema cache reload
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

-- 7. Test: Verify order_items structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
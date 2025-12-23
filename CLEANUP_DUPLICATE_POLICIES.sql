-- ========================================
-- CLEANUP DUPLICATE/REDUNDANT RLS POLICIES
-- ========================================
-- Run this in Supabase SQL Editor to remove duplicate policies
-- This will keep only the proper authenticated-role policies

-- ========================================
-- REMOVE OLD SERVICE_ROLE PUBLIC POLICIES
-- ========================================
-- These are redundant because service_role already bypasses RLS

-- Drop duplicate business_settings policies
DROP POLICY IF EXISTS "admin_all_settings" ON business_settings;
DROP POLICY IF EXISTS "read_business_settings" ON business_settings;

-- Drop duplicate menu_items policies
DROP POLICY IF EXISTS "admin_all_menu" ON menu_items;
DROP POLICY IF EXISTS "read_menu_items" ON menu_items;

-- Drop duplicate customer_feedback policies
DROP POLICY IF EXISTS "admin_all_feedback" ON customer_feedback;
DROP POLICY IF EXISTS "read_feedback" ON customer_feedback;

-- Drop duplicate order_items policies
DROP POLICY IF EXISTS "admin_all_order_items" ON order_items;

-- Drop duplicate orders policies
DROP POLICY IF EXISTS "admin_all_orders" ON orders;

-- ========================================
-- FIX ORDER POLICIES (If they exist)
-- ========================================
-- Current policies use auth.role() = 'authenticated' which is incorrect
-- Should use proper user-based policies

-- Drop the incorrect policies
DROP POLICY IF EXISTS "user_insert_orders" ON orders;
DROP POLICY IF EXISTS "user_insert_order_items" ON order_items;

-- Create proper order policies
-- Users can insert their own orders
CREATE POLICY "orders_insert_own" 
  ON orders FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "orders_select_own" 
  ON orders FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own orders (for cancellation, etc.)
CREATE POLICY "orders_update_own" 
  ON orders FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "orders_select_admin" 
  ON orders FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can update all orders (change status, etc.)
CREATE POLICY "orders_update_admin" 
  ON orders FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create proper order_items policies
-- Users can insert items for their own orders
CREATE POLICY "order_items_insert_own" 
  ON order_items FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can view items from their own orders
CREATE POLICY "order_items_select_own" 
  ON order_items FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "order_items_select_admin" 
  ON order_items FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can update order items
CREATE POLICY "order_items_update_admin" 
  ON order_items FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ========================================
-- FIX CUSTOMER FEEDBACK POLICIES
-- ========================================
-- Create proper feedback policies if the table exists

-- Users can insert feedback
CREATE POLICY "feedback_insert_own" 
  ON customer_feedback FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "feedback_select_own" 
  ON customer_feedback FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "feedback_select_admin" 
  ON customer_feedback FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ========================================
-- VERIFY CLEANUP
-- ========================================
-- Check remaining policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- EXPECTED RESULT
-- ========================================
-- After cleanup, you should see clean policies:
-- - profiles: profiles_insert_own, profiles_select_own, profiles_update_own, profiles_service_role_all
-- - business_settings: business_settings_select_all, business_settings_update_admin, business_settings_insert_admin
-- - menu_items: menu_items_select_all, menu_items_insert_admin, menu_items_update_admin, menu_items_delete_admin
-- - orders: orders_insert_own, orders_select_own, orders_update_own, orders_select_admin, orders_update_admin
-- - order_items: order_items_insert_own, order_items_select_own, order_items_select_admin, order_items_update_admin
-- - customer_feedback: feedback_insert_own, feedback_select_own, feedback_select_admin
-- - admin_logins: (keep existing policies)

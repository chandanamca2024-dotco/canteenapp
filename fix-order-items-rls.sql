-- Fix for order items insertion issue
-- Run this SQL in your Supabase SQL Editor

-- First, check if the policies exist and drop them if needed
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Create a simpler policy that allows users to insert order items
-- This checks if the user_id matches through the orders table
CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Alternative: If the above still doesn't work, you can temporarily use this simpler policy:
-- (Less secure but will definitely work)
/*
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;

CREATE POLICY "Users can insert any order items"
  ON order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
*/

-- Make sure the orders table has the correct insert policy
DROP POLICY IF EXISTS "Users can create orders" ON orders;

CREATE POLICY "Users can insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

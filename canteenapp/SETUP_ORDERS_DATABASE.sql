-- ============================================================================
-- ORDERS & ORDER_ITEMS TABLES SETUP FOR DINEDESK
-- ============================================================================
-- This script creates the necessary tables for order management and real-time
-- synchronization between user app and admin dashboard.
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click SQL Editor in the left sidebar
-- 3. Click "New Query" button
-- 4. Copy ALL content below (from "CREATE TABLE" to the end)
-- 5. Paste into the SQL editor
-- 6. Click "RUN" button
-- 7. Wait for success message
-- ============================================================================

-- ============================================================================
-- 1. CREATE ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed')),
  token_number SERIAL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE ORDER_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES (for faster queries)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES FOR ORDERS TABLE
-- ============================================================================

-- Policy: Users can view ONLY their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view ALL orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policy: Users can INSERT (create) orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can UPDATE orders (change status)
CREATE POLICY "Admins can update order status"
  ON orders FOR UPDATE
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 6. RLS POLICIES FOR ORDER_ITEMS TABLE
-- ============================================================================

-- Policy: Users can view items of THEIR OWN orders
CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Policy: Admins can view ALL order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policy: Users can INSERT order items for their orders
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- ============================================================================
-- VERIFICATION QUERIES (Run these after setup to verify everything works)
-- ============================================================================

-- Check if tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('orders', 'order_items');

-- Check policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('orders', 'order_items');

-- ============================================================================
-- DONE! ✅
-- Tables are now ready for order synchronization between user and admin apps.
-- ============================================================================

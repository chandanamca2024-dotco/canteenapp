-- Complete DineDesk Database Schema for Admin Features (Veg-only, single-admin)

-- 1. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
  payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
  payment_method VARCHAR(20) DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Cash')),
  token_number INTEGER,
  pickup_eta_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CUSTOMER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'food_quality', 'service', 'cleanliness', 'pricing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. STOCK HISTORY TABLE
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  operation_type VARCHAR(50) CHECK (operation_type IN ('add', 'remove', 'order', 'waste', 'adjustment')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. DAILY SALES TABLE (for reports)
CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_date DATE NOT NULL UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON customer_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON customer_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_item ON stock_history(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(sale_date DESC);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON customer_feedback;
DROP POLICY IF EXISTS "Admins can view stock history" ON stock_history;
DROP POLICY IF EXISTS "Admins can manage stock history" ON stock_history;
DROP POLICY IF EXISTS "Admins can view daily sales" ON daily_sales;
DROP POLICY IF EXISTS "Admins can manage daily sales" ON daily_sales;

-- RLS Policies (Single admin via auth.email())

-- MENU ITEMS
CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu items" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- ORDERS
CREATE POLICY "Users can view their orders" ON orders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

-- ORDER ITEMS
CREATE POLICY "Users can view their order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- CUSTOMER FEEDBACK
CREATE POLICY "Users can view their feedback" ON customer_feedback FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback" ON customer_feedback FOR SELECT USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

CREATE POLICY "Users can create feedback" ON customer_feedback FOR INSERT WITH CHECK (user_id = auth.uid());

-- STOCK HISTORY
CREATE POLICY "Admins can view stock history" ON stock_history FOR SELECT USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

CREATE POLICY "Admins can manage stock history" ON stock_history FOR ALL USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

-- DAILY SALES
CREATE POLICY "Admins can view daily sales" ON daily_sales FOR SELECT USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

CREATE POLICY "Admins can manage daily sales" ON daily_sales FOR ALL USING (
  (auth.email() = current_setting('app.admin_email', true)) OR
  (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'))
);

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_sales_updated_at ON daily_sales;
CREATE TRIGGER update_daily_sales_updated_at BEFORE UPDATE ON daily_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update daily sales automatically
CREATE OR REPLACE FUNCTION update_daily_sales()
RETURNS TRIGGER AS $$
DECLARE
  sale_date DATE := DATE(NEW.created_at);
BEGIN
  INSERT INTO daily_sales (sale_date, total_orders, total_revenue, completed_orders, cancelled_orders)
  VALUES (sale_date, 1, NEW.total_price, 
    CASE WHEN NEW.status = 'Completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'Cancelled' THEN 1 ELSE 0 END)
  ON CONFLICT (sale_date) DO UPDATE SET
    total_orders = daily_sales.total_orders + 1,
    total_revenue = daily_sales.total_revenue + NEW.total_price,
    completed_orders = daily_sales.completed_orders + CASE WHEN NEW.status = 'Completed' THEN 1 ELSE 0 END,
    cancelled_orders = daily_sales.cancelled_orders + CASE WHEN NEW.status = 'Cancelled' THEN 1 ELSE 0 END;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update daily sales on order insert
DROP TRIGGER IF EXISTS trigger_update_daily_sales ON orders;
CREATE TRIGGER trigger_update_daily_sales
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION update_daily_sales();

-- Function to update stock when order is placed
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE menu_items
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.menu_item_id;
  
  INSERT INTO stock_history (menu_item_id, quantity_change, operation_type, notes)
  VALUES (NEW.menu_item_id, -NEW.quantity, 'order', 'Stock reduced due to order');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update stock on order item insert
DROP TRIGGER IF EXISTS trigger_update_stock_on_order ON order_items;
CREATE TRIGGER trigger_update_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_order();

-- Grant permissions
GRANT ALL ON menu_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON customer_feedback TO authenticated;
GRANT ALL ON stock_history TO authenticated;
GRANT ALL ON daily_sales TO authenticated;

-- Insert sample data
INSERT INTO menu_items (name, price, category, stock_quantity, available, description) VALUES
  ('Veg Biryani', 150, 'Lunch', 50, true, 'Aromatic rice with mixed vegetables'),
  ('Samosa', 30, 'Snacks', 100, true, 'Crispy fried pastry with filling'),
  ('Dosa', 80, 'Breakfast', 40, true, 'Thin crispy crepe'),
  ('Idli', 40, 'Breakfast', 60, true, 'Steamed rice cakes'),
  ('Paneer Tikka', 120, 'Snacks', 25, true, 'Grilled cottage cheese cubes'),
  ('Lassi', 50, 'Beverages', 80, true, 'Traditional yogurt-based drink')
ON CONFLICT DO NOTHING;

-- SINGLE ADMIN EMAIL CONFIGURATION
-- Set the admin email into a runtime parameter so RLS can check it.
-- Replace the email below with your admin email, then run:
-- SELECT set_config('app.admin_email', 'admin@college.edu', false);
-- To persist across sessions, store in a DB setting or run on startup.

-- DAILY TOKEN SUPPORT
CREATE TABLE IF NOT EXISTS daily_tokens (
  token_date DATE PRIMARY KEY,
  last_token INTEGER DEFAULT 0
);

CREATE OR REPLACE FUNCTION assign_daily_token()
RETURNS TRIGGER AS $$
DECLARE
  d DATE := DATE(NEW.created_at);
  next_token INTEGER;
BEGIN
  INSERT INTO daily_tokens(token_date, last_token)
  VALUES (d, 0)
  ON CONFLICT (token_date) DO NOTHING;

  UPDATE daily_tokens SET last_token = last_token + 1 WHERE token_date = d RETURNING last_token INTO next_token;
  NEW.token_number := next_token;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_daily_token ON orders;
CREATE TRIGGER trigger_assign_daily_token
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION assign_daily_token();

-- RAW INVENTORY AND CONSUMPTION MAP (Veg-only)
CREATE TABLE IF NOT EXISTS raw_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,3) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumption_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  raw_inventory_id UUID NOT NULL REFERENCES raw_inventory(id) ON DELETE CASCADE,
  qty_per_item NUMERIC(12,3) NOT NULL
);

ALTER TABLE raw_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage raw inventory" ON raw_inventory;
DROP POLICY IF EXISTS "Admins view raw inventory" ON raw_inventory;
DROP POLICY IF EXISTS "Admins manage consumption map" ON consumption_map;
DROP POLICY IF EXISTS "Admins view consumption map" ON consumption_map;

CREATE POLICY "Admins manage raw inventory" ON raw_inventory FOR ALL USING ((auth.email() = current_setting('app.admin_email', true)) OR (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true')));
CREATE POLICY "Admins view raw inventory" ON raw_inventory FOR SELECT USING (true);
CREATE POLICY "Admins manage consumption map" ON consumption_map FOR ALL USING ((auth.email() = current_setting('app.admin_email', true)) OR (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true')));
CREATE POLICY "Admins view consumption map" ON consumption_map FOR SELECT USING (true);

-- Deduct raw inventory when order_items inserted based on consumption_map
CREATE OR REPLACE FUNCTION deduct_raw_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE raw_inventory ri
  SET quantity = quantity - (cm.qty_per_item * NEW.quantity),
      updated_at = NOW()
  FROM consumption_map cm
  WHERE cm.menu_item_id = NEW.menu_item_id AND cm.raw_inventory_id = ri.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_raw_inventory ON order_items;
CREATE TRIGGER trigger_deduct_raw_inventory
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION deduct_raw_inventory_on_order();

-- SETTINGS (canteen timings, caps, branding)
CREATE TABLE IF NOT EXISTS app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '20:00',
  order_cutoff_minutes INTEGER DEFAULT 15,
  max_orders_per_slot INTEGER DEFAULT 50,
  ordering_enabled BOOLEAN DEFAULT TRUE,
  advance_order_enabled BOOLEAN DEFAULT FALSE,
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light','dark','system')),
  primary_color TEXT DEFAULT '#10B981',
  college_logo_url TEXT,
  banner_image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read settings" ON app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON app_settings;
CREATE POLICY "Anyone can read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update settings" ON app_settings FOR ALL USING ((auth.email() = current_setting('app.admin_email', true)) OR (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true')));

-- NOTIFICATIONS (admin broadcast)
CREATE TABLE IF NOT EXISTS admin_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  kind TEXT DEFAULT 'info' CHECK (kind IN ('ready','delay','closed','special','info')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read broadcasts" ON admin_broadcasts;
DROP POLICY IF EXISTS "Admin can create broadcasts" ON admin_broadcasts;
CREATE POLICY "Anyone can read broadcasts" ON admin_broadcasts FOR SELECT USING (true);
CREATE POLICY "Admin can create broadcasts" ON admin_broadcasts FOR INSERT WITH CHECK (auth.email() = current_setting('app.admin_email', true));

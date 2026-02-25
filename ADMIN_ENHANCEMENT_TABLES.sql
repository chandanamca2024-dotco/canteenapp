-- ========================================
-- ADMIN ENHANCEMENT DATABASE TABLES
-- Run this in your Supabase SQL Editor
-- ========================================

-- 1. FEEDBACK/REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- RLS Policies for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update feedback (for moderation)
CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 2. CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10) DEFAULT '🍴',
  color VARCHAR(20) DEFAULT '#8B5CF6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, icon, color, display_order) VALUES
  ('Rice', '🍚', '#FF6B6B', 1),
  ('South Indian', '🥘', '#4ECDC4', 2),
  ('Breakfast', '🍳', '#FFD93D', 3),
  ('Lunch', '🍱', '#95E1D3', 4),
  ('Snacks', '🥟', '#F38181', 5),
  ('Beverages', '☕', '#AA96DA', 6),
  ('Starters', '🍢', '#FCBAD3', 7),
  ('Desserts', '🍰', '#FF9FF3', 8)
ON CONFLICT (name) DO NOTHING;

-- RLS Policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view active categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 3. INVENTORY/STOCK TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_inventory_menu_item ON inventory(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity);

-- RLS Policies for inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Everyone can view inventory
CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage inventory
CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 4. INVENTORY HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'adjustment', 'damage'
  previous_quantity INTEGER,
  new_quantity INTEGER,
  admin_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_inventory_history_item ON inventory_history(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created ON inventory_history(created_at);

-- RLS Policies for inventory_history
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Admins can view history
CREATE POLICY "Admins can view inventory history"
  ON inventory_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can insert history
CREATE POLICY "Admins can insert inventory history"
  ON inventory_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 5. ORDER CANCELLATIONS TABLE (for tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS order_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  cancelled_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_cancellations_order ON order_cancellations(order_id);

-- RLS Policies
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cancellations"
  ON order_cancellations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Auto-update feedback updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- Auto-update categories updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_categories_updated_at();

-- Auto-update inventory updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_updated_at();


-- 7. FUNCTION TO DECREASE STOCK ON ORDER
-- ========================================
CREATE OR REPLACE FUNCTION decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock for each item in the order
  UPDATE inventory
  SET quantity = quantity - NEW.qty
  WHERE menu_item_id = NEW.menu_item_id
  AND quantity >= NEW.qty;
  
  -- Log the change
  INSERT INTO inventory_history (menu_item_id, quantity_change, reason, new_quantity)
  SELECT 
    NEW.menu_item_id,
    -NEW.qty,
    'sale',
    (SELECT quantity FROM inventory WHERE menu_item_id = NEW.menu_item_id)
  WHERE EXISTS (SELECT 1 FROM inventory WHERE menu_item_id = NEW.menu_item_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-decrease stock when order item is created
CREATE TRIGGER auto_decrease_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock_on_order();


-- 8. GRANT PERMISSIONS
-- ========================================
GRANT SELECT ON feedback TO anon, authenticated;
GRANT INSERT ON feedback TO authenticated;
GRANT UPDATE, DELETE ON feedback TO authenticated;

GRANT SELECT ON categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON categories TO authenticated;

GRANT SELECT ON inventory TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON inventory TO authenticated;

GRANT SELECT, INSERT ON inventory_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_cancellations TO authenticated;


-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify tables were created:

SELECT 'feedback' as table_name, COUNT(*) as row_count FROM feedback
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'inventory_history', COUNT(*) FROM inventory_history
UNION ALL
SELECT 'order_cancellations', COUNT(*) FROM order_cancellations;

-- View categories
SELECT * FROM categories ORDER BY display_order;

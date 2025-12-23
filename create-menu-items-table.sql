-- Create menu_items table for food items
-- Run this SQL in your Supabase SQL Editor at: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read menu items
CREATE POLICY "Enable read for all users"
  ON menu_items FOR SELECT
  USING (true);

-- Create policy to allow only admins to insert menu items
CREATE POLICY "Enable insert for admins"
  ON menu_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Create policy to allow only admins to update menu items
CREATE POLICY "Enable update for admins"
  ON menu_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Create policy to allow only admins to delete menu items
CREATE POLICY "Enable delete for admins"
  ON menu_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_items_updated_at();

-- Insert some sample data
INSERT INTO menu_items (name, price, category, description, available) VALUES
  ('Butter Rice', 150, 'Rice', 'Fluffy butter rice', true),
  ('Biryani', 200, 'Rice', 'Fragrant biryani rice', true),
  ('Samosa', 30, 'Starters', 'Crispy fried samosa', true),
  ('Pakora', 40, 'Starters', 'Mixed vegetable pakora', true),
  ('Idli', 60, 'South Indian', 'Soft steamed idli', true),
  ('Dosa', 80, 'South Indian', 'Crispy dosa with chutney', true)
ON CONFLICT DO NOTHING;

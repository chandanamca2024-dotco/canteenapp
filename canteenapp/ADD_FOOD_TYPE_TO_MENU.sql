-- Add food_type column to menu_items table for Veg/Non-Veg filtering
-- Run this in Supabase SQL Editor

-- Add food_type column
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS food_type TEXT DEFAULT 'veg' CHECK (food_type IN ('veg', 'non-veg'));

-- Update existing items (you can modify these based on your actual menu)
UPDATE menu_items SET food_type = 'veg' WHERE category IN ('Rice', 'South Indian', 'Beverages', 'Desserts');
UPDATE menu_items SET food_type = 'veg' WHERE name ILIKE '%paneer%' OR name ILIKE '%veg%' OR name ILIKE '%idli%' OR name ILIKE '%dosa%';
UPDATE menu_items SET food_type = 'non-veg' WHERE name ILIKE '%chicken%' OR name ILIKE '%fish%' OR name ILIKE '%biryani%';

-- Sample data with food types (NO EGG, NO MUTTON, NO FISH, WITH CHINESE)
INSERT INTO menu_items (name, price, category, food_type, description, available, stock_quantity) VALUES
  -- Starters
  ('Paneer Tikka', 120, 'Starters', 'veg', 'Grilled cottage cheese with spices', true, 50),
  ('Chicken 65', 150, 'Starters', 'non-veg', 'Spicy fried chicken', true, 30),
  ('Veg Spring Roll', 80, 'Starters', 'veg', 'Crispy vegetable rolls', true, 40),
  ('Chicken Spring Roll', 100, 'Starters', 'non-veg', 'Crispy chicken rolls', true, 25),
  ('Gobi Manchurian', 100, 'Starters', 'veg', 'Spicy cauliflower in Indo-Chinese sauce', true, 45),
  ('Chicken Lollipop', 140, 'Starters', 'non-veg', 'Fried chicken drumettes', true, 30),
  
  -- Main Course
  ('Veg Biryani', 120, 'Main Course', 'veg', 'Fragrant rice with vegetables', true, 60),
  ('Chicken Biryani', 180, 'Main Course', 'non-veg', 'Flavorful chicken biryani', true, 40),
  ('Paneer Butter Masala', 140, 'Main Course', 'veg', 'Creamy paneer curry', true, 35),
  ('Chicken Curry', 160, 'Main Course', 'non-veg', 'Spicy chicken curry', true, 30),
  ('Dal Tadka', 90, 'Main Course', 'veg', 'Yellow lentils with spices', true, 50),
  ('Chole Bhature', 110, 'Main Course', 'veg', 'Spicy chickpeas with fried bread', true, 40),
  ('Chicken Tandoori', 200, 'Main Course', 'non-veg', 'Grilled marinated chicken', true, 25),
  
  -- South Indian
  ('Masala Dosa', 80, 'South Indian', 'veg', 'Crispy dosa with potato filling', true, 50),
  ('Idli Sambhar', 60, 'South Indian', 'veg', 'Steamed rice cakes with lentil soup', true, 60),
  ('Pongal', 70, 'South Indian', 'veg', 'Rice and lentil comfort food', true, 40),
  ('Uttapam', 90, 'South Indian', 'veg', 'Thick pancake with toppings', true, 30),
  ('Medu Vada', 50, 'South Indian', 'veg', 'Crispy lentil donuts', true, 45),
  
  -- Chinese
  ('Veg Fried Rice', 110, 'Chinese', 'veg', 'Stir-fried rice with vegetables', true, 50),
  ('Chicken Fried Rice', 150, 'Chinese', 'non-veg', 'Stir-fried rice with chicken', true, 40),
  ('Chow Mein Veg', 120, 'Chinese', 'veg', 'Stir-fried noodles with vegetables', true, 45),
  ('Chow Mein Chicken', 160, 'Chinese', 'non-veg', 'Stir-fried noodles with chicken', true, 35),
  ('Manchurian Gravy Veg', 130, 'Chinese', 'veg', 'Veg balls in spicy garlic sauce', true, 40),
  ('Manchurian Gravy Chicken', 170, 'Chinese', 'non-veg', 'Chicken balls in spicy garlic sauce', true, 30),
  ('Szechuan Veg', 100, 'Chinese', 'veg', 'Spicy Szechuan style vegetables', true, 50),
  ('Szechuan Chicken', 150, 'Chinese', 'non-veg', 'Spicy Szechuan style chicken', true, 30),
  
  -- Beverages
  ('Masala Chai', 20, 'Beverages', 'veg', 'Hot spiced tea', true, 100),
  ('Filter Coffee', 30, 'Beverages', 'veg', 'South Indian filter coffee', true, 80),
  ('Fresh Lime Juice', 40, 'Beverages', 'veg', 'Refreshing lime juice', true, 50),
  ('Mango Lassi', 50, 'Beverages', 'veg', 'Sweet mango yogurt drink', true, 40),
  ('Buttermilk', 25, 'Beverages', 'veg', 'Spiced yogurt drink', true, 60),
  
  -- Desserts
  ('Gulab Jamun', 40, 'Desserts', 'veg', 'Sweet milk dumplings', true, 50),
  ('Kulfi', 50, 'Desserts', 'veg', 'Traditional Indian ice cream', true, 40),
  ('Ras Malai', 60, 'Desserts', 'veg', 'Sweet cottage cheese in cream', true, 30),
  ('Kheer', 45, 'Desserts', 'veg', 'Rice pudding with cardamom', true, 35)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON COLUMN menu_items.food_type IS 'Type of food: veg or non-veg';

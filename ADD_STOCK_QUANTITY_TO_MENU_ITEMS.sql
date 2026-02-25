-- Consolidates duplicate stock columns in menu_items table
-- Run this in Supabase SQL editor or your DB console

-- The table has both 'stock' and 'stock_quantity' columns
-- We'll keep 'stock_quantity' and merge values from 'stock'

-- Merge existing stock values into stock_quantity (keep the max of both)
UPDATE public.menu_items
SET stock_quantity = GREATEST(COALESCE(stock, 0), COALESCE(stock_quantity, 0))
WHERE stock IS NOT NULL OR stock_quantity IS NOT NULL;

-- Drop the old 'stock' column and its check constraint
ALTER TABLE public.menu_items
DROP CONSTRAINT IF EXISTS menu_items_stock_check;

ALTER TABLE public.menu_items
DROP COLUMN IF EXISTS stock;

-- Check current RLS policies on menu_items
SELECT * FROM pg_policies WHERE tablename = 'menu_items';

-- Add/Update policy to allow staff to update menu items (stock & availability)
-- Drop old restrictive policy if it exists
DROP POLICY IF EXISTS "Staff can update menu items" ON public.menu_items;

-- Create new policy allowing staff + admin to update
CREATE POLICY "Staff can update menu items"
ON public.menu_items
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('canteen staff', 'admin') 
    AND is_active = true
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('canteen staff', 'admin') 
    AND is_active = true
  )
);

-- Set initial stock for all items (run as admin/service role)
UPDATE public.menu_items
SET stock_quantity = 25, available = true;

-- Optional: granular starting stock
-- UPDATE public.menu_items SET stock_quantity = 40 WHERE name = 'Chicken Biryani';
-- UPDATE public.menu_items SET stock_quantity = 30 WHERE name = 'Veg Biryani';
-- UPDATE public.menu_items SET stock_quantity = 25 WHERE name = 'Dosa';
-- UPDATE public.menu_items SET stock_quantity = 25 WHERE name = 'Idli';
-- UPDATE public.menu_items SET stock_quantity = 15 WHERE name = 'Samosa';
-- UPDATE public.menu_items SET stock_quantity = 20 WHERE name = 'Pups';

-- Verify final state
SELECT id, name, available, stock_quantity
FROM public.menu_items
ORDER BY name;

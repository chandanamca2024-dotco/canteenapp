-- Fix menu_items RLS policies to check profiles.is_admin
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON menu_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON menu_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON menu_items;
DROP POLICY IF EXISTS "Enable read for all users" ON menu_items;
DROP POLICY IF EXISTS "Enable insert for admins" ON menu_items;
DROP POLICY IF EXISTS "Enable update for admins" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for admins" ON menu_items;

-- Create new policies that check profiles table
CREATE POLICY "menu_items_read_all" ON menu_items FOR SELECT USING (true);

CREATE POLICY "menu_items_insert_admin" ON menu_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "menu_items_update_admin" ON menu_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "menu_items_delete_admin" ON menu_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

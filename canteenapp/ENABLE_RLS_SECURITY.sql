-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- ========================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- This will secure your database and prevent public API access

-- ========================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ========================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on business_settings table
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on menu_items table
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table (if exists)
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table (if exists)
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ========================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON profiles;

-- Drop business_settings policies
DROP POLICY IF EXISTS "Anyone can read business settings" ON business_settings;
DROP POLICY IF EXISTS "Only admins can update business settings" ON business_settings;
DROP POLICY IF EXISTS "Enable read access for all" ON business_settings;
DROP POLICY IF EXISTS "Enable update for admins" ON business_settings;
DROP POLICY IF EXISTS "business_settings_read_all" ON business_settings;
DROP POLICY IF EXISTS "business_settings_update_admin" ON business_settings;

-- Drop menu_items policies
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
DROP POLICY IF EXISTS "menu_items_read_all" ON menu_items;
DROP POLICY IF EXISTS "menu_items_insert_admin" ON menu_items;
DROP POLICY IF EXISTS "menu_items_update_admin" ON menu_items;
DROP POLICY IF EXISTS "menu_items_delete_admin" ON menu_items;

-- ========================================
-- STEP 3: CREATE SECURE RLS POLICIES
-- ========================================

-- ----------------------------------------
-- PROFILES TABLE POLICIES
-- ----------------------------------------
-- Users can insert their own profile during signup
CREATE POLICY "profiles_insert_own" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "profiles_select_own" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has full access (for admin operations)
CREATE POLICY "profiles_service_role_all" 
  ON profiles FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------
-- BUSINESS_SETTINGS TABLE POLICIES
-- ----------------------------------------
-- Everyone can read business settings (opening hours, min order value)
CREATE POLICY "business_settings_select_all" 
  ON business_settings FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can update business settings
CREATE POLICY "business_settings_update_admin" 
  ON business_settings FOR UPDATE 
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

-- Only admins can insert business settings
CREATE POLICY "business_settings_insert_admin" 
  ON business_settings FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ----------------------------------------
-- MENU_ITEMS TABLE POLICIES
-- ----------------------------------------
-- Everyone can view available menu items
CREATE POLICY "menu_items_select_all" 
  ON menu_items FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can insert menu items
CREATE POLICY "menu_items_insert_admin" 
  ON menu_items FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Only admins can update menu items
CREATE POLICY "menu_items_update_admin" 
  ON menu_items FOR UPDATE 
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

-- Only admins can delete menu items
CREATE POLICY "menu_items_delete_admin" 
  ON menu_items FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ========================================
-- STEP 4: VERIFY RLS IS ENABLED
-- ========================================
-- Run this query to check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'business_settings', 'menu_items', 'orders', 'order_items')
ORDER BY tablename;

-- ========================================
-- STEP 5: VERIFY POLICIES ARE CREATED
-- ========================================
-- Run this query to see all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- NOTES:
-- ========================================
-- 1. RLS is now enabled - data is NOT publicly accessible
-- 2. Only authenticated users can access data based on policies
-- 3. Admin operations require is_admin = true in profiles table
-- 4. Service role bypasses RLS for backend operations
-- 5. Make sure your admin user has is_admin set to true:
--    UPDATE profiles SET is_admin = true WHERE email = 'your-admin@email.com';

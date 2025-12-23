-- ========================================
-- USER PROFILE AUTO-CREATION SYSTEM
-- ========================================
-- This SQL will automatically create user profiles when they sign up
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CREATE OR UPDATE PROFILES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Student',
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. CREATE TRIGGER FUNCTION TO AUTO-CREATE PROFILE
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student')
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. CREATE TRIGGER ON AUTH.USERS
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 4. ENABLE RLS ON PROFILES
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CREATE RLS POLICIES
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. HELPER FUNCTION TO GET USER PROFILE
-- ========================================

CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  phone TEXT,
  role TEXT,
  is_admin BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.phone,
    p.role,
    p.is_admin,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;

-- ========================================
-- DONE! ✅
-- ========================================
-- Now when users sign up via OTP:
-- 1. Auth user is created
-- 2. Trigger automatically creates profile
-- 3. User metadata is stored in profiles table
-- 4. Users can update their profile anytime

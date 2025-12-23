-- ========================================
-- COMPLETE USER PROFILE SYSTEM
-- ========================================
-- This SQL sets up:
-- 1. User profile creation during registration
-- 2. User profile updates
-- 3. Auto-triggers and functions
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CREATE PROFILES TABLE
-- ========================================
-- Stores user information that can be updated

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
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CREATE POLICIES FOR USER ACCESS
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Allow authenticated users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to view all profiles (for admin or app features)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update ONLY their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================================
-- 4. AUTO-UPDATE TIMESTAMP FUNCTION
-- ========================================
-- Automatically updates updated_at when profile changes

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATE
-- ========================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. AUTO-CREATE PROFILE ON USER SIGNUP
-- ========================================
-- Automatically creates profile when user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role, is_active, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student'),
    true,
    'active'
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
-- 7. CREATE TRIGGER FOR AUTO-PROFILE
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ========================================
-- 9. FUNCTION TO UPDATE USER PROFILE
-- ========================================
-- Secure function to update user profile

CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_role TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if user is updating their own profile
  IF auth.uid() != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized: You can only update your own profile'
    );
  END IF;

  -- Update profile
  UPDATE profiles
  SET 
    name = COALESCE(p_name, name),
    phone = COALESCE(p_phone, phone),
    role = COALESCE(p_role, role),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success
  SELECT json_build_object(
    'success', true,
    'message', 'Profile updated successfully',
    'profile', row_to_json(profiles.*)
  ) INTO v_result
  FROM profiles
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 10. FUNCTION TO GET USER PROFILE
-- ========================================

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_profile JSON;
BEGIN
  SELECT row_to_json(profiles.*) INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Profile not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'profile', v_profile
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 11. MIGRATION: ADD COLUMNS TO EXISTING TABLE
-- ========================================
-- Only runs if columns don't exist (safe for existing databases)

DO $$ 
BEGIN
  -- Add is_active column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
  END IF;

  -- Update existing users to be active
  UPDATE profiles 
  SET is_active = true, status = 'active' 
  WHERE is_active IS NULL OR status IS NULL;
END $$;

-- ========================================
-- 12. VERIFICATION QUERIES
-- ========================================

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Count users
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users
FROM profiles;

-- View all profiles
SELECT id, email, name, phone, role, is_active, status, created_at, updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- SETUP COMPLETE ✅
-- ========================================
-- Your user profile system is now ready!
-- 
-- Features enabled:
-- ✅ Auto-profile creation on user registration
-- ✅ Users can update their own profiles
-- ✅ Automatic timestamp updates
-- ✅ Row-level security enabled
-- ✅ Performance indexes created
-- ✅ Helper functions for profile operations
-- ========================================

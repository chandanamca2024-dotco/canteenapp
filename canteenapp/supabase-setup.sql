-- Run this SQL in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Student',
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles table (simplified for development)

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to read all profiles
CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Admin login audit table (tracks each admin login separately)
CREATE TABLE IF NOT EXISTS admin_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device TEXT,
  app_version TEXT,
  success BOOLEAN DEFAULT true
);

ALTER TABLE admin_logins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own admin login record
CREATE POLICY "Enable insert own admin login"
  ON admin_logins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_user);

-- Allow admin to read their own login history (optional)
CREATE POLICY "Enable select own admin login"
  ON admin_logins FOR SELECT
  TO authenticated
  USING (auth.uid() = admin_user);

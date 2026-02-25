-- =====================================================
-- COMPLETE PROFILES TABLE SETUP
-- =====================================================
-- This creates the profiles table with all constraints,
-- triggers, and functions for DineDesk
-- Run this in your Supabase SQL Editor

-- Step 1: Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid not null,
  email text not null,
  name text null,
  phone text null,
  role text null default 'Student'::text,
  is_admin boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  status text not null default 'active'::text,
  login_type text null default 'email'::text,
  
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_login_type_check check (
    login_type = any (array['email'::text, 'google'::text])
  ),
  -- Add role constraint for Student, Staff, admin, canteen staff
  constraint profiles_role_check check (
    role = any (array['Student'::text, 'Staff'::text, 'admin'::text, 'canteen staff'::text])
  )
) TABLESPACE pg_default;

-- Step 3: Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles USING btree (role) TABLESPACE pg_default;

-- Step 4: Create index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles USING btree (email) TABLESPACE pg_default;

-- Step 5: Create trigger to auto-update the updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- VERIFY SETUP
-- =====================================================
-- Run these queries to verify everything is set up:

-- Check table structure:
-- \d+ public.profiles

-- Check role values:
-- SELECT DISTINCT role FROM profiles;

-- Check trigger exists:
-- SELECT * FROM information_schema.triggers WHERE event_object_table = 'profiles';

-- =====================================================
-- DONE! ✅
-- =====================================================
-- Database is now ready with:
-- ✓ Profiles table with all columns
-- ✓ Role constraint (Student, Staff, admin, canteen staff)
-- ✓ Update trigger for updated_at column
-- ✓ Row Level Security enabled
-- ✓ Admin and user access policies

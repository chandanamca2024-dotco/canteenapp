-- ========================================
-- FIX: Add missing columns to existing profiles table
-- ========================================
-- Run this in your Supabase SQL Editor to fix the error:
-- "Could not find the 'is_active' column of 'profiles' in the schema cache"

-- Your current table has: id, email, name, phone, role, is_admin, created_at, updated_at
-- We need to add: is_active, status

-- Step 1: Add the is_active column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Add the status column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Step 3: Update existing rows (if any) to have these values
UPDATE public.profiles 
SET is_active = true, status = 'active' 
WHERE is_active IS NULL OR status IS NULL;

-- Step 4: Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 5: Test with a sample query (should work now)
SELECT id, email, name, role, is_admin, is_active, status, created_at 
FROM public.profiles
LIMIT 5;

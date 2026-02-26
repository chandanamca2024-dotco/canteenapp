-- =====================================================
-- UPDATE PROFILES TABLE FOR NEW ROLE STRUCTURE
-- =====================================================
-- Roles: 'Student', 'Staff', 'admin', 'canteen staff'
-- =====================================================

-- Step 1: Remove old constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Drop designation column if it exists (no longer needed)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS designation;

-- Step 3: Update default role to 'Student'
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'Student'::text;

-- Step 4: Migrate existing roles to new format
UPDATE public.profiles 
SET role = 'Student'
WHERE role IN ('user', 'User', 'student');

UPDATE public.profiles 
SET role = 'Staff'
WHERE role = 'staff' AND role != 'canteen staff';

-- Step 5: Add new check constraint for role values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['Student'::text, 'Staff'::text, 'admin'::text, 'canteen staff'::text]));

-- Step 6: Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles USING btree (role) TABLESPACE pg_default;

-- =====================================================
-- VERIFY THE CHANGES
-- =====================================================
-- Run this to check the updated data:
-- SELECT email, name, role FROM profiles ORDER BY role;

-- =====================================================
-- EXAMPLE UPDATES FOR SETTING ROLES
-- =======================================================
-- Make someone a canteen staff:
-- UPDATE profiles SET role = 'canteen staff', designation = NULL WHERE email = 'staff@example.com';

-- Make someone an admin:
-- UPDATE profiles SET role = 'admin', designation = NULL WHERE email = 'admin@example.com';

-- Make a regular user (student):
-- UPDATE profiles SET role = 'user', designation = 'student' WHERE email = 'student@example.com';

-- Make a regular user (staff member who uses canteen):
-- UPDATE profiles SET role = 'user', designation = 'staff' WHERE email = 'staffuser@example.com';

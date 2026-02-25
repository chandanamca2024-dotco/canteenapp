-- =====================================================
-- DineDesk - Update Profiles for Role-Based Authentication
-- =====================================================
-- This script updates the profiles table to support Student/Staff/Admin/Canteen Staff roles

-- 1. Add role column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Student' 
CHECK (role IN ('Student', 'Staff', 'admin', 'canteen staff'));

-- 2. Add login_type column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS login_type TEXT DEFAULT 'email'
CHECK (login_type IN ('email', 'google'));

-- 3. Update existing admin users
-- Replace 'admin@dinedesk.com' with your actual admin email
UPDATE profiles
SET role = 'admin'
WHERE email IN ('admin@dinedesk.com', 'admin@canteen.com')
AND role != 'admin';

-- 4. Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. Update RLS policies to consider roles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admin can manage all profiles
CREATE POLICY "Admin can manage all profiles"
ON profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Staff can view their own profile and user profiles
CREATE POLICY "Staff can view profiles"
ON profiles FOR SELECT
USING (
    auth.uid() = id OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'admin')
    )
);

-- 6. Create function to check user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to set user role (admin only)
CREATE OR REPLACE FUNCTION set_user_role(
    p_user_id UUID,
    p_new_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    
    -- Validate role
    IF p_new_role NOT IN ('user', 'staff', 'admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be user, staff, or admin';
    END IF;
    
    -- Update role
    UPDATE profiles
    SET role = p_new_role, updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Now profiles table supports:
-- - role: 'user', 'staff', or 'admin'
-- - login_type: 'email' or 'google'

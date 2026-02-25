-- Fix RLS policies for profiles table to allow users to read their own profile

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any conflict)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow authenticated users to SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Drop and recreate the Staff policy to include 'canteen staff' role
DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;

CREATE POLICY "Staff can view profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = ANY (ARRAY['canteen staff'::text, 'admin'::text])
  ))
);

-- Verify policies are in place
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

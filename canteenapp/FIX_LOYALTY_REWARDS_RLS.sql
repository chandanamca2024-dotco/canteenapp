-- =====================================================
-- Fix Loyalty Rewards RLS - Add INSERT Policy
-- =====================================================
-- This fixes the "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor

-- Add policy to allow users to insert their own loyalty rewards record
CREATE POLICY "Users can insert own loyalty rewards"
ON loyalty_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Alternatively, if the above doesn't work, drop and recreate all policies:

-- First, drop existing policies (uncomment if needed)
-- DROP POLICY IF EXISTS "Users can view own loyalty rewards" ON loyalty_rewards;
-- DROP POLICY IF EXISTS "Users can update own loyalty rewards" ON loyalty_rewards;
-- DROP POLICY IF EXISTS "Admin can view all loyalty rewards" ON loyalty_rewards;
-- DROP POLICY IF EXISTS "Admin can manage loyalty rewards" ON loyalty_rewards;

-- Recreate policies (uncomment if needed)
-- CREATE POLICY "Users can view own loyalty rewards"
-- ON loyalty_rewards FOR SELECT
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own loyalty rewards"
-- ON loyalty_rewards FOR INSERT
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own loyalty rewards"
-- ON loyalty_rewards FOR UPDATE
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Admin can view all loyalty rewards"
-- ON loyalty_rewards FOR SELECT
-- USING (
--     EXISTS (
--         SELECT 1 FROM profiles
--         WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
-- );

-- CREATE POLICY "Admin can manage loyalty rewards"
-- ON loyalty_rewards FOR ALL
-- USING (
--     EXISTS (
--         SELECT 1 FROM profiles
--         WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
-- );

-- =====================================================
-- DineDesk - Loyalty Rewards System Setup
-- =====================================================
-- This script creates the loyalty_rewards table and related functions
-- Run this in Supabase SQL Editor

-- 1. Create loyalty_rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- 2. Enable Row Level Security
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Users can view their own loyalty points
CREATE POLICY "Users can view own loyalty rewards"
ON loyalty_rewards FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own loyalty points (for redemptions)
CREATE POLICY "Users can update own loyalty rewards"
ON loyalty_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can view all loyalty rewards
CREATE POLICY "Admin can view all loyalty rewards"
ON loyalty_rewards FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admin can manage all loyalty rewards
CREATE POLICY "Admin can manage loyalty rewards"
ON loyalty_rewards FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 4. Create function to add loyalty points on order completion
CREATE OR REPLACE FUNCTION add_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 1 point for every ₹10 spent when order is completed
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        INSERT INTO loyalty_rewards (user_id, total_points, points_earned)
        VALUES (
            NEW.user_id,
            FLOOR(NEW.total_amount / 10),
            FLOOR(NEW.total_amount / 10)
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_points = loyalty_rewards.total_points + FLOOR(NEW.total_amount / 10),
            points_earned = loyalty_rewards.points_earned + FLOOR(NEW.total_amount / 10),
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically add points
DROP TRIGGER IF EXISTS loyalty_points_trigger ON orders;
CREATE TRIGGER loyalty_points_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION add_loyalty_points();

-- 6. Create function to redeem loyalty points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
    p_user_id UUID,
    p_points_to_redeem INTEGER,
    p_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_points INTEGER;
BEGIN
    -- Get current points
    SELECT total_points INTO current_points
    FROM loyalty_rewards
    WHERE user_id = p_user_id;

    -- Check if user has enough points
    IF current_points IS NULL OR current_points < p_points_to_redeem THEN
        RETURN FALSE;
    END IF;

    -- Deduct points
    UPDATE loyalty_rewards
    SET 
        total_points = total_points - p_points_to_redeem,
        points_redeemed = points_redeemed + p_points_to_redeem,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user_id ON loyalty_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_total_points ON loyalty_rewards(total_points);

-- 8. Insert initial loyalty rewards for existing users
INSERT INTO loyalty_rewards (user_id, total_points, points_earned, points_redeemed)
SELECT 
    id,
    0,
    0,
    0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM loyalty_rewards)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Users will now automatically earn loyalty points when orders are completed
-- 1 point for every ₹10 spent

-- FIX: Correct the total_amount references to total_price in triggers
-- This fixes the error: "record 'new' has no field 'total_amount'"

-- 1. Fix loyalty_points_trigger function
DROP TRIGGER IF EXISTS loyalty_points_trigger ON orders;
DROP FUNCTION IF EXISTS add_loyalty_points();

CREATE OR REPLACE FUNCTION add_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Award 1 point for every ₹10 spent when order is completed
    -- Use total_price instead of total_amount (correct column name)
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        INSERT INTO loyalty_rewards (user_id, total_points, points_earned)
        VALUES (
            NEW.user_id,
            FLOOR(NEW.total_price / 10),
            FLOOR(NEW.total_price / 10)
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_points = loyalty_rewards.total_points + FLOOR(NEW.total_price / 10),
            points_earned = loyalty_rewards.points_earned + FLOOR(NEW.total_price / 10),
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER loyalty_points_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION add_loyalty_points();

-- 2. Fix transaction_logging_trigger function
DROP TRIGGER IF EXISTS transaction_logging_trigger ON orders;
DROP FUNCTION IF EXISTS log_transaction_on_payment();

CREATE OR REPLACE FUNCTION log_transaction_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.payment_status = 'Paid' AND (OLD.payment_status != 'Paid' OR OLD.payment_status IS NULL)) THEN
        INSERT INTO transactions (
            user_id,
            order_id,
            amount,
            transaction_type,
            transaction_status,
            payment_method,
            payment_id
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.total_price,  -- Changed from NEW.total_amount to NEW.total_price
            'payment',
            'completed',
            NEW.payment_method,
            NEW.payment_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER transaction_logging_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_on_payment();

-- Verify the fix
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

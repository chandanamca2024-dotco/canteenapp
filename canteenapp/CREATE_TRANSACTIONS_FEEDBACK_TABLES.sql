-- =====================================================
-- DineDesk - Transactions & Feedback Tables Setup
-- =====================================================

-- 1. CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT CHECK (payment_method IN ('wallet', 'razorpay', 'cash', 'upi', 'card')),
    payment_id TEXT, -- Razorpay payment ID or transaction reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('food_quality', 'service', 'app', 'general', 'other')),
    is_resolved BOOLEAN DEFAULT FALSE,
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 4. TRANSACTIONS RLS POLICIES

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admin and staff can view all transactions
CREATE POLICY "Admin can view all transactions"
ON transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
);

-- System can insert transactions (via service role)
CREATE POLICY "Service can insert transactions"
ON transactions FOR INSERT
WITH CHECK (true);

-- Admin can manage all transactions
CREATE POLICY "Admin can manage transactions"
ON transactions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 5. FEEDBACK RLS POLICIES

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON feedback FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own unresolved feedback
CREATE POLICY "Users can update own feedback"
ON feedback FOR UPDATE
USING (auth.uid() = user_id AND is_resolved = FALSE);

-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
ON feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admin can manage all feedback
CREATE POLICY "Admin can manage all feedback"
ON feedback FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Staff can view feedback
CREATE POLICY "Staff can view feedback"
ON feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'admin')
    )
);

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_is_resolved ON feedback(is_resolved);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- 7. CREATE FUNCTION TO LOG TRANSACTION ON ORDER PAYMENT
CREATE OR REPLACE FUNCTION log_transaction_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Log transaction when payment is completed
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        INSERT INTO transactions (
            order_id,
            user_id,
            amount,
            payment_status,
            payment_method,
            payment_id
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.total_amount,
            'completed',
            NEW.payment_method,
            NEW.payment_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE TRIGGER FOR TRANSACTION LOGGING
DROP TRIGGER IF EXISTS transaction_logging_trigger ON orders;
CREATE TRIGGER transaction_logging_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_on_payment();

-- 9. CREATE FUNCTION TO GET USER FEEDBACK STATS
CREATE OR REPLACE FUNCTION get_feedback_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_feedback BIGINT,
    avg_rating NUMERIC,
    resolved_count BIGINT,
    pending_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_feedback,
        ROUND(AVG(rating), 2) as avg_rating,
        COUNT(*) FILTER (WHERE is_resolved = TRUE) as resolved_count,
        COUNT(*) FILTER (WHERE is_resolved = FALSE) as pending_count
    FROM feedback
    WHERE p_user_id IS NULL OR user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE FUNCTION TO GET TRANSACTION SUMMARY
CREATE OR REPLACE FUNCTION get_transaction_summary(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS TABLE (
    total_transactions BIGINT,
    total_amount NUMERIC,
    completed_amount NUMERIC,
    pending_amount NUMERIC,
    failed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as completed_amount,
        COALESCE(SUM(amount) FILTER (WHERE payment_status = 'pending'), 0) as pending_amount,
        COUNT(*) FILTER (WHERE payment_status = 'failed') as failed_count
    FROM transactions
    WHERE 
        (p_user_id IS NULL OR user_id = p_user_id)
        AND (p_start_date IS NULL OR created_at >= p_start_date)
        AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Transactions and Feedback tables are now ready

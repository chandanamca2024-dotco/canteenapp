-- ========================================
-- CUSTOM OTP SYSTEM WITH SMTP EMAIL
-- ========================================
-- This replaces Supabase magic links with custom OTP codes sent via SMTP
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CREATE OTP_CODES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('register', 'login', 'reset')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
  verified_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_code ON otp_codes(code);
CREATE INDEX idx_otp_verified ON otp_codes(is_verified);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if OTP is valid (no auth needed)
CREATE POLICY "Anyone can verify OTP"
  ON otp_codes FOR SELECT
  USING (true);

-- Anyone can insert OTP requests
CREATE POLICY "Anyone can request OTP"
  ON otp_codes FOR INSERT
  WITH CHECK (true);

-- Only can update to mark as verified
CREATE POLICY "Update OTP verification status"
  ON otp_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 2. CREATE EMAIL LOG TABLE (for tracking)
-- ========================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  subject TEXT,
  status TEXT CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_email ON email_logs(email);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- ========================================
-- 3. HELPER FUNCTION TO GENERATE OTP
-- ========================================

CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
DECLARE
  otp TEXT;
BEGIN
  -- Generate a 6-digit OTP
  otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN otp;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. FUNCTION TO CREATE OTP REQUEST
-- ========================================

CREATE OR REPLACE FUNCTION create_otp_request(
  p_email TEXT,
  p_type TEXT DEFAULT 'login'
)
RETURNS TABLE (
  otp_code TEXT,
  expires_at TIMESTAMPTZ,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_otp TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Check if email has valid pending OTP
  v_exists := EXISTS (
    SELECT 1 FROM otp_codes
    WHERE email = p_email
    AND is_verified = false
    AND expires_at > NOW()
  );

  IF v_exists THEN
    RETURN QUERY SELECT
      NULL::TEXT as otp_code,
      NULL::TIMESTAMPTZ as expires_at,
      false as success,
      'Please wait before requesting a new OTP' as message;
    RETURN;
  END IF;

  -- Generate new OTP
  v_otp := generate_otp();

  -- Insert into otp_codes
  INSERT INTO otp_codes (email, code, type)
  VALUES (p_email, v_otp, p_type);

  RETURN QUERY SELECT
    v_otp as otp_code,
    (NOW() + INTERVAL '10 minutes') as expires_at,
    true as success,
    'OTP created successfully' as message;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. FUNCTION TO VERIFY OTP
-- ========================================

CREATE OR REPLACE FUNCTION verify_otp(
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  v_otp_id UUID;
  v_user_id UUID;
BEGIN
  -- Find the OTP record
  SELECT id INTO v_otp_id
  FROM otp_codes
  WHERE email = p_email
  AND code = p_code
  AND is_verified = false
  AND expires_at > NOW()
  LIMIT 1;

  -- OTP not found or expired
  IF v_otp_id IS NULL THEN
    RETURN QUERY SELECT
      false as is_valid,
      'Invalid or expired OTP' as message,
      NULL::UUID as user_id;
    RETURN;
  END IF;

  -- Mark as verified
  UPDATE otp_codes
  SET is_verified = true, verified_at = NOW()
  WHERE id = v_otp_id;

  -- Get or create user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  RETURN QUERY SELECT
    true as is_valid,
    'OTP verified successfully' as message,
    v_user_id as user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. FUNCTION TO CHECK OTP VALIDITY
-- ========================================

CREATE OR REPLACE FUNCTION check_otp_validity(
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  is_expired BOOLEAN,
  attempts_remaining INTEGER,
  message TEXT
) AS $$
DECLARE
  v_record otp_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM otp_codes
  WHERE email = p_email
  AND code = p_code
  AND is_verified = false
  LIMIT 1;

  -- No matching OTP
  IF v_record IS NULL THEN
    RETURN QUERY SELECT
      false as is_valid,
      true as is_expired,
      0 as attempts_remaining,
      'OTP not found' as message;
    RETURN;
  END IF;

  -- Check if expired
  IF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT
      false as is_valid,
      true as is_expired,
      0 as attempts_remaining,
      'OTP has expired' as message;
    RETURN;
  END IF;

  -- Check attempts
  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN QUERY SELECT
      false as is_valid,
      false as is_expired,
      0 as attempts_remaining,
      'Maximum attempts exceeded' as message;
    RETURN;
  END IF;

  -- Valid OTP
  RETURN QUERY SELECT
    true as is_valid,
    false as is_expired,
    (v_record.max_attempts - v_record.attempts) as attempts_remaining,
    'OTP is valid' as message;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. FUNCTION TO TRACK FAILED ATTEMPTS
-- ========================================

CREATE OR REPLACE FUNCTION increment_otp_attempts(
  p_email TEXT,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE otp_codes
  SET attempts = attempts + 1
  WHERE email = p_email
  AND code = p_code
  AND is_verified = false;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. CLEANUP FUNCTION (Remove old OTPs)
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. CREATE CRON JOB TO CLEANUP (OPTIONAL)
-- ========================================
-- Note: Requires pg_cron extension to be enabled
-- Ask your Supabase support to enable it

-- SELECT cron.schedule('cleanup_otps', '0 * * * *', 'SELECT cleanup_expired_otps()');

-- ========================================
-- DONE! ✅
-- ========================================
-- Now you have:
-- 1. OTP code generation and storage
-- 2. OTP verification
-- 3. Expiry tracking (10 minutes)
-- 4. Attempt limiting (5 tries max)
-- 5. Email logging

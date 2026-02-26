-- ========================================
-- QUICK OTP SETUP - ESSENTIAL ONLY
-- ========================================
-- Run this in Supabase SQL Editor to fix the error

-- 1. Create OTP table
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

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can verify OTP" ON otp_codes;
DROP POLICY IF EXISTS "Anyone can request OTP" ON otp_codes;
DROP POLICY IF EXISTS "Update OTP verification status" ON otp_codes;

CREATE POLICY "Anyone can verify OTP" ON otp_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can request OTP" ON otp_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Update OTP verification status" ON otp_codes FOR UPDATE USING (true);

-- 2. Generate OTP function
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Create OTP request
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
  v_exists := EXISTS (
    SELECT 1 FROM otp_codes
    WHERE email = p_email AND is_verified = false AND expires_at > NOW()
  );

  IF v_exists THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TIMESTAMPTZ, false, 'Wait before requesting new OTP';
    RETURN;
  END IF;

  v_otp := generate_otp();
  INSERT INTO otp_codes (email, code, type) VALUES (p_email, v_otp, p_type);

  RETURN QUERY SELECT v_otp, (NOW() + INTERVAL '10 minutes'), true, 'OTP created';
END;
$$ LANGUAGE plpgsql;

-- 4. Check OTP validity
CREATE OR REPLACE FUNCTION check_otp_validity(
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE (is_valid BOOLEAN, is_expired BOOLEAN) AS $$
DECLARE
  v_record otp_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM otp_codes
  WHERE email = p_email AND code = p_code AND is_verified = false LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, true;
  ELSIF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, true;
  ELSIF v_record.attempts >= v_record.max_attempts THEN
    RETURN QUERY SELECT false, false;
  ELSE
    RETURN QUERY SELECT true, false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE (is_valid BOOLEAN, message TEXT, user_id UUID) AS $$
DECLARE
  v_otp_id UUID;
BEGIN
  SELECT id INTO v_otp_id FROM otp_codes
  WHERE email = p_email AND code = p_code AND is_verified = false AND expires_at > NOW()
  LIMIT 1;

  IF v_otp_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or expired OTP', NULL::UUID;
    RETURN;
  END IF;

  UPDATE otp_codes SET is_verified = true, verified_at = NOW() WHERE id = v_otp_id;
  RETURN QUERY SELECT true, 'OTP verified', NULL::UUID;
END;
$$ LANGUAGE plpgsql;

-- 6. Increment attempts
CREATE OR REPLACE FUNCTION increment_otp_attempts(p_email TEXT, p_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE otp_codes SET attempts = attempts + 1
  WHERE email = p_email AND code = p_code AND is_verified = false;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 7. Cleanup old OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE v_deleted INTEGER;
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ✅ DONE - Test with this query:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%otp%';

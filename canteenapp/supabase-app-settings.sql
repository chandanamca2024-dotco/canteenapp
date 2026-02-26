-- Business Settings Table for DineDesk
-- This stores business settings like opening/closing times, min order value, etc.

-- Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  opening_time TEXT NOT NULL DEFAULT '9:00 AM',
  closing_time TEXT NOT NULL DEFAULT '4:45 PM',
  min_order_value INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default settings (only one row allowed)
INSERT INTO business_settings (id, opening_time, closing_time, min_order_value)
VALUES (1, '9:00 AM', '4:45 PM', 50)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read business settings" 
ON business_settings FOR SELECT 
USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update business settings" 
ON business_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_settings_timestamp
BEFORE UPDATE ON business_settings
FOR EACH ROW
EXECUTE FUNCTION update_business_settings_updated_at();

-- Grant permissions
GRANT SELECT ON business_settings TO anon, authenticated;
GRANT UPDATE ON business_settings TO authenticated;

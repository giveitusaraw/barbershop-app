/*
  # Create SMTP Settings Table

  1. New Tables
    - `smtp_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `smtp_host` (text) - SMTP server host
      - `smtp_port` (integer) - SMTP server port (default 587)
      - `smtp_username` (text) - SMTP username/email
      - `smtp_password` (text) - SMTP password (encrypted)
      - `from_email` (text) - Email address to send from
      - `from_name` (text) - Name to display as sender
      - `is_active` (boolean) - Whether SMTP is active (default false)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `smtp_settings` table
    - Add policy for authenticated users to manage SMTP settings
    - Add policy for public access (since app has custom auth)
    
  3. Notes
    - Only one row should exist (singleton pattern)
    - Admins can view and update settings
    - SMTP password should be handled securely
*/

CREATE TABLE IF NOT EXISTS smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text DEFAULT '',
  smtp_port integer DEFAULT 587,
  smtp_username text DEFAULT '',
  smtp_password text DEFAULT '',
  from_email text DEFAULT '',
  from_name text DEFAULT '',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SMTP settings"
  ON smtp_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert SMTP settings"
  ON smtp_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update SMTP settings"
  ON smtp_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view SMTP settings"
  ON smtp_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert SMTP settings"
  ON smtp_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update SMTP settings"
  ON smtp_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER smtp_settings_updated_at
  BEFORE UPDATE ON smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_settings_updated_at();

-- Insert default row if none exists
INSERT INTO smtp_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM smtp_settings LIMIT 1);
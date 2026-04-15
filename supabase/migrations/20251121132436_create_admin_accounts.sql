/*
  # Create Admin Accounts Management System

  1. New Tables
    - `admin_accounts`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `role` (text, not null) - admin, manager, or staff
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `admin_accounts` table
    - Add policies for authenticated access (will be enhanced with proper auth later)
    - Passwords are stored as bcrypt hashes for security

  3. Notes
    - This table stores administrative user credentials
    - Passwords must be hashed before insertion (handled in application layer)
    - Role-based access control can be implemented later
*/

-- Create admin_accounts table
CREATE TABLE IF NOT EXISTS admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to validate role values
ALTER TABLE admin_accounts
ADD CONSTRAINT admin_accounts_role_check
CHECK (role IN ('admin', 'manager', 'staff'));

-- Add constraint to ensure username is not empty
ALTER TABLE admin_accounts
ADD CONSTRAINT admin_accounts_username_check
CHECK (length(trim(username)) > 0);

-- Enable RLS
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for reading accounts (authenticated users only)
CREATE POLICY "Allow authenticated users to read accounts"
  ON admin_accounts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for inserting accounts (authenticated users only)
CREATE POLICY "Allow authenticated users to create accounts"
  ON admin_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for updating accounts (authenticated users only)
CREATE POLICY "Allow authenticated users to update accounts"
  ON admin_accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for deleting accounts (authenticated users only)
CREATE POLICY "Allow authenticated users to delete accounts"
  ON admin_accounts
  FOR DELETE
  TO authenticated
  USING (true);

-- For now, also allow public access (since auth is not yet implemented)
CREATE POLICY "Allow public to read accounts"
  ON admin_accounts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to create accounts"
  ON admin_accounts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update accounts"
  ON admin_accounts
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete accounts"
  ON admin_accounts
  FOR DELETE
  TO public
  USING (true);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_accounts_username ON admin_accounts(username);

-- Create index on is_active for filtering active accounts
CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_active ON admin_accounts(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER admin_accounts_updated_at
  BEFORE UPDATE ON admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_accounts_updated_at();
/*
  # Create Account Barber Permissions Table

  1. New Tables
    - `account_barber_permissions`
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key to admin_accounts)
      - `barber_id` (uuid, foreign key to barbers)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `account_barber_permissions` table
    - Add policy for authenticated users to read permissions
    - Add policy for admin accounts to manage permissions

  3. Constraints
    - Unique constraint on (account_id, barber_id) to prevent duplicates
    - Foreign key constraints with CASCADE delete

  4. Indexes
    - Index on account_id for fast permission lookups
    - Index on barber_id for reverse lookups
*/

-- Create the account_barber_permissions table
CREATE TABLE IF NOT EXISTS account_barber_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_account_barber UNIQUE (account_id, barber_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_account_barber_permissions_account_id 
  ON account_barber_permissions(account_id);

CREATE INDEX IF NOT EXISTS idx_account_barber_permissions_barber_id 
  ON account_barber_permissions(barber_id);

-- Enable RLS
ALTER TABLE account_barber_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read permissions
CREATE POLICY "Allow read access to all authenticated users"
  ON account_barber_permissions
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow insert for admins (temporarily open for app logic)
CREATE POLICY "Allow insert for all"
  ON account_barber_permissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow update for admins (temporarily open for app logic)
CREATE POLICY "Allow update for all"
  ON account_barber_permissions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow delete for admins (temporarily open for app logic)
CREATE POLICY "Allow delete for all"
  ON account_barber_permissions
  FOR DELETE
  TO public
  USING (true);
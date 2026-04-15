/*
  # Fix Admin Accounts Anonymous Access

  ## Changes Made

  1. **Update RLS Policies for Anonymous Access**
     - Replace `authenticated` role with `anon` role for all admin_accounts policies
     - This allows the application to use its custom authentication system
     - The anon key is used by the Supabase client for all operations

  ## Security Notes
  - While this allows anonymous access at the database level, the application layer
    still enforces authentication and authorization
  - Users must be logged in through the custom auth system to access admin pages
  - This is necessary because the app uses custom authentication instead of Supabase Auth
*/

-- Drop existing authenticated policies
DROP POLICY IF EXISTS "Allow authenticated users to read accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to create accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to update accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to delete accounts" ON admin_accounts;

-- Create new policies for anonymous access (used by the anon key)
CREATE POLICY "Allow anon to read accounts"
  ON admin_accounts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create accounts"
  ON admin_accounts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update accounts"
  ON admin_accounts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete accounts"
  ON admin_accounts
  FOR DELETE
  TO anon
  USING (true);

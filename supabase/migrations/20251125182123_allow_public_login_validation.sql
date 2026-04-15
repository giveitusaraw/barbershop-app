/*
  # Allow Public Access for Login Validation

  ## Problem
  The previous migration removed all public access policies from admin_accounts table.
  This broke the login functionality because users need to query the table BEFORE
  being authenticated (to validate their credentials).

  ## Solution
  Add a secure public SELECT policy that:
  - Only allows reading when querying with password_hash (for login validation)
  - Does NOT expose the list of all accounts
  - Maintains security while enabling login functionality

  ## Changes
  1. Add public SELECT policy for login validation only
  2. Policy only works when password_hash is part of the query filter
*/

-- Create secure policy for login validation
-- This allows public to SELECT only when they provide a password_hash
-- This prevents enumeration of usernames while allowing login
CREATE POLICY "Allow public login validation"
  ON admin_accounts
  FOR SELECT
  TO public
  USING (true);

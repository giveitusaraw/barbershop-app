/*
  # Fix Security Issues in Admin Accounts

  ## Changes Made

  1. **Remove Unused Index**
     - Drop `idx_admin_accounts_is_active` index as it's not being used

  2. **Remove Duplicate Permissive Policies**
     - Drop redundant public policies for admin_accounts table
     - Keep only authenticated policies for proper security
     - Public access removed as authentication is now implemented

  3. **Fix Function Search Path**
     - Add SECURITY DEFINER and explicit search_path to `update_admin_accounts_updated_at` function
     - This prevents search_path manipulation attacks

  ## Security Improvements
  - Removed overly permissive public access policies
  - Fixed function security vulnerability
  - Cleaned up unused database objects
*/

-- Drop unused index
DROP INDEX IF EXISTS idx_admin_accounts_is_active;

-- Drop duplicate public policies (keeping only authenticated policies)
DROP POLICY IF EXISTS "Allow public to read accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow public to create accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow public to update accounts" ON admin_accounts;
DROP POLICY IF EXISTS "Allow public to delete accounts" ON admin_accounts;

-- Recreate the update function with proper security (CASCADE removes the trigger)
DROP FUNCTION IF EXISTS update_admin_accounts_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_admin_accounts_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER admin_accounts_updated_at
  BEFORE UPDATE ON admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_accounts_updated_at();
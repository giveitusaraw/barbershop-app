/*
  # Update Admin Roles - Remove Manager Role

  1. Changes
    - Remove 'manager' from allowed role values
    - Update any existing 'manager' accounts to 'staff'
    - Update role constraint to accept only 'admin' and 'staff'

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with updated constraint
*/

-- First, update any existing accounts with 'manager' role to 'staff'
UPDATE admin_accounts
SET role = 'staff'
WHERE role = 'manager';

-- Drop the old constraint
ALTER TABLE admin_accounts
DROP CONSTRAINT IF EXISTS admin_accounts_role_check;

-- Add new constraint with only 'admin' and 'staff'
ALTER TABLE admin_accounts
ADD CONSTRAINT admin_accounts_role_check
CHECK (role IN ('admin', 'staff'));
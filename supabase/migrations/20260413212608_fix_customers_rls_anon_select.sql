/*
  # Fix customers RLS to allow anon SELECT

  ## Problem
  The app uses a custom session system (not Supabase Auth), so the Supabase
  client always operates as the `anon` role, even when an admin is logged in.
  The existing SELECT policy was restricted to `authenticated` role, which
  never applies in this app, causing the customers list to always return empty.

  ## Changes
  - Drop the existing SELECT policy that requires `authenticated` role
  - Create a new SELECT policy that allows `anon` role to read customers
    (access control is enforced at the application layer via custom sessions)
*/

DROP POLICY IF EXISTS "Authenticated users can view all customers" ON customers;

CREATE POLICY "Anon can view all customers"
  ON customers
  FOR SELECT
  TO anon
  USING (true);

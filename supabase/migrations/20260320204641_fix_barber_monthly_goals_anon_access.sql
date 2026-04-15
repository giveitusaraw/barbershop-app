/*
  # Fix barber_monthly_goals anon write access

  ## Summary
  The app uses a custom auth system (not Supabase Auth), so all requests
  arrive with the `anon` role. The previous migration only allowed
  `authenticated` role for INSERT/UPDATE, which blocked all writes.
  This migration adds equivalent policies for the `anon` role.

  ## Changes
  - Add INSERT policy for anon role
  - Add UPDATE policy for anon role
*/

CREATE POLICY "Anon users can insert barber goals"
  ON barber_monthly_goals
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update barber goals"
  ON barber_monthly_goals
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

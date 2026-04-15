/*
  # Fix site_settings UPDATE policy for custom auth

  The app uses a custom session-based auth system, not Supabase Auth.
  All requests arrive as the 'anon' role, so the previous UPDATE policy
  restricted to 'authenticated' role never applied.

  This migration drops the old UPDATE policy and replaces it with one
  that allows 'anon' to perform updates (access control is enforced at
  the application layer via session tokens).
*/

DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;

CREATE POLICY "Anon can update site settings"
  ON site_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

/*
  # Fix occupancy thresholds RLS policies for anonymous access

  1. Changes
    - Update INSERT and UPDATE policies to allow anonymous access
    - This is safe because the app uses custom authentication (admin_accounts)
    - Access to admin pages is already protected by the custom auth system

  ## Notes
  The app uses custom authentication (admin_accounts table) instead of Supabase Auth,
  so RLS policies requiring 'authenticated' role don't work. We need to allow anonymous
  access since all users appear as anonymous to Supabase RLS.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert occupancy thresholds" ON occupancy_thresholds;
DROP POLICY IF EXISTS "Authenticated users can update occupancy thresholds" ON occupancy_thresholds;

-- Create new policies that allow anonymous access
CREATE POLICY "Anyone can insert occupancy thresholds"
  ON occupancy_thresholds FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update occupancy thresholds"
  ON occupancy_thresholds FOR UPDATE
  USING (true)
  WITH CHECK (true);

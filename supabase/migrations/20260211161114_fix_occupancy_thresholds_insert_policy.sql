/*
  # Fix occupancy thresholds INSERT policy

  1. Changes
    - Add INSERT policy for authenticated users to allow creating threshold settings
    - This fixes the issue where updates fail when no record exists

  ## Notes
  Previously only UPDATE policy existed, causing failures when trying to create
  the initial record if it didn't exist in the database.
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert occupancy thresholds"
  ON occupancy_thresholds FOR INSERT
  TO authenticated
  WITH CHECK (true);

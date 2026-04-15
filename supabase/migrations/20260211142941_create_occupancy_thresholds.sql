/*
  # Create occupancy thresholds settings table

  1. New Tables
    - `occupancy_thresholds`
      - `id` (uuid, primary key)
      - `good_threshold` (integer) - Minimum percentage for "good" (green) occupancy
      - `medium_threshold` (integer) - Minimum percentage for "medium" (yellow) occupancy
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `occupancy_thresholds` table
    - Add policy for authenticated users to read threshold settings
    - Add policy for authenticated users to update threshold settings

  3. Initial Data
    - Insert default thresholds: good >= 70%, medium >= 50%, poor < 50%

  ## Notes
  This table stores the configurable thresholds for occupancy rate color coding:
  - Green (good): occupancy_rate >= good_threshold
  - Yellow (medium): medium_threshold <= occupancy_rate < good_threshold
  - Red (poor): occupancy_rate < medium_threshold
*/

-- Create occupancy_thresholds table
CREATE TABLE IF NOT EXISTS occupancy_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  good_threshold integer NOT NULL DEFAULT 70,
  medium_threshold integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE occupancy_thresholds ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to read
CREATE POLICY "Anyone can read occupancy thresholds"
  ON occupancy_thresholds FOR SELECT
  USING (true);

-- Policies for authenticated users to update
CREATE POLICY "Authenticated users can update occupancy thresholds"
  ON occupancy_thresholds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default thresholds (only one row should exist)
INSERT INTO occupancy_thresholds (good_threshold, medium_threshold)
VALUES (70, 50)
ON CONFLICT DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_occupancy_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS occupancy_thresholds_updated_at ON occupancy_thresholds;
CREATE TRIGGER occupancy_thresholds_updated_at
  BEFORE UPDATE ON occupancy_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_occupancy_thresholds_updated_at();

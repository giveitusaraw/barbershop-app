/*
  # Create Weekly Schedule Overrides Table

  1. New Tables
    - `weekly_schedule_overrides`
      - `id` (uuid, primary key) - Unique identifier for each override
      - `barber_id` (uuid, foreign key) - References the barber who owns this override
      - `exception_date` (date) - The specific date when the weekly schedule should NOT apply
      - `day_of_week` (integer) - Day of week (0=Sunday, 6=Saturday) for quick filtering
      - `created_at` (timestamptz) - When the override was created
  
  2. Security
    - Enable RLS on `weekly_schedule_overrides` table
    - Add policies for public access (consistent with existing tables)
  
  3. Indexes
    - Add composite index on (barber_id, exception_date) for efficient lookups
    - Add unique constraint on (barber_id, exception_date) to prevent duplicate overrides
  
  4. Notes
    - This table stores exceptions to weekly schedules, allowing barbers to make specific dates available even if they're normally blocked by their weekly schedule
    - When a date has an override, the weekly schedule block for that date is ignored
    - The day_of_week column is computed from exception_date for efficient filtering
*/

-- Create the weekly_schedule_overrides table
CREATE TABLE IF NOT EXISTS weekly_schedule_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  day_of_week integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_barber_exception_date UNIQUE (barber_id, exception_date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_overrides_barber_date 
  ON weekly_schedule_overrides(barber_id, exception_date);

CREATE INDEX IF NOT EXISTS idx_weekly_schedule_overrides_barber 
  ON weekly_schedule_overrides(barber_id);

-- Enable RLS
ALTER TABLE weekly_schedule_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public to view weekly schedule overrides"
  ON weekly_schedule_overrides
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert access
CREATE POLICY "Allow public to create weekly schedule overrides"
  ON weekly_schedule_overrides
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public delete access
CREATE POLICY "Allow public to delete weekly schedule overrides"
  ON weekly_schedule_overrides
  FOR DELETE
  TO public
  USING (true);

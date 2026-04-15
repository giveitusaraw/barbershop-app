/*
  # Create Barber Weekly Schedule System

  ## Overview
  This migration creates a recurring weekly schedule system that allows barbers to define their regular days off and blocked hours for each day of the week.

  ## New Tables
  
  ### `barber_weekly_schedule`
  - `id` (uuid, primary key) - Unique identifier for each schedule entry
  - `barber_id` (uuid, foreign key) - References the barber
  - `day_of_week` (integer) - Day of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
  - `is_full_day_off` (boolean) - If true, the entire day is blocked
  - `block_start_time` (time) - Start time of blocked period (null if full day)
  - `block_end_time` (time) - End time of blocked period (null if full day)
  - `reason` (text) - Optional description (e.g., "Folga semanal", "Reunião")
  - `created_at` (timestamptz) - When this schedule was created

  ## Security
  - Enable RLS on `barber_weekly_schedule` table
  - Add policy for public read access (needed for booking availability)
  - Add policy for authenticated users to manage schedules (staff/admin)

  ## Important Notes
  - Multiple schedule entries per barber per day are allowed (e.g., two different blocked periods on Tuesday)
  - day_of_week follows JavaScript Date convention (0=Sunday)
  - When is_full_day_off is true, block_start_time and block_end_time should be null
  - This is separate from time_blocks which are for one-time date-specific blocks
*/

-- Create barber_weekly_schedule table
CREATE TABLE IF NOT EXISTS barber_weekly_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_full_day_off boolean DEFAULT false NOT NULL,
  block_start_time time,
  block_end_time time,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_barber_id 
  ON barber_weekly_schedule(barber_id);

CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_day_of_week 
  ON barber_weekly_schedule(day_of_week);

CREATE INDEX IF NOT EXISTS idx_barber_weekly_schedule_barber_day 
  ON barber_weekly_schedule(barber_id, day_of_week);

-- Enable RLS
ALTER TABLE barber_weekly_schedule ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for booking system to check availability)
CREATE POLICY "Public can view weekly schedules"
  ON barber_weekly_schedule FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert weekly schedules
CREATE POLICY "Authenticated users can create weekly schedules"
  ON barber_weekly_schedule FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update weekly schedules
CREATE POLICY "Authenticated users can update weekly schedules"
  ON barber_weekly_schedule FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete weekly schedules
CREATE POLICY "Authenticated users can delete weekly schedules"
  ON barber_weekly_schedule FOR DELETE
  TO authenticated
  USING (true);
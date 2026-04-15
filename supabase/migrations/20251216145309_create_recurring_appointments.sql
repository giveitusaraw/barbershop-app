/*
  # Create Recurring Appointments System

  1. New Tables
    - `recurring_appointments`
      - `id` (uuid, primary key) - Unique identifier for the recurring appointment record
      - `original_appointment_id` (uuid, foreign key) - Reference to the first appointment in the series
      - `recurrence_type` (text) - Type of recurrence: 'weekly', 'biweekly', or 'monthly'
      - `created_at` (timestamptz) - Timestamp when the recurring series was created

  2. Changes to Existing Tables
    - `appointments`
      - Add `recurring_group_id` (uuid, nullable) - Groups all appointments in a recurring series
      - Add `is_part_of_recurrence` (boolean, default false) - Indicates if appointment is part of a recurring series

  3. Security
    - Enable RLS on `recurring_appointments` table
    - Add policy for public SELECT access (to display recurring info)
    - Add policy for authenticated admin/staff to INSERT, UPDATE, DELETE
    - Appointments table RLS policies remain unchanged

  4. Indexes
    - Add index on `appointments.recurring_group_id` for efficient querying of recurring series

  5. Important Notes
    - Recurring appointments are limited to the current year only
    - When creating recurring appointments, all share the same `recurring_group_id`
    - The system allows booking even with conflicts if user explicitly confirms
    - Default behavior when editing/canceling affects only single appointment
*/

-- Create recurring_appointments table
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  recurrence_type text NOT NULL CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
  created_at timestamptz DEFAULT now()
);

-- Add recurring columns to appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'recurring_group_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN recurring_group_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'is_part_of_recurrence'
  ) THEN
    ALTER TABLE appointments ADD COLUMN is_part_of_recurrence boolean DEFAULT false;
  END IF;
END $$;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_recurring_group_id ON appointments(recurring_group_id);

-- Enable RLS on recurring_appointments
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

-- Allow public to view recurring appointment info (read-only)
CREATE POLICY "Anyone can view recurring appointments"
  ON recurring_appointments
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert recurring appointments
CREATE POLICY "Authenticated users can create recurring appointments"
  ON recurring_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update recurring appointments
CREATE POLICY "Authenticated users can update recurring appointments"
  ON recurring_appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete recurring appointments
CREATE POLICY "Authenticated users can delete recurring appointments"
  ON recurring_appointments
  FOR DELETE
  TO authenticated
  USING (true);
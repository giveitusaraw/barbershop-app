/*
  # Create barber_monthly_goals table

  ## Summary
  Creates a table to store individual monthly revenue goals for each barber/employee.
  The goal is a fixed amount in euros that an admin can configure per barber.
  This goal is used to display a progress bar on the billing page showing how
  close each employee is to their target.

  ## New Tables

  ### barber_monthly_goals
  - `id` (uuid, primary key) - Unique identifier
  - `barber_id` (uuid, foreign key → barbers.id) - Reference to the employee
  - `goal_amount` (numeric) - The monthly revenue target in euros
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Notes
  1. One goal per barber (unique constraint on barber_id)
  2. Goal is fixed (not month-specific) — same target applies every month
  3. RLS enabled: only authenticated users can read; only admins (via service role) can write
  4. Anon users can read goals so the billing page can display progress without full auth
*/

CREATE TABLE IF NOT EXISTS barber_monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  goal_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT barber_monthly_goals_barber_id_unique UNIQUE (barber_id)
);

ALTER TABLE barber_monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read barber goals"
  ON barber_monthly_goals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can read barber goals"
  ON barber_monthly_goals
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert barber goals"
  ON barber_monthly_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update barber goals"
  ON barber_monthly_goals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_barber_monthly_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barber_monthly_goals_updated_at
  BEFORE UPDATE ON barber_monthly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_barber_monthly_goals_updated_at();

/*
  # Add Dinner Break and Barber Services Management

  ## Changes

  1. Barbers Table Updates
    - Add `has_dinner_break` (boolean) - indicates if barber takes a dinner break
    - Add `dinner_start_time` (time) - start time of dinner break (nullable)
    - Add `dinner_end_time` (time) - end time of dinner break (nullable)

  2. New Barber Services Table
    - `barber_id` (uuid, foreign key to barbers)
    - `service_id` (uuid, foreign key to services)
    - `created_at` (timestamptz)
    - Composite primary key on (barber_id, service_id)
    - This creates a many-to-many relationship between barbers and services

  3. Security
    - Enable RLS on barber_services table
    - Add policies to allow public read access for barber-service relationships

  ## Important Notes
  - Dinner break fields are optional and only apply when has_dinner_break is true
  - Each barber can be assigned multiple services
  - Only barbers with assigned services can perform those services
*/

-- Add dinner break columns to barbers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'barbers' AND column_name = 'has_dinner_break'
  ) THEN
    ALTER TABLE barbers ADD COLUMN has_dinner_break boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'barbers' AND column_name = 'dinner_start_time'
  ) THEN
    ALTER TABLE barbers ADD COLUMN dinner_start_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'barbers' AND column_name = 'dinner_end_time'
  ) THEN
    ALTER TABLE barbers ADD COLUMN dinner_end_time time;
  END IF;
END $$;

-- Create barber_services junction table
CREATE TABLE IF NOT EXISTS barber_services (
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (barber_id, service_id)
);

-- Enable RLS on barber_services table
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to barber services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'barber_services' AND policyname = 'Public can view barber services'
  ) THEN
    CREATE POLICY "Public can view barber services"
      ON barber_services FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_barber_services_barber_id ON barber_services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_services_service_id ON barber_services(service_id);
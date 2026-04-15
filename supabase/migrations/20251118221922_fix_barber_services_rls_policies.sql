/*
  # Fix Row Level Security Policies for Barber Services

  ## Problem
  The barber_services junction table has RLS enabled but only has a SELECT policy.
  This causes INSERT and DELETE operations to fail when managing barber services.

  ## Changes
  1. Add INSERT policy to allow public insertion into barber_services
  2. Add DELETE policy to allow public deletion from barber_services
  3. Add UPDATE policy for completeness (though not currently used)

  ## Security
  - These policies allow public access, matching the existing pattern in the application
  - For production use, these should be restricted to authenticated admin users
*/

-- Allow public to insert barber services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'barber_services' AND policyname = 'Anyone can insert barber services'
  ) THEN
    CREATE POLICY "Anyone can insert barber services"
      ON barber_services FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public to delete barber services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'barber_services' AND policyname = 'Anyone can delete barber services'
  ) THEN
    CREATE POLICY "Anyone can delete barber services"
      ON barber_services FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;

-- Allow public to update barber services (for completeness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'barber_services' AND policyname = 'Anyone can update barber services'
  ) THEN
    CREATE POLICY "Anyone can update barber services"
      ON barber_services FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

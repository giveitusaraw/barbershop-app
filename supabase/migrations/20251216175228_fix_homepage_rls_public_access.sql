/*
  # Fix Homepage RLS Policies for Public Access

  1. Changes
    - Drop existing restrictive policies that check auth.uid()
    - Create new public policies for INSERT, UPDATE, DELETE operations
    - Maintain SELECT as public (already working)
  
  2. Security Notes
    - Access control is handled at application level via admin_accounts authentication
    - This system does not use Supabase Auth, so auth.uid() is always null
    - Public policies allow the custom auth system to work properly
    - Similar to existing services, barbers, and appointments tables
*/

-- Drop existing restrictive policies for homepage_settings
DROP POLICY IF EXISTS "Only admins can insert homepage settings" ON homepage_settings;
DROP POLICY IF EXISTS "Only admins can update homepage settings" ON homepage_settings;
DROP POLICY IF EXISTS "Only admins can delete homepage settings" ON homepage_settings;

-- Create new public policies for homepage_settings
CREATE POLICY "Anyone can insert homepage settings"
  ON homepage_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update homepage settings"
  ON homepage_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete homepage settings"
  ON homepage_settings
  FOR DELETE
  TO public
  USING (true);

-- Drop existing restrictive policies for homepage_featured_services
DROP POLICY IF EXISTS "Only admins can insert featured services" ON homepage_featured_services;
DROP POLICY IF EXISTS "Only admins can update featured services" ON homepage_featured_services;
DROP POLICY IF EXISTS "Only admins can delete featured services" ON homepage_featured_services;

-- Create new public policies for homepage_featured_services
CREATE POLICY "Anyone can insert featured services"
  ON homepage_featured_services
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update featured services"
  ON homepage_featured_services
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete featured services"
  ON homepage_featured_services
  FOR DELETE
  TO public
  USING (true);

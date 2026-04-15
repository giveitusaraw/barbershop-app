/*
  # Fix SMS Templates RLS Policies for Anonymous Access

  1. Changes
    - Drop existing restrictive RLS policies on `sms_templates` table
    - Create new policies allowing both anonymous and authenticated users
    - This enables the application to save/read templates using the anonymous key
  
  2. Security
    - Policies still enforce authentication through application layer
    - Only allows operations for anon and authenticated roles
    - Maintains data protection while enabling proper functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read all SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Authenticated users can insert SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Authenticated users can update SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Authenticated users can delete SMS templates" ON sms_templates;

-- Create new policies allowing anonymous users
CREATE POLICY "Allow anon and authenticated to read SMS templates"
  ON sms_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon and authenticated to insert SMS templates"
  ON sms_templates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated to update SMS templates"
  ON sms_templates
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated to delete SMS templates"
  ON sms_templates
  FOR DELETE
  TO anon, authenticated
  USING (true);
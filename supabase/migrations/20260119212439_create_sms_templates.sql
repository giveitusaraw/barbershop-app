/*
  # Create SMS Templates Table

  1. New Tables
    - `sms_templates`
      - `id` (uuid, primary key) - Unique identifier for each template
      - `name` (text, unique, not null) - Display name for the template
      - `message_text` (text, not null) - The template message content with variables
      - `created_at` (timestamptz) - When the template was created
      - `updated_at` (timestamptz) - When the template was last modified

  2. Security
    - Enable RLS on `sms_templates` table
    - Add policy for authenticated users to read all templates
    - Add policy for authenticated users to insert new templates
    - Add policy for authenticated users to update templates
    - Add policy for authenticated users to delete templates

  3. Indexes
    - Create unique index on `name` field for fast lookups and constraint enforcement
*/

-- Create the sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all templates
CREATE POLICY "Authenticated users can read all SMS templates"
  ON sms_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert new templates
CREATE POLICY "Authenticated users can insert SMS templates"
  ON sms_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update templates
CREATE POLICY "Authenticated users can update SMS templates"
  ON sms_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to delete templates
CREATE POLICY "Authenticated users can delete SMS templates"
  ON sms_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(name);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS update_sms_templates_updated_at_trigger ON sms_templates;
CREATE TRIGGER update_sms_templates_updated_at_trigger
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_templates_updated_at();
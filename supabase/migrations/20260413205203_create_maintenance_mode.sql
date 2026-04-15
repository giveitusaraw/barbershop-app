/*
  # Create Maintenance Mode Setting

  1. Changes
    - Adds a `site_settings` table with a single row to store global site configuration
    - Initial column: `maintenance_mode` (boolean, default false)

  2. Security
    - Enable RLS
    - Authenticated users (admins) can read and update
    - Anonymous users can only read (to check if maintenance is active)
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_settings (id, maintenance_mode)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

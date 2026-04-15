/*
  # Add is_default column to sms_templates

  1. Changes
    - Adds `is_default` boolean column to `sms_templates` table (defaults to false)
    - Only one template can be default at a time (enforced in application logic)

  2. Notes
    - Existing rows get is_default = false automatically via the DEFAULT clause
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sms_templates' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE sms_templates ADD COLUMN is_default boolean NOT NULL DEFAULT false;
  END IF;
END $$;

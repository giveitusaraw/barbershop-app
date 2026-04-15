/*
  # Add Feature Icons to Homepage Settings

  1. Changes
    - Add `feature_1_icon` column to store the icon name for feature 1
    - Add `feature_2_icon` column to store the icon name for feature 2
    - Add `feature_3_icon` column to store the icon name for feature 3
    - Default values: 'Users', 'Scissors', 'Star' (current icons)

  2. Notes
    - Icons are stored as text matching lucide-react icon names
    - Allows customization of feature icons from the admin panel
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'feature_1_icon'
  ) THEN
    ALTER TABLE homepage_settings 
    ADD COLUMN feature_1_icon text DEFAULT 'Users';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'feature_2_icon'
  ) THEN
    ALTER TABLE homepage_settings 
    ADD COLUMN feature_2_icon text DEFAULT 'Scissors';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'feature_3_icon'
  ) THEN
    ALTER TABLE homepage_settings 
    ADD COLUMN feature_3_icon text DEFAULT 'Star';
  END IF;
END $$;

/*
  # Add Missing Homepage Fields (v2)

  1. Changes
    - Add hero_button_text field for customizable CTA button
    - Add contact_section_description field
    - Set default value for accent_color if null
  
  2. Notes
    - Fields added with IF NOT EXISTS pattern
    - Default values match current homepage design
    - No INSERT needed as row already exists
*/

-- Add hero_button_text if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_button_text'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_button_text text NOT NULL DEFAULT 'Reservar Agora';
  END IF;
END $$;

-- Add contact_section_description if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'contact_section_description'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN contact_section_description text NOT NULL DEFAULT 'Localização conveniente e horários flexíveis';
  END IF;
END $$;

-- Set default for accent_color if it was null
UPDATE homepage_settings 
SET accent_color = '#F59E0B' 
WHERE accent_color IS NULL OR accent_color = '';

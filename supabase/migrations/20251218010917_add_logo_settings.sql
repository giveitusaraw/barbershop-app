/*
  # Add Logo Settings to Homepage

  1. Changes to Tables
    - Add to `homepage_settings` table:
      - `logo_text` (text) - The text displayed next to the logo (default: 'Barber')
      - `logo_image_url` (text, nullable) - URL for custom logo image
      - `use_custom_logo` (boolean) - Toggle between default icon and custom image (default: false)
  
  2. Storage
    - Create `logos` bucket for storing custom logo images
    - Public bucket for easy access to logo images
*/

-- Add logo fields to homepage_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'logo_text'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN logo_text text DEFAULT 'Barber';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'logo_image_url'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN logo_image_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'use_custom_logo'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN use_custom_logo boolean DEFAULT false;
  END IF;
END $$;

-- Create storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;
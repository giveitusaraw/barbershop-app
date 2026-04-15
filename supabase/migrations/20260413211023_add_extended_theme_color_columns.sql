/*
  # Add Extended Theme Color Columns to homepage_settings

  ## Summary
  Adds six new color customization columns to the homepage_settings table,
  allowing administrators to personalize additional visual elements of the site.

  ## New Columns
  - `page_bg_color` - General page background color (default: #F9FAFB)
  - `services_section_bg_color` - Background color of the services section (default: #F3F4F6)
  - `contact_section_bg_color` - Background color of the contact section (default: #111827)
  - `card_bg_color` - Background color of feature/service cards (default: #FFFFFF)
  - `text_heading_color` - Color of section headings and titles (default: #111827)
  - `text_body_color` - Color of body/description text (default: #4B5563)

  ## Notes
  - All columns are optional (nullable) with sensible defaults
  - No existing data is modified or removed
  - Safe to apply on existing databases
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'page_bg_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN page_bg_color text DEFAULT '#F9FAFB';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'services_section_bg_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN services_section_bg_color text DEFAULT '#F3F4F6';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'contact_section_bg_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN contact_section_bg_color text DEFAULT '#111827';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'card_bg_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN card_bg_color text DEFAULT '#FFFFFF';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'text_heading_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN text_heading_color text DEFAULT '#111827';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'text_body_color'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN text_body_color text DEFAULT '#4B5563';
  END IF;
END $$;

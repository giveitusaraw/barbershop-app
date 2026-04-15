/*
  # Add Hero Background Customization

  1. New Columns
    - `hero_gradient_from` (text, nullable) - Starting color for gradient
    - `hero_gradient_via` (text, nullable) - Middle color for gradient (optional)
    - `hero_gradient_to` (text, nullable) - End color for gradient
    - `hero_gradient_direction` (text, nullable) - Direction of gradient (to-br, to-r, to-l, etc.)
    - `hero_background_image_url` (text, nullable) - URL of uploaded background image
    - `use_background_image` (boolean) - Toggle between gradient and image background

  2. Storage
    - Create storage bucket `hero-backgrounds` for background images up to 100MB
    - Enable public access for reading
    - Allow authenticated users to upload

  3. Security
    - RLS policies for authenticated uploads and public reads
*/

-- Add new columns to homepage_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_gradient_from'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_gradient_from text DEFAULT '#111827';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_gradient_via'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_gradient_via text DEFAULT '#1f2937';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_gradient_to'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_gradient_to text DEFAULT '#92400e';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_gradient_direction'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_gradient_direction text DEFAULT 'to-br';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'hero_background_image_url'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN hero_background_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homepage_settings' AND column_name = 'use_background_image'
  ) THEN
    ALTER TABLE homepage_settings ADD COLUMN use_background_image boolean DEFAULT false;
  END IF;
END $$;

-- Create storage bucket for hero background images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-backgrounds',
  'hero-backgrounds',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to hero backgrounds'
  ) THEN
    CREATE POLICY "Allow public read access to hero backgrounds"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'hero-backgrounds');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads to hero backgrounds'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to hero backgrounds"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'hero-backgrounds');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated deletes from hero backgrounds'
  ) THEN
    CREATE POLICY "Allow authenticated deletes from hero backgrounds"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'hero-backgrounds');
  END IF;
END $$;
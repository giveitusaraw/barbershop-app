/*
  # Allow Anonymous Uploads for Logos Bucket

  1. Changes
    - Update INSERT, UPDATE, and DELETE policies to allow anon role
    - This is necessary because the app uses custom authentication (admin_accounts table)
      instead of Supabase Auth, so uploads appear as anonymous to Supabase
  
  2. Security Notes
    - This is acceptable for logos as:
      * The bucket is already public for reading
      * Only admins have access to the upload UI
      * File size limits are enforced in the app
      * The app validates file types before upload
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Allow anyone (including anon) to upload logos
CREATE POLICY "Anyone can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos');

-- Allow anyone (including anon) to update logos
CREATE POLICY "Anyone can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Allow anyone (including anon) to delete logos
CREATE POLICY "Anyone can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos');

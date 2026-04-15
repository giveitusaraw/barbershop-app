/*
  # Fix Storage Policies for Logos Bucket

  1. Storage Policies
    - Add SELECT policy for public access (anyone can view logos)
    - Add INSERT policy for authenticated users (admins can upload logos)
    - Add UPDATE policy for authenticated users (admins can update logos)
    - Add DELETE policy for authenticated users (admins can delete logos)
  
  2. Security
    - Public can read all logos (needed for displaying on homepage)
    - Only authenticated users can upload, update, or delete logos
    - This allows the admin panel to manage logo uploads
*/

-- Drop existing policies if they exist (in case they were partially created)
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Allow anyone to view logos (public read access)
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

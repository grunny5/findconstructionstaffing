-- Migration: Create agency-logos storage bucket
-- Purpose: Stores agency logo images with public read, admin-only write access

-- Create the storage bucket for agency logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-logos',
  'agency-logos',
  true,  -- Public bucket for logo display
  5242880,  -- 5MB file size limit (5 * 1024 * 1024)
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin write access for agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin update access for agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for agency logos" ON storage.objects;

-- Policy: Public read access for all users (to display logos on agency cards/profiles)
CREATE POLICY "Public read access for agency logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agency-logos');

-- Policy: Admin-only INSERT access
CREATE POLICY "Admin write access for agency logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agency-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin-only UPDATE access
CREATE POLICY "Admin update access for agency logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agency-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'agency-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admin-only DELETE access
CREATE POLICY "Admin delete access for agency logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agency-logos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

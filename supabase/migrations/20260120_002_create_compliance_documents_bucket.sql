-- Migration: Create compliance-documents storage bucket
-- Purpose: Stores compliance verification documents (PDFs, images) with private access
-- Feature: 013 - Industry Compliance & Verification

-- Create the storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-documents',
  'compliance-documents',
  false,  -- Private bucket - authenticated access only
  10485760,  -- 10MB file size limit (10 * 1024 * 1024)
  ARRAY['application/pdf', 'image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Agency owner read own compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin read all compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Agency owner upload own compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload any compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Agency owner update own compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin update any compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Agency owner delete own compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete any compliance documents" ON storage.objects;

-- Policy: Agency owner can read their own documents
-- File path structure: {agency_id}/{compliance_type}/{filename}
CREATE POLICY "Agency owner read own compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND (storage.foldername(storage.objects.name))[1] = agencies.id::text
  )
);

-- Policy: Admin can read all compliance documents
CREATE POLICY "Admin read all compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Agency owner can upload to their own folder
CREATE POLICY "Agency owner upload own compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND (storage.foldername(storage.objects.name))[1] = agencies.id::text
  )
);

-- Policy: Admin can upload to any agency folder
CREATE POLICY "Admin upload any compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Agency owner can update their own documents
CREATE POLICY "Agency owner update own compliance documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND (storage.foldername(storage.objects.name))[1] = agencies.id::text
  )
)
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND (storage.foldername(storage.objects.name))[1] = agencies.id::text
  )
);

-- Policy: Admin can update any compliance documents
CREATE POLICY "Admin update any compliance documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Agency owner can delete their own documents
CREATE POLICY "Agency owner delete own compliance documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.claimed_by = auth.uid()
    AND (storage.foldername(storage.objects.name))[1] = agencies.id::text
  )
);

-- Policy: Admin can delete any compliance documents
CREATE POLICY "Admin delete any compliance documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

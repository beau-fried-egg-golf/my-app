-- Create the photos storage bucket (public so image URLs work directly)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to photos bucket
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to update their photos
CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- Allow public read access to photos
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

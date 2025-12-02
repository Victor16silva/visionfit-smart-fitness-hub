-- Create storage bucket for exercise media (GIFs and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-media', 
  'exercise-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- RLS policies for exercise-media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload exercise media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-media');

-- Allow public to view exercise media
CREATE POLICY "Public can view exercise media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'exercise-media');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own exercise media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'exercise-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own exercise media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'exercise-media' AND auth.uid()::text = (storage.foldername(name))[1]);
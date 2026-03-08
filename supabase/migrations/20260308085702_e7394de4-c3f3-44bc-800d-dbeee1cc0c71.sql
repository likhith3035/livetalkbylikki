
-- Create a public storage bucket for ephemeral chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Allow anyone to upload to chat-images bucket
CREATE POLICY "Anyone can upload chat images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow anyone to read chat images
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat-images');

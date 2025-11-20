-- Create storage buckets (run these in Supabase Dashboard > Storage)

-- Note: Buckets need to be created manually in Supabase Dashboard
-- This file documents the required buckets and policies

-- Storage Buckets to Create:
-- 1. 'items' - for menu item images
-- 2. 'avatars' - for user profile pictures  
-- 3. 'canteens' - for canteen logos and banners
-- 4. 'reviews' - for user-submitted feedback photos

-- Storage Policies for 'items' bucket
CREATE POLICY "Public read access for items"
ON storage.objects FOR SELECT
USING (bucket_id = 'items');

CREATE POLICY "Authenticated users can upload items"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their items"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their items"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'avatars' bucket
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'canteens' bucket
CREATE POLICY "Public read access for canteens"
ON storage.objects FOR SELECT
USING (bucket_id = 'canteens');

CREATE POLICY "Canteen owners can upload canteen images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Canteen owners can update their canteen images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Canteen owners can delete their canteen images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'reviews' bucket
CREATE POLICY "Public read access for reviews"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviews');

CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their review photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);


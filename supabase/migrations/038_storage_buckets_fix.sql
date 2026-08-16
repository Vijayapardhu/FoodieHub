-- 038_storage_buckets_fix.sql
--
-- Creates the four storage buckets that were never actually created.
--
-- 004 wrote the storage *policies* and 022 was supposed to create the
-- buckets, but 022 had not been applied to this project — so every policy
-- pointed at a bucket that did not exist. The symptom was "Bucket not found"
-- on any image upload: review photos, dish photos, canteen banners and
-- avatars were all broken, and had been since the beginning.
--
-- HEIC and HEIF are allowed because that is what an iPhone hands over. The
-- client re-encodes to JPEG before upload (see lib/utils/image.ts), so these
-- are a fallback for the case where the browser cannot decode it — better a
-- stored photo that some browsers cannot render than a rejected upload.
--
-- Safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('items',    'items',    true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']),
  ('canteens', 'canteens', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']),
  ('avatars',  'avatars',  true, 2097152,
   array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']),
  ('reviews',  'reviews',  true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The read/write policies for these buckets are in 004_storage_setup.sql and
-- are already applied here.

-- 022_storage_buckets.sql
--
-- Creates the four storage buckets that 004 only documented. 004 said "create
-- these by hand in the Dashboard", which nobody did — so every image upload in
-- the owner console, the admin console and the review form fails at runtime
-- against a project that has never had the buckets made.
--
-- They can be created in SQL after all; the Dashboard is not required. Run
-- this in the Supabase SQL editor (it runs as `postgres`, which owns
-- storage.buckets — PostgREST and the anon/authenticated roles cannot).
--
-- Safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- 5 MB matches the serverActions bodySizeLimit in next.config.js; a larger
  -- cap here would just move the failure later in the upload.
  ('items',    'items',    true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('canteens', 'canteens', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('avatars',  'avatars',  true, 2097152, array['image/jpeg','image/png','image/webp','image/avif']),
  ('reviews',  'reviews',  true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The read/write policies for these buckets are in 004_storage_setup.sql.
-- Apply that file too if it has not been run against this project: without
-- its policies the buckets exist but every insert is refused by RLS.

-- 051_category_images.sql
--
-- A category has never had a picture of its own — the home page rail faked
-- one by borrowing the photo of whichever dish in that category happened to
-- be top-rated, and fell back to a generic fork-and-knife icon for a
-- category with nothing in it yet. That's the "missing" image: there was
-- never a column to put a real one in.
--
-- Safe to re-run.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ---------------------------------------------------------------------------
-- Storage — same shape as items/canteens/avatars/reviews (038), a square
-- crop enforced client-side (ImageUpload aspectRatio="square") since
-- Supabase Storage itself has no notion of image dimensions.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('categories', 'categories', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for categories" on storage.objects;
create policy "Public read access for categories"
on storage.objects for select
using (bucket_id = 'categories');

-- Categories are an admin-managed, shared resource — the RLS on
-- public.categories already restricts who can write image_url onto a row
-- (see 002_rls_policies.sql, "Admins can manage categories"). The storage
-- write policy stays as permissive as every other bucket's; that table-level
-- check is the real gate, same as it is for canteens/items today.
drop policy if exists "Authenticated users can upload category images" on storage.objects;
create policy "Authenticated users can upload category images"
on storage.objects for insert
with check (
  bucket_id = 'categories' and
  auth.role() = 'authenticated'
);

drop policy if exists "Authenticated users can update category images" on storage.objects;
create policy "Authenticated users can update category images"
on storage.objects for update
using (
  bucket_id = 'categories' and
  auth.role() = 'authenticated'
);

drop policy if exists "Authenticated users can delete category images" on storage.objects;
create policy "Authenticated users can delete category images"
on storage.objects for delete
using (
  bucket_id = 'categories' and
  auth.role() = 'authenticated'
);

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[];


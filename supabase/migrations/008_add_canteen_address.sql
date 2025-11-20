ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_reference TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;


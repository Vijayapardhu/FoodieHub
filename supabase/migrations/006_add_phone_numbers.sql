ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS contact_phone TEXT;



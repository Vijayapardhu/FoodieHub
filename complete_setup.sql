DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;


-- 001_initial_schema.sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('student', 'canteen_owner', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed');
CREATE TYPE notification_type AS ENUM ('order', 'promotion', 'system', 'feedback');
CREATE TYPE discount_type AS ENUM ('percentage', 'flat');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canteens table
CREATE TABLE IF NOT EXISTS public.canteens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_open BOOLEAN NOT NULL DEFAULT false,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_vegetarian BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  nutritional_info JSONB,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'on_shop',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  cash_received DECIMAL(10,2) CHECK (cash_received >= 0),
  change_amount DECIMAL(10,2) CHECK (change_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  owner_response TEXT,
  owner_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount DECIMAL(10,2) CHECK (min_order_amount >= 0),
  max_discount DECIMAL(10,2) CHECK (max_discount >= 0),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (valid_until > valid_from)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id),
  UNIQUE(user_id, canteen_id),
  CHECK (
    (item_id IS NOT NULL AND canteen_id IS NULL) OR
    (item_id IS NULL AND canteen_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_canteens_owner_id ON public.canteens(owner_id);
CREATE INDEX IF NOT EXISTS idx_canteens_is_open ON public.canteens(is_open);
CREATE INDEX IF NOT EXISTS idx_items_canteen_id ON public.items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_is_available ON public.items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON public.orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_token ON public.orders(token);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON public.order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_canteen_id ON public.reviews(canteen_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_offers_canteen_id ON public.offers(canteen_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_is_approved ON public.offers(is_approved);
CREATE INDEX IF NOT EXISTS idx_offers_valid_dates ON public.offers(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON public.favorites(item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_canteen_id ON public.favorites(canteen_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canteens_updated_at BEFORE UPDATE ON public.canteens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update canteen rating
CREATE OR REPLACE FUNCTION update_canteen_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.canteens
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE canteen_id = NEW.canteen_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE canteen_id = NEW.canteen_id
    )
  WHERE id = NEW.canteen_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update canteen rating on review insert/update/delete
CREATE TRIGGER update_canteen_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_canteen_rating();

-- Function to update item rating
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_id IS NOT NULL THEN
    UPDATE public.items
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE item_id = NEW.item_id
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE item_id = NEW.item_id
      )
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update item rating on review insert/update/delete
CREATE TRIGGER update_item_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_item_rating();


-- 002_rls_policies.sql
-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Canteens policies
CREATE POLICY "Anyone can view active canteens"
  ON public.canteens FOR SELECT
  USING (true);

CREATE POLICY "Canteen owners can update their own canteen"
  ON public.canteens FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Canteen owners can insert their own canteen"
  ON public.canteens FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Items policies
CREATE POLICY "Anyone can view available items"
  ON public.items FOR SELECT
  USING (true);

CREATE POLICY "Canteen owners can manage items in their canteen"
  ON public.items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE id = items.canteen_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all items"
  ON public.items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Canteen owners can view orders for their canteen"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE id = orders.canteen_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Canteen owners can update orders for their canteen"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE id = orders.canteen_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Users can view items in their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Canteen owners can view order items for their canteen"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.canteens c ON c.id = o.canteen_id
      WHERE o.id = order_items.order_id AND c.owner_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = reviews.order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews within 24 hours"
  ON public.reviews FOR UPDATE
  USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Canteen owners can respond to reviews for their canteen"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE id = reviews.canteen_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Offers policies
CREATE POLICY "Anyone can view active approved offers"
  ON public.offers FOR SELECT
  USING (is_active = true AND is_approved = true);

CREATE POLICY "Canteen owners can manage offers for their canteen"
  ON public.offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens
      WHERE id = offers.canteen_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view and manage all offers"
  ON public.offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);


-- 003_create_user_profile_trigger.sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 004_storage_setup.sql
-- Create storage buckets (run these in Supabase Dashboard > Storage)

-- Note: Buckets need to be created manually in Supabase Dashboard
-- This file documents the required buckets and policies

-- Storage Buckets to Create:
-- 1. 'items' - for menu item images
-- 2. 'avatars' - for user profile pictures  
-- 3. 'canteens' - for canteen logos and banners
-- 4. 'reviews' - for user-submitted feedback photos

-- Storage Policies for 'items' bucket
DROP POLICY IF EXISTS "Public read access for items" ON storage.objects;
CREATE POLICY "Public read access for items"
ON storage.objects FOR SELECT
USING (bucket_id = 'items');

DROP POLICY IF EXISTS "Authenticated users can upload items" ON storage.objects;
CREATE POLICY "Authenticated users can upload items"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update their items" ON storage.objects;
CREATE POLICY "Authenticated users can update their items"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete their items" ON storage.objects;
CREATE POLICY "Authenticated users can delete their items"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'items' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'avatars' bucket
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'canteens' bucket
DROP POLICY IF EXISTS "Public read access for canteens" ON storage.objects;
CREATE POLICY "Public read access for canteens"
ON storage.objects FOR SELECT
USING (bucket_id = 'canteens');

DROP POLICY IF EXISTS "Canteen owners can upload canteen images" ON storage.objects;
CREATE POLICY "Canteen owners can upload canteen images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Canteen owners can update their canteen images" ON storage.objects;
CREATE POLICY "Canteen owners can update their canteen images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Canteen owners can delete their canteen images" ON storage.objects;
CREATE POLICY "Canteen owners can delete their canteen images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'canteens' AND
  auth.role() = 'authenticated'
);

-- Storage Policies for 'reviews' bucket
DROP POLICY IF EXISTS "Public read access for reviews" ON storage.objects;
CREATE POLICY "Public read access for reviews"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviews');

DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can update their review photos" ON storage.objects;
CREATE POLICY "Authenticated users can update their review photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can delete their review photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete their review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reviews' AND
  auth.role() = 'authenticated'
);


-- 005_fix_users_policy.sql
-- Helper function to safely determine admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Replace recursive policy with function-based check
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));


-- 006_add_phone_numbers.sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS contact_phone TEXT;



-- 007_update_notifications_policy.sql
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));


-- 008_add_canteen_address.sql
ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_reference TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;


-- 009_add_item_gallery.sql
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[];


-- 010_add_item_featured.sql
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT;


-- 011_add_order_customer_details.sql
-- Add customer snapshot info to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 012_add_booking_features.sql
-- Add scheduled pickup/delivery time to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS scheduled_pickup_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'immediate' CHECK (order_type IN ('immediate', 'scheduled', 'recurring')),
ADD COLUMN IF NOT EXISTS preferred_time_slot TEXT,
ADD COLUMN IF NOT EXISTS estimated_preparation_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS dietary_notes TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_order_code TEXT;

-- Create order templates table for saved orders
CREATE TABLE IF NOT EXISTS public.order_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- Array of {item_id, quantity}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, canteen_id, name)
);

-- Create loyalty points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE, -- NULL for platform-wide points
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (total_redeemed >= 0),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, canteen_id)
);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dietary preferences table
CREATE TABLE IF NOT EXISTS public.user_dietary_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}', -- vegetarian, vegan, gluten_free, etc.
  preferred_cuisines TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_pickup_time ON public.orders(scheduled_pickup_time);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_templates_user_canteen ON public.order_templates(user_id, canteen_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions(user_id);

-- Enable RLS
ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dietary_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_templates
DROP POLICY IF EXISTS "Users can view their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can create their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can update their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can delete their own order templates" ON public.order_templates;

CREATE POLICY "Users can view their own order templates"
  ON public.order_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own order templates"
  ON public.order_templates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL AND
    canteen_id IS NOT NULL
  );

CREATE POLICY "Users can update their own order templates"
  ON public.order_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order templates"
  ON public.order_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for loyalty_points
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can manage loyalty points" ON public.loyalty_points;

CREATE POLICY "Users can view their own loyalty points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert/update loyalty points (via triggers)
CREATE POLICY "System can manage loyalty points"
  ON public.loyalty_points FOR ALL
  USING (false) -- This should be managed only by triggers, not direct API calls
  WITH CHECK (false);

-- RLS Policies for loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "No updates or deletes on loyalty transactions" ON public.loyalty_transactions;

CREATE POLICY "Users can view their own loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert transactions (via triggers)
CREATE POLICY "System can insert loyalty transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (false); -- Transactions only via triggers

CREATE POLICY "No updates or deletes on loyalty transactions"
  ON public.loyalty_transactions FOR ALL
  USING (false)
  WITH CHECK (false);

-- RLS Policies for dietary preferences
DROP POLICY IF EXISTS "Users can manage their own dietary preferences" ON public.user_dietary_preferences;

CREATE POLICY "Users can manage their own dietary preferences"
  ON public.user_dietary_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Function to automatically create loyalty points entry when user makes first order
CREATE OR REPLACE FUNCTION create_loyalty_points_on_first_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.loyalty_points (user_id, canteen_id, points, total_earned)
  VALUES (NEW.user_id, NEW.canteen_id, 0, 0)
  ON CONFLICT (user_id, canteen_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create loyalty points entry
DROP TRIGGER IF EXISTS create_loyalty_points_on_order ON public.orders;
CREATE TRIGGER create_loyalty_points_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_loyalty_points_on_first_order();

-- Function to calculate and award loyalty points after order completion
CREATE OR REPLACE FUNCTION award_loyalty_points_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_tier TEXT;
BEGIN
  -- Only award points when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate points (1 point per ₹10 spent, rounded down)
    points_to_award := FLOOR(NEW.total_amount / 10)::INTEGER;
    
    IF points_to_award > 0 THEN
      -- Update loyalty points
      INSERT INTO public.loyalty_points (user_id, canteen_id, points, total_earned)
      VALUES (NEW.user_id, NEW.canteen_id, points_to_award, points_to_award)
      ON CONFLICT (user_id, canteen_id) DO UPDATE
      SET points = loyalty_points.points + points_to_award,
          total_earned = loyalty_points.total_earned + points_to_award,
          tier = CASE
            WHEN loyalty_points.total_earned + points_to_award >= 10000 THEN 'platinum'
            WHEN loyalty_points.total_earned + points_to_award >= 5000 THEN 'gold'
            WHEN loyalty_points.total_earned + points_to_award >= 2000 THEN 'silver'
            ELSE 'bronze'
          END;
      
      -- Record transaction
      INSERT INTO public.loyalty_transactions (user_id, canteen_id, order_id, points, transaction_type, description)
      VALUES (NEW.user_id, NEW.canteen_id, NEW.id, points_to_award, 'earned', 
              'Points earned from order #' || NEW.token);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award points on order completion
DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON public.orders;
CREATE TRIGGER award_loyalty_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points_on_order_completion();


-- 013_add_alias_columns.sql
-- Add alias columns to tables for public-facing IDs
-- Aliases are URL-safe strings generated from names

-- Add alias to canteens table
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS alias TEXT UNIQUE;

-- Add alias to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Add alias to order_templates table
ALTER TABLE public.order_templates
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Add alias to orders table (can use token, but adding alias for consistency)
-- Orders already have token, but we can add an alias for search purposes
-- ALTER TABLE public.orders
-- ADD COLUMN IF NOT EXISTS alias TEXT UNIQUE;

-- Create function to generate alias from name
CREATE OR REPLACE FUNCTION generate_alias_from_name(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, remove special chars, replace spaces with hyphens
  base_alias := lower(trim(name_text));
  base_alias := regexp_replace(base_alias, '[^a-z0-9\s-]', '', 'g');
  base_alias := regexp_replace(base_alias, '\s+', '-', 'g');
  base_alias := regexp_replace(base_alias, '-+', '-', 'g');
  base_alias := regexp_replace(base_alias, '^-|-$', '', 'g');
  base_alias := left(base_alias, 50); -- Limit length
  
  final_alias := base_alias;
  
  -- Check for uniqueness and append counter if needed
  -- This will be handled by application logic for better control
  
  RETURN final_alias;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique alias with random suffix
CREATE OR REPLACE FUNCTION generate_unique_alias(name_text TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
  random_suffix TEXT;
  exists_check BOOLEAN;
BEGIN
  base_alias := generate_alias_from_name(name_text);
  random_suffix := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);
  final_alias := base_alias || '-' || random_suffix;
  
  RETURN final_alias;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for alias columns
CREATE INDEX IF NOT EXISTS idx_canteens_alias ON public.canteens(alias) WHERE alias IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_alias ON public.items(alias) WHERE alias IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_templates_alias ON public.order_templates(alias) WHERE alias IS NOT NULL;

-- Create trigger to auto-generate alias for canteens
CREATE OR REPLACE FUNCTION set_canteen_alias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Try base alias first
    NEW.alias := generate_alias_from_name(NEW.name);
    
    -- Check if it exists and add suffix if needed
    WHILE EXISTS (
      SELECT 1 FROM public.canteens 
      WHERE alias = NEW.alias AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.alias := NEW.alias || '-' || substring(md5(random()::text) from 1 for 6);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS canteen_alias_trigger ON public.canteens;

-- Create trigger for INSERT
CREATE TRIGGER canteen_alias_trigger_insert
  BEFORE INSERT ON public.canteens
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_canteen_alias();

-- Create trigger for UPDATE
CREATE TRIGGER canteen_alias_trigger_update
  BEFORE UPDATE OF name ON public.canteens
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '' OR (OLD.name IS DISTINCT FROM NEW.name AND NEW.alias = OLD.alias))
  EXECUTE FUNCTION set_canteen_alias();

-- Create trigger to auto-generate alias for items
CREATE OR REPLACE FUNCTION set_item_alias()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Get canteen name for composite alias
    SELECT alias INTO canteen_name FROM public.canteens WHERE id = NEW.canteen_id;
    
    IF canteen_name IS NOT NULL THEN
      NEW.alias := generate_alias_from_name(canteen_name || '-' || NEW.name);
    ELSE
      NEW.alias := generate_alias_from_name(NEW.name);
    END IF;
    
    -- Check uniqueness within canteen
    WHILE EXISTS (
      SELECT 1 FROM public.items 
      WHERE canteen_id = NEW.canteen_id 
      AND alias = NEW.alias 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.alias := NEW.alias || '-' || substring(md5(random()::text) from 1 for 6);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS item_alias_trigger ON public.items;

-- Create trigger for INSERT
CREATE TRIGGER item_alias_trigger_insert
  BEFORE INSERT ON public.items
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_item_alias();

-- Create trigger for UPDATE
CREATE TRIGGER item_alias_trigger_update
  BEFORE UPDATE OF name, canteen_id ON public.items
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '' OR (OLD.name IS DISTINCT FROM NEW.name AND NEW.alias = OLD.alias) OR OLD.canteen_id IS DISTINCT FROM NEW.canteen_id)
  EXECUTE FUNCTION set_item_alias();

-- Create trigger to auto-generate alias for order_templates
CREATE OR REPLACE FUNCTION set_order_template_alias()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Get canteen alias
    SELECT alias INTO canteen_name FROM public.canteens WHERE id = NEW.canteen_id;
    
    IF canteen_name IS NOT NULL THEN
      NEW.alias := generate_alias_from_name(canteen_name || '-' || NEW.name);
    ELSE
      NEW.alias := generate_alias_from_name(NEW.name);
    END IF;
    
    -- Add timestamp suffix for uniqueness
    NEW.alias := NEW.alias || '-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS order_template_alias_trigger ON public.order_templates;

CREATE TRIGGER order_template_alias_trigger
  BEFORE INSERT ON public.order_templates
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_order_template_alias();

-- Update existing records to have aliases
UPDATE public.canteens 
SET alias = generate_alias_from_name(name) || '-' || substring(replace(id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';

UPDATE public.items i
SET alias = generate_alias_from_name(
  COALESCE((SELECT alias FROM public.canteens WHERE id = i.canteen_id), 'item') || '-' || i.name
) || '-' || substring(replace(i.id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';

UPDATE public.order_templates ot
SET alias = generate_alias_from_name(
  COALESCE((SELECT alias FROM public.canteens WHERE id = ot.canteen_id), 'template') || '-' || ot.name
) || '-' || substring(replace(ot.id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';


-- 014_update_user_profile_trigger_for_roles.sql
-- Update trigger to handle roles from metadata and prevent admin self-registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
  user_full_name TEXT;
BEGIN
  -- Get role from metadata, default to 'user'
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'
  );

  -- Prevent non-admin users from registering as admin
  -- Only allow admin role if explicitly set by an existing admin
  IF user_role_val = 'admin' THEN
    -- Check if there's an existing admin who approved this
    -- For now, default to user and require admin approval
    user_role_val := 'student';
  END IF;

  -- Get full name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  -- Insert user profile
  INSERT INTO public.users (id, email, full_name, avatar_url, role, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    NEW.raw_user_meta_data->>'avatar_url',
    user_role_val,
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    role = COALESCE(users.role, EXCLUDED.role), -- Don't override existing role
    phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 015_add_canteen_approval_system.sql
-- Add approval system for canteens
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_canteens_is_approved ON public.canteens(is_approved);

-- Update existing canteens to be approved (optional - for existing data)
-- UPDATE public.canteens SET is_approved = true WHERE is_approved IS NULL;

-- Add RLS policy: Only show approved canteens to non-admin users
DROP POLICY IF EXISTS "Anyone can view active canteens" ON public.canteens;
CREATE POLICY "Anyone can view approved canteens"
  ON public.canteens FOR SELECT
  USING (is_approved = true OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) OR auth.uid() = owner_id);

-- Add policy for admins to approve/reject canteens
DROP POLICY IF EXISTS "Admins can manage all canteens" ON public.canteens;
CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for owners to view their own canteen regardless of approval status
CREATE POLICY "Owners can view their own canteen"
  ON public.canteens FOR SELECT
  USING (auth.uid() = owner_id);



-- 016_rename_student_role_to_user.sql
-- Rename student role to user
-- This migration properly handles enum value changes in PostgreSQL
-- We need to drop and recreate policies that depend on the role column

-- Step 1: Drop all policies that reference the role column
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage all canteens" ON public.canteens;
DROP POLICY IF EXISTS "Anyone can view approved canteens" ON public.canteens;
DROP POLICY IF EXISTS "Admins can manage all items" ON public.items;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view and manage all offers" ON public.offers;

-- Also drop policies from other migrations that might use role
DROP POLICY IF EXISTS "Owners can view their own canteen" ON public.canteens;
DROP POLICY IF EXISTS "System can manage loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_transactions;

-- Step 2: Create a new enum type with 'user' instead of 'student'
CREATE TYPE user_role_new AS ENUM ('user', 'canteen_owner', 'admin');

-- Step 3: Drop the default value temporarily (it references the old enum type)
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT;

-- Step 4: Change the column type to text temporarily and map 'student' to 'user'
ALTER TABLE public.users 
  ALTER COLUMN role TYPE text USING 
    CASE 
      WHEN role::text = 'student' THEN 'user'
      ELSE role::text
    END;

-- Step 5: Change the column type to the new enum
ALTER TABLE public.users 
  ALTER COLUMN role TYPE user_role_new USING role::user_role_new;

-- Step 6: Set the new default value
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'user'::user_role_new;

-- Step 7: Drop the old enum (only if no other tables use it)
DO $$
DECLARE
  enum_used_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enum_used_count
  FROM information_schema.columns
  WHERE udt_name = 'user_role' AND table_schema = 'public' AND table_name != 'users';
  
  IF enum_used_count = 0 THEN
    DROP TYPE user_role CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If drop fails, continue
    NULL;
END $$;

-- Step 8: Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 8.5: Ensure the is_admin helper function exists (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Step 9: Recreate all policies that reference the role column (using is_admin function to avoid recursion)
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view approved canteens"
  ON public.canteens FOR SELECT
  USING (is_approved = true OR public.is_admin(auth.uid()) OR auth.uid() = owner_id);

CREATE POLICY "Owners can view their own canteen"
  ON public.canteens FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all items"
  ON public.items FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view and manage all offers"
  ON public.offers FOR ALL
  USING (public.is_admin(auth.uid()));

-- Step 10: Update the trigger function to use 'user' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  user_role_val public.user_role;
  user_full_name TEXT;
BEGIN
  -- Log entry for debugging
  RAISE LOG 'handle_new_user triggered for ID: %, Email: %', NEW.id, NEW.email;
  RAISE LOG 'Raw metadata: %', NEW.raw_user_meta_data;

  -- Get role from metadata
  BEGIN
    user_role_val := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'user'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
     RAISE LOG 'Error casting role: %', SQLERRM;
     BEGIN 
        user_role_val := 'student'::public.user_role;
     EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Critical error: role fallback failed.';
     END;
  END;

  RAISE LOG 'Determined Role: %', user_role_val;

  -- Prevent non-admin users from registering as admin
  IF user_role_val = 'admin' THEN
    user_role_val := 'user';
  END IF;

  -- Get full name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );
  
  RAISE LOG 'Determined Full Name: %', user_full_name;

  -- Insert logic with exception handling
  BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role, phone_number)
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      NEW.raw_user_meta_data->>'avatar_url',
      user_role_val,
      NEW.raw_user_meta_data->>'phone_number'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role = COALESCE(users.role, EXCLUDED.role),
      phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
      updated_at = NOW();
      
     RAISE LOG 'User profile inserted successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting user profile: %', SQLERRM;
    RAISE EXCEPTION 'Database error saving new user (Detail: %)', SQLERRM;
  END;

  RETURN NEW;
END;
$func$;

-- 017_fix_recursive_policies.sql
-- Fix infinite recursion in RLS policies
-- This migration replaces recursive policy checks with the is_admin() function

-- Ensure the is_admin helper function exists (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Drop and recreate all policies that use recursive checks
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all canteens" ON public.canteens;
CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view approved canteens" ON public.canteens;
CREATE POLICY "Anyone can view approved canteens"
  ON public.canteens FOR SELECT
  USING (is_approved = true OR public.is_admin(auth.uid()) OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can manage all items" ON public.items;
CREATE POLICY "Admins can manage all items"
  ON public.items FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view and manage all offers" ON public.offers;
CREATE POLICY "Admins can view and manage all offers"
  ON public.offers FOR ALL
  USING (public.is_admin(auth.uid()));


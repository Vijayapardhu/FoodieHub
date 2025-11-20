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


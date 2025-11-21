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


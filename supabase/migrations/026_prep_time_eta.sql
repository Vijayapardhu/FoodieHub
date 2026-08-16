-- 026_prep_time_eta.sql
--
-- "Ready in about 15 minutes."
--
-- `orders.estimated_preparation_time` has existed since 012 and was never
-- written to, so every order carried NULL and the app could not tell anyone
-- when their food would be done. The one question a student has after
-- ordering had no answer anywhere in the product.
--
-- Two pieces are needed for the estimate to be honest rather than decorative:
-- a per-kitchen figure (a dosa counter and a thali counter are not the same),
-- and the ability for the kitchen to revise it on a specific order when the
-- queue is long.
--
-- Safe to re-run.

-- How long this canteen usually takes. NULL means "use the platform default",
-- so an owner who never touches the setting still gets a sensible number.
ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS prep_minutes INTEGER;

ALTER TABLE public.canteens
  DROP CONSTRAINT IF EXISTS canteens_prep_minutes_check;

ALTER TABLE public.canteens
  ADD CONSTRAINT canteens_prep_minutes_check
  CHECK (prep_minutes IS NULL OR prep_minutes BETWEEN 1 AND 180);

-- Stamp the estimate onto the order at insert, from the canteen's own figure
-- and falling back to the platform default.
--
-- Doing it here rather than in the checkout code means the number is right
-- even for an order created by some other path, and it cannot be spoofed from
-- the browser to make one order look faster than the kitchen can cook it.
CREATE OR REPLACE FUNCTION public.set_order_prep_estimate()
RETURNS TRIGGER AS $$
DECLARE
  canteen_minutes INTEGER;
  platform_minutes INTEGER;
BEGIN
  IF NEW.estimated_preparation_time IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT prep_minutes INTO canteen_minutes
  FROM public.canteens WHERE id = NEW.canteen_id;

  SELECT default_preparation_minutes INTO platform_minutes
  FROM public.platform_settings WHERE id;

  NEW.estimated_preparation_time :=
    coalesce(canteen_minutes, platform_minutes, 20);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS orders_set_prep_estimate ON public.orders;
CREATE TRIGGER orders_set_prep_estimate
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_prep_estimate();

-- Backfill live orders so existing ones show an estimate too. Anything already
-- collected or cancelled is left alone — a retrospective ETA is noise.
UPDATE public.orders o
SET estimated_preparation_time = coalesce(
  (SELECT c.prep_minutes FROM public.canteens c WHERE c.id = o.canteen_id),
  (SELECT s.default_preparation_minutes FROM public.platform_settings s WHERE s.id),
  20
)
WHERE o.estimated_preparation_time IS NULL
  AND o.status IN ('pending', 'confirmed', 'preparing', 'ready');

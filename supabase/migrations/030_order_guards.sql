-- 030_order_guards.sql
--
-- Enforce the ordering rules where they cannot be bypassed.
--
-- The app hides closed canteens and sold-out dishes, but nothing stopped an
-- order for either from reaching the database. A stale tab, a back button or
-- a slow network was enough — and the result landed in a kitchen that then
-- had to decline it. Every guard in the product was decoration, enforced only
-- by whichever screen the customer happened to be looking at.
--
-- Prices had the same problem: the browser sent the line price, so an order
-- could be placed for a fraction of the menu price and the counter would only
-- find out while taking cash.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_order_insert()
RETURNS TRIGGER AS $$
DECLARE
  canteen RECORD;
  ordering_on BOOLEAN;
BEGIN
  SELECT is_open, is_approved, name
  INTO canteen
  FROM public.canteens
  WHERE id = NEW.canteen_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That canteen no longer exists.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT canteen.is_approved THEN
    RAISE EXCEPTION 'That canteen is not taking orders yet.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- A closed kitchen can still accept a booking for later — that is the whole
  -- point of scheduling — but not an order it is expected to cook now.
  IF NOT canteen.is_open AND NEW.scheduled_pickup_time IS NULL THEN
    RAISE EXCEPTION '% is closed right now.', canteen.name
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT ordering_enabled INTO ordering_on
  FROM public.platform_settings WHERE id;

  IF ordering_on IS FALSE THEN
    RAISE EXCEPTION 'Ordering is paused across FoodieHub right now.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS orders_guard_insert ON public.orders;
CREATE TRIGGER orders_guard_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_order_insert();

REVOKE EXECUTE ON FUNCTION public.guard_order_insert() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Order lines
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_order_item_insert()
RETURNS TRIGGER AS $$
DECLARE
  dish RECORD;
  order_canteen UUID;
BEGIN
  SELECT canteen_id INTO order_canteen
  FROM public.orders WHERE id = NEW.order_id;

  SELECT id, name, price, is_available, canteen_id
  INTO dish
  FROM public.items
  WHERE id = NEW.item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That dish is no longer on the menu.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Stops one canteen's dish being attached to another's order, which would
  -- put the item on the wrong kitchen's queue.
  IF dish.canteen_id IS DISTINCT FROM order_canteen THEN
    RAISE EXCEPTION '% belongs to a different canteen.', dish.name
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT dish.is_available THEN
    RAISE EXCEPTION '% has sold out.', dish.name
      USING ERRCODE = 'check_violation';
  END IF;

  -- The menu is the authority on price, not the browser.
  NEW.price := dish.price;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS order_items_guard_insert ON public.order_items;
CREATE TRIGGER order_items_guard_insert
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_order_item_insert();

REVOKE EXECUTE ON FUNCTION public.guard_order_item_insert() FROM PUBLIC, anon, authenticated;

-- 027_item_prep_and_decline.sql
--
-- Two changes to how an order starts its life.
--
-- 1. The estimate now comes from what was actually ordered. A canteen-wide
--    figure says the same thing about a cup of tea and a thali; the kitchen
--    knows those are not the same wait, and so does the student.
--
--    The rule is the slowest dish, not the sum: a kitchen cooks the samosas
--    while the dosa is on the tawa, so an order is ready when its longest
--    item is ready — never sooner, and rarely much later.
--
--    The canteen-wide figure is the fallback, not a floor. Treating it as a
--    floor quoted a 3-minute chai at the canteen's 20-minute average, which
--    defeats the point of having per-dish times at all.
--
-- 2. A declined order is recorded as declined, with a reason, instead of
--    silently becoming "cancelled" and leaving the student to guess whether
--    they cancelled it themselves.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Per-dish prep time
-- ---------------------------------------------------------------------------

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS prep_minutes INTEGER;

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_prep_minutes_check;

ALTER TABLE public.items
  ADD CONSTRAINT items_prep_minutes_check
  CHECK (prep_minutes IS NULL OR prep_minutes BETWEEN 1 AND 180);

-- Order lines land after the order row, so the estimate cannot be finished in
-- the orders trigger: that one sets the canteen fallback, and this replaces it
-- with the slowest dish once the lines are known.
--
-- Recomputed across the whole order on each line rather than accumulated, so
-- it is correct whatever order the lines arrive in and self-heals if one is
-- removed and re-added.
CREATE OR REPLACE FUNCTION public.raise_order_prep_estimate()
RETURNS TRIGGER AS $$
DECLARE
  slowest_dish INTEGER;
BEGIN
  SELECT max(i.prep_minutes) INTO slowest_dish
  FROM public.order_items oi
  JOIN public.items i ON i.id = oi.item_id
  WHERE oi.order_id = NEW.order_id;

  -- No dish on the order carries a time: leave the canteen default in place.
  IF slowest_dish IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.orders
  SET estimated_preparation_time = slowest_dish
  WHERE id = NEW.order_id
    -- Never re-time an order the kitchen has already accepted: the customer
    -- has been shown a number and it should not move under them.
    AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS order_items_raise_prep_estimate ON public.order_items;
CREATE TRIGGER order_items_raise_prep_estimate
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.raise_order_prep_estimate();

-- ---------------------------------------------------------------------------
-- Declining an order
-- ---------------------------------------------------------------------------

-- Why the kitchen turned it down — shown to the student on their order screen
-- and carried into the notification.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Tell the customer, in the kitchen's words, rather than the generic
-- "this order was cancelled" that 020 sends for every cancellation.
CREATE OR REPLACE FUNCTION public.notify_customer_on_decline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled'
     AND NEW.decline_reason IS NOT NULL
  THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Order ' || NEW.token || ' declined',
      NEW.decline_reason,
      'order',
      jsonb_build_object(
        'order_id', NEW.id,
        'token', NEW.token,
        'status', NEW.status,
        'declined', true
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS orders_notify_decline ON public.orders;
CREATE TRIGGER orders_notify_decline
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_on_decline();

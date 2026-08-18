-- 053_admin_user_update_and_delivery_notify.sql
--
-- Two independent gaps, fixed together because they showed up together.
--
-- 1. public.users has only ever had one UPDATE policy: a user editing their
--    own row. There was never one letting an admin change someone else's —
--    every other admin-managed table (canteens, items, offers, categories,
--    promo_banners) got a matching "Admins manage X" policy when it was
--    built; users didn't. So PUT /api/users/[id]/role has been silently
--    blocked by RLS since the feature was written: the update matches zero
--    rows, .single() then finds no row to return, and that surfaces as a
--    500. Not a bug in the route — there was never a policy letting it work.
--
-- 2. notify_customer_on_status_change() (migration 020) switches on order
--    status to decide what to tell the customer, with explicit cases for
--    confirmed/preparing/ready/completed/cancelled. Migration 049 added
--    'out_for_delivery' as a status without ever coming back to teach this
--    trigger about it — so a delivery order silently falls through the
--    ELSE and the customer is never told their food is on its way. Pickup
--    orders were never affected; only delivery was ever missing.
--
-- Safe to re-run.

DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_customer_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
  headline TEXT;
  body TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT c.name INTO canteen_name
  FROM public.canteens c
  WHERE c.id = NEW.canteen_id;

  canteen_name := COALESCE(canteen_name, 'The canteen');

  CASE NEW.status
    WHEN 'confirmed' THEN
      headline := 'Order ' || NEW.token || ' confirmed';
      body := canteen_name || ' accepted your order.';
    WHEN 'preparing' THEN
      headline := 'Order ' || NEW.token || ' is being cooked';
      body := canteen_name || ' has started preparing your food.';
    WHEN 'ready' THEN
      headline := 'Order ' || NEW.token || ' is ready';
      body := 'Collect it at ' || canteen_name || ' — show your token at the counter.';
    WHEN 'out_for_delivery' THEN
      headline := 'Order ' || NEW.token || ' is out for delivery';
      body := canteen_name || ' has handed it off — it''s on its way to you.';
    WHEN 'completed' THEN
      headline := 'Order ' || NEW.token || ' collected';
      body := 'Enjoy your meal. Tap to rate it.';
    WHEN 'cancelled' THEN
      headline := 'Order ' || NEW.token || ' cancelled';
      body := 'This order at ' || canteen_name || ' was cancelled.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.user_id,
    headline,
    body,
    'order',
    jsonb_build_object('order_id', NEW.id, 'token', NEW.token, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

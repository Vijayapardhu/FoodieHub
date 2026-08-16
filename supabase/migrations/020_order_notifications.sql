-- Order notifications.
--
-- The app already has a notification centre and a realtime subscription, but
-- nothing was writing rows into public.notifications, so students never heard
-- that their food was ready. These triggers close that loop.

-- Notify the canteen owner the moment an order lands.
CREATE OR REPLACE FUNCTION public.notify_owner_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  owner UUID;
  canteen_name TEXT;
BEGIN
  SELECT c.owner_id, c.name INTO owner, canteen_name
  FROM public.canteens c
  WHERE c.id = NEW.canteen_id;

  IF owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      owner,
      'New order ' || NEW.token,
      COALESCE(NEW.customer_name, 'A student') || ' ordered ₹' ||
        TO_CHAR(NEW.total_amount, 'FM999999990.00') || ' from ' ||
        COALESCE(canteen_name, 'your canteen'),
      'order',
      jsonb_build_object('order_id', NEW.id, 'token', NEW.token)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_owner_on_new_order_trigger ON public.orders;
CREATE TRIGGER notify_owner_on_new_order_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_new_order();

-- Notify the customer on every status change.
CREATE OR REPLACE FUNCTION public.notify_customer_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
  headline TEXT;
  body TEXT;
BEGIN
  -- Only status transitions are worth a notification; ignore other updates
  -- such as payment being recorded.
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

DROP TRIGGER IF EXISTS notify_customer_on_status_change_trigger ON public.orders;
CREATE TRIGGER notify_customer_on_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_on_status_change();

-- Let the owner know when a student reviews them.
CREATE OR REPLACE FUNCTION public.notify_owner_on_review()
RETURNS TRIGGER AS $$
DECLARE
  owner UUID;
  canteen_name TEXT;
BEGIN
  IF NEW.canteen_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.owner_id, c.name INTO owner, canteen_name
  FROM public.canteens c
  WHERE c.id = NEW.canteen_id;

  IF owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      owner,
      NEW.rating || '-star review',
      'A student rated ' || COALESCE(canteen_name, 'your canteen') || ' ' ||
        NEW.rating || ' out of 5.',
      'feedback',
      jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_owner_on_review_trigger ON public.reviews;
CREATE TRIGGER notify_owner_on_review_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_review();

-- Tell the student when the canteen replies to their review.
CREATE OR REPLACE FUNCTION public.notify_customer_on_owner_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_response IS NULL
     OR NEW.owner_response IS NOT DISTINCT FROM OLD.owner_response THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.user_id,
    'The canteen replied to your review',
    LEFT(NEW.owner_response, 140),
    'feedback',
    jsonb_build_object('review_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_customer_on_owner_response_trigger ON public.reviews;
CREATE TRIGGER notify_customer_on_owner_response_trigger
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_on_owner_response();

-- Realtime delivery. The client subscribes to postgres_changes on these
-- tables, which only emits once they're in the publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'supabase_realtime publication not found; skipping realtime setup.';
END $$;

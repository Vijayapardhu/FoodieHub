-- 028_web_push.sql
--
-- Real web push, so a canteen finds out about an order with the phone in a
-- pocket and the screen off.
--
-- What existed before was `Notification.requestPermission()` and a foreground
-- realtime subscription: an alert only ever fired while the console was open
-- in a focused tab. For a kitchen that is worse than nothing — it looks like
-- coverage without being coverage, and an order sits unaccepted until someone
-- happens to look.
--
-- The delivery path is:
--
--   any INSERT on notifications   (the triggers from 020/027 already write here)
--     -> this trigger, via pg_net
--       -> the `push-notify` edge function
--         -> Web Push to every device that user has registered
--
-- Hanging it off `notifications` rather than off `orders` means every alert
-- the product already knows how to raise — new order, ready to collect,
-- declined, review reply — gets pushed, with no second copy of the wording.
--
-- Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Registered devices
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- The push service's address for this browser on this device. Unique: a
  -- re-subscribe on the same device must update, not accumulate.
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  user_agent TEXT,
  -- Set when a send succeeds; a stale endpoint is pruned by the sender.
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own push subscriptions"
  ON public.push_subscriptions;
CREATE POLICY "Users manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Signing keys
-- ---------------------------------------------------------------------------

-- RLS with no policies: service_role (which the edge function runs as)
-- bypasses RLS, anon and authenticated match nothing and are refused. A
-- separate `private` schema would be tidier but PostgREST only exposes the
-- schemas it is configured with, so the edge function could not read it.
CREATE TABLE IF NOT EXISTS public.push_config (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  CONSTRAINT push_config_singleton CHECK (id),
  vapid_public TEXT NOT NULL,
  vapid_private TEXT NOT NULL,
  -- Identifies this application to the push service, per RFC 8292.
  vapid_subject TEXT NOT NULL DEFAULT 'mailto:support@foodiehub.app',
  -- Shared with the edge function so a stranger cannot invoke it.
  webhook_secret TEXT NOT NULL,
  function_url TEXT NOT NULL
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_config FROM anon, authenticated;

-- The browser needs the public half to create a subscription; the private key
-- never leaves the database.
CREATE OR REPLACE FUNCTION public.vapid_public_key()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vapid_public FROM public.push_config WHERE id;
$$;

GRANT EXECUTE ON FUNCTION public.vapid_public_key() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Dispatch
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  config public.push_config%ROWTYPE;
BEGIN
  SELECT * INTO config FROM public.push_config WHERE id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Fire and forget. pg_net queues the request on a background worker, so a
  -- slow push service can never hold up the transaction that placed the
  -- order — the order is the thing that matters, the alert is best effort.
  --
  -- Wrapped because this runs in an AFTER INSERT trigger: an exception here
  -- rolls back the statement that raised the notification, which is the
  -- INSERT on orders. Failing to tell a kitchen about an order must never
  -- stop the order being placed.
  --
  -- pg_net's functions live in schema `net` whatever schema the extension was
  -- installed into.
  BEGIN
    PERFORM net.http_post(
      url := config.function_url,
      body := jsonb_build_object('notification_id', NEW.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-secret', config.webhook_secret
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'push dispatch failed for notification %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net;

DROP TRIGGER IF EXISTS notifications_dispatch_push ON public.notifications;
CREATE TRIGGER notifications_dispatch_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_push_notification();

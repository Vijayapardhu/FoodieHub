-- 055_payment_settings.sql
--
-- Two things an admin needs for online payments, neither of which existed
-- before: a platform-wide on/off switch, and a way to rotate the Razorpay
-- Key ID / Key Secret / Webhook Secret from the admin panel instead of
-- editing env vars and redeploying.
--
-- The switch is a plain boolean on platform_settings, same as
-- delivery_enabled (migration 049) — it's not sensitive, so it can live on
-- the world-readable settings row and gate the client UI directly.
--
-- The credentials are a different story: platform_settings has an
-- `Anyone can read` SELECT policy (migration 019), which is fine for a
-- boolean but would make a Razorpay key secret readable by any signed-in
-- user if it lived on the same row. So credentials get their own singleton
-- table with RLS enabled and *no* policies at all — that denies every role
-- except service_role, which bypasses RLS entirely. The admin panel never
-- queries this table directly from the browser; it only ever goes through
-- an admin-only API route using the service-role client (see
-- lib/supabase/admin.ts), the same pattern already used to write payment
-- fields on `orders`.
--
-- Safe to re-run.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS online_payments_enabled BOOLEAN NOT NULL DEFAULT true;
-- Defaults to true (not false, like delivery_enabled did) so upgrading to
-- this migration doesn't silently turn off a payment flow that was already
-- working — the switch starts in the state the app already behaved as.

CREATE TABLE IF NOT EXISTS public.payment_credentials (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  CONSTRAINT payment_credentials_singleton CHECK (id),

  -- Not actually secret (it's sent to the browser to open the checkout
  -- popup) but kept alongside the secret fields for one save/read path.
  razorpay_key_id TEXT,
  razorpay_key_secret TEXT,
  razorpay_webhook_secret TEXT,

  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All null: lib/payments/razorpay-credentials.ts falls back to the existing
-- env vars whenever a column here is null, so nothing breaks until an admin
-- actually saves something through the panel.
INSERT INTO public.payment_credentials (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payment_credentials ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies — see the comment above.

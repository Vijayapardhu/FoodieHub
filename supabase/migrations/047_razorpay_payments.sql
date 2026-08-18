-- 047_razorpay_payments.sql
--
-- Wires up online payment. `payment_method` and `payment_status` have existed
-- since 001, but "online" was never anything more than a string nobody wrote
-- — orders were always created (and paid) as 'on_shop'. This adds what an
-- online payment actually needs recorded against the order:
--
--   razorpay_order_id   the order Razorpay was asked to collect for
--   razorpay_payment_id the payment that settled it, once one exists
--
-- and a 'failed' status so a declined or abandoned online payment can be
-- told apart from an order that was simply never charged (on_shop, still
-- pending). Payment writes come from the server (API routes with the
-- service role, or the webhook), never the client — see the RLS policy
-- below.
--
-- Safe to re-run.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'failed';

-- A Razorpay order is only ever attached to one of ours.
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_key
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_razorpay_payment_id_idx
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
--
-- There has never been an UPDATE policy letting a user touch their own
-- order — the app only ever inserted and read. That omission is exactly
-- right for payment fields: nothing about who got paid should be writable
-- by the person paying. The create-order/verify API routes and the webhook
-- all write through the service role, which bypasses RLS entirely, so no
-- new policy is added here on purpose.

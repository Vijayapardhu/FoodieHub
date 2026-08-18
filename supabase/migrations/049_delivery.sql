-- 049_delivery.sql
--
-- Delivery, as a second way to collect an order alongside pickup.
--
-- A delivery destination is not a typed address — it's one of a fixed list
-- of campus drop-off points ("blocks") that an admin maintains, the same
-- way a canteen is a fixed list rather than something a student types in.
-- No address parsing, no map, no ambiguity about where a driverless
-- delivery actually lands.
--
-- Three independent switches gate whether a student ever sees the option:
--   platform_settings.delivery_enabled  — the kill switch, off by default
--   canteens.delivery_enabled           — a canteen opts in
--   at least one active delivery_blocks row exists
-- All three, or the checkout shows pickup only.
--
-- Fulfilment is decided once, at checkout, and never edited afterward — so
-- unlike offer_id there is no "changed after the fact" trigger to write.
-- The kitchen queue gets one new step for a delivery order in place of
-- "ready": there's no counter to show a token at, so "ready" becomes
-- "out for delivery" instead. See lib/utils/order-status.ts.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- The kill switch
-- ---------------------------------------------------------------------------

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Blocks — the fixed inventory of places an order can be delivered to
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.delivery_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 60),
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Lower sorts first in the checkout picker — lets an admin put the busiest
  -- hostel blocks at the top without renaming anything.
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_blocks_active
  ON public.delivery_blocks (is_active, sort_order, name);

ALTER TABLE public.delivery_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active delivery blocks" ON public.delivery_blocks;
CREATE POLICY "Anyone can read active delivery blocks"
  ON public.delivery_blocks FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Admins manage delivery blocks" ON public.delivery_blocks;
CREATE POLICY "Admins manage delivery blocks"
  ON public.delivery_blocks FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_delivery_block()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS delivery_blocks_touch ON public.delivery_blocks;
CREATE TRIGGER delivery_blocks_touch
  BEFORE UPDATE ON public.delivery_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_delivery_block();

-- ---------------------------------------------------------------------------
-- A canteen opts in, and names its price
-- ---------------------------------------------------------------------------

ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0);

-- ---------------------------------------------------------------------------
-- What an order records
-- ---------------------------------------------------------------------------

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfillment_type IN ('pickup', 'delivery')),
  ADD COLUMN IF NOT EXISTS delivery_block_id UUID
    REFERENCES public.delivery_blocks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0
    CHECK (delivery_fee >= 0);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_needs_block;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_needs_block
  CHECK (fulfillment_type = 'pickup' OR delivery_block_id IS NOT NULL);

-- A delivery order has nowhere to show a token at, and a next step the
-- pickup flow doesn't: handed to whoever is carrying it, not to the
-- customer directly.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';

-- ---------------------------------------------------------------------------
-- Pricing — delivery_fee is server-computed, exactly like the discount
-- ---------------------------------------------------------------------------
--
-- A client chooses delivery and a block; it does not get to say what that
-- costs. Whatever a request sends for delivery_fee is a starting value at
-- best — this trigger (already the one source of truth for subtotal and
-- discount_amount, see migration 032) overwrites it from the canteen's
-- current rate the moment the order's lines are known.

CREATE OR REPLACE FUNCTION public.recalculate_order_total(target UUID)
RETURNS VOID AS $$
DECLARE
  order_row RECORD;
  lines_total NUMERIC(10, 2);
  offer RECORD;
  discount NUMERIC(10, 2) := 0;
  delivery NUMERIC(10, 2) := 0;
BEGIN
  SELECT id, canteen_id, offer_id, created_at, fulfillment_type
  INTO order_row
  FROM public.orders WHERE id = target;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT coalesce(sum(price * quantity), 0)
  INTO lines_total
  FROM public.order_items
  WHERE order_id = target;

  IF order_row.fulfillment_type = 'delivery' THEN
    SELECT coalesce(delivery_fee, 0) INTO delivery
    FROM public.canteens
    WHERE id = order_row.canteen_id;
  END IF;

  IF order_row.offer_id IS NOT NULL THEN
    SELECT *
    INTO offer
    FROM public.offers
    WHERE id = order_row.offer_id
      AND canteen_id = order_row.canteen_id
      AND is_approved
      AND is_active
      AND valid_from <= order_row.created_at
      AND valid_until >= order_row.created_at;

    IF FOUND THEN
      discount := CASE offer.discount_type
        WHEN 'percentage' THEN lines_total * offer.discount_value / 100.0
        ELSE offer.discount_value
      END;

      IF offer.max_discount IS NOT NULL THEN
        discount := least(discount, offer.max_discount);
      END IF;

      IF offer.min_order_amount IS NOT NULL
         AND lines_total < offer.min_order_amount
      THEN
        discount := 0;
      END IF;
    END IF;
  END IF;

  discount := greatest(0, least(discount, lines_total));

  UPDATE public.orders
  SET subtotal = lines_total,
      discount_amount = discount,
      delivery_fee = delivery,
      total_amount = lines_total - discount + delivery
  WHERE id = target;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.recalculate_order_total(UUID)
  FROM PUBLIC, anon, authenticated;

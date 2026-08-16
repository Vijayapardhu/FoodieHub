-- 032_order_totals.sql
--
-- Makes the money on an order server-authoritative.
--
-- 030 fixed line prices, but the order total was still whatever the browser
-- said it was — and the discount was worse than untrusted, it was unrecorded.
-- Nothing on an order said which offer had been applied, so a bill could not
-- be reconstructed or audited: the counter simply collected the number the
-- app showed.
--
-- Now the customer nominates an offer and the database does the arithmetic:
--
--   subtotal        = sum of the (already server-priced) lines
--   discount_amount = computed from the nominated offer, if it is genuinely
--                     valid for this order at this moment
--   total_amount    = subtotal - discount, never below zero
--
-- Safe to re-run.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- The arithmetic
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_order_total(target UUID)
RETURNS VOID AS $$
DECLARE
  order_row RECORD;
  lines_total NUMERIC(10, 2);
  offer RECORD;
  discount NUMERIC(10, 2) := 0;
BEGIN
  SELECT id, canteen_id, offer_id, created_at
  INTO order_row
  FROM public.orders WHERE id = target;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT coalesce(sum(price * quantity), 0)
  INTO lines_total
  FROM public.order_items
  WHERE order_id = target;

  IF order_row.offer_id IS NOT NULL THEN
    SELECT *
    INTO offer
    FROM public.offers
    WHERE id = order_row.offer_id
      -- An offer only applies to its own canteen, and only while it is
      -- approved, switched on, and inside its window.
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

      -- Spending below the threshold earns nothing, rather than failing.
      IF offer.min_order_amount IS NOT NULL
         AND lines_total < offer.min_order_amount
      THEN
        discount := 0;
      END IF;
    END IF;
  END IF;

  -- A discount can never exceed the bill; nobody is owed money for ordering.
  discount := greatest(0, least(discount, lines_total));

  UPDATE public.orders
  SET subtotal = lines_total,
      discount_amount = discount,
      total_amount = lines_total - discount
  WHERE id = target;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.recalculate_order_total(UUID)
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- When to recompute
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.order_items_recalculate()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalculate_order_total(
    COALESCE(NEW.order_id, OLD.order_id)
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS order_items_recalculate_total ON public.order_items;
CREATE TRIGGER order_items_recalculate_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_recalculate();

REVOKE EXECUTE ON FUNCTION public.order_items_recalculate()
  FROM PUBLIC, anon, authenticated;

-- Nominating an offer re-prices the order. Only `offer_id` is watched, and
-- the recalculation writes the money columns rather than `offer_id`, so this
-- cannot re-enter itself.
CREATE OR REPLACE FUNCTION public.orders_offer_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.offer_id IS DISTINCT FROM OLD.offer_id THEN
    PERFORM public.recalculate_order_total(NEW.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS orders_offer_recalculate ON public.orders;
CREATE TRIGGER orders_offer_recalculate
  AFTER UPDATE OF offer_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_offer_changed();

REVOKE EXECUTE ON FUNCTION public.orders_offer_changed()
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------

-- Existing orders keep the total they were actually charged; only the split
-- is filled in, and only where the lines agree with it. An order whose lines
-- no longer add up to what was collected is left alone rather than silently
-- rewritten — that is a bookkeeping question, not a migration's decision.
UPDATE public.orders o
SET subtotal = lines.total
FROM (
  SELECT order_id, sum(price * quantity) AS total
  FROM public.order_items
  GROUP BY order_id
) AS lines
WHERE o.id = lines.order_id
  AND o.subtotal = 0;

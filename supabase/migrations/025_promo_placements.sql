-- 025_promo_placements.sql
--
-- More inventory to sell.
--
-- 023 shipped a single slot: the home carousel. That is the most valuable
-- placement but it is also the only one, which caps what the platform can
-- earn and means a canteen either wins the hero or advertises nothing.
--
-- This adds three cheaper, lower-attention slots so there is a ladder:
--
--   home_hero    the carousel at the top of /home        full rate
--   home_inline  a strip between the category tiles and  half rate
--                the canteen list
--   orders       under the live order on /orders — read  half rate
--                while somebody is already waiting for food
--   cart         inside the cart, next to the bill        half rate
--
-- Safe to re-run.

ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS placement TEXT NOT NULL DEFAULT 'home_hero';

ALTER TABLE public.promo_banners
  DROP CONSTRAINT IF EXISTS promo_banners_placement_check;

ALTER TABLE public.promo_banners
  ADD CONSTRAINT promo_banners_placement_check
  CHECK (placement IN ('home_hero', 'home_inline', 'orders', 'cart'));

-- Every read is "live banners for this placement, best priority first".
DROP INDEX IF EXISTS idx_promo_banners_live;
CREATE INDEX IF NOT EXISTS idx_promo_banners_live
  ON public.promo_banners (placement, status, starts_at, ends_at, priority DESC);

-- ---------------------------------------------------------------------------
-- Rate card
-- ---------------------------------------------------------------------------

-- What each slot costs relative to the daily rate. Kept in one function so the
-- owner's quote, the guard trigger and the admin's invoice cannot drift apart.
CREATE OR REPLACE FUNCTION public.promo_placement_multiplier(placement TEXT)
RETURNS NUMERIC AS $$
  SELECT CASE placement
    WHEN 'home_hero' THEN 1.0
    ELSE 0.5
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Re-price through the multiplier. Same guard as 023 otherwise: an owner still
-- cannot set their own status, priority, payment or metrics.
CREATE OR REPLACE FUNCTION public.guard_promo_banner_write()
RETURNS TRIGGER AS $$
DECLARE
  admin BOOLEAN := public.is_admin(auth.uid());
  rate NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT admin THEN
      SELECT promo_daily_rate INTO rate FROM public.platform_settings WHERE id;
      NEW.amount_due := ceil(
        extract(epoch FROM (NEW.ends_at - NEW.starts_at)) / 86400.0
      ) * coalesce(rate, 0) * public.promo_placement_multiplier(NEW.placement);

      NEW.status := 'pending';
      NEW.priority := 0;
      NEW.amount_paid := 0;
      NEW.payment_reference := NULL;
      NEW.impressions := 0;
      NEW.clicks := 0;
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
      NEW.review_note := NULL;
      NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;

  IF coalesce(current_setting('foodiehub.promo_metrics', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NOT admin THEN
    NEW.canteen_id := OLD.canteen_id;

    IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
       OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
       OR NEW.placement IS DISTINCT FROM OLD.placement
    THEN
      SELECT promo_daily_rate INTO rate FROM public.platform_settings WHERE id;
      NEW.amount_due := ceil(
        extract(epoch FROM (NEW.ends_at - NEW.starts_at)) / 86400.0
      ) * coalesce(rate, 0) * public.promo_placement_multiplier(NEW.placement);
    ELSE
      NEW.amount_due := OLD.amount_due;
    END IF;

    NEW.amount_paid := OLD.amount_paid;
    NEW.payment_reference := OLD.payment_reference;
    NEW.impressions := OLD.impressions;
    NEW.clicks := OLD.clicks;
    NEW.priority := OLD.priority;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_note := OLD.review_note;
    NEW.created_by := OLD.created_by;

    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (
         (OLD.status = 'approved' AND NEW.status = 'paused') OR
         (OLD.status = 'paused' AND NEW.status = 'approved')
       )
    THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

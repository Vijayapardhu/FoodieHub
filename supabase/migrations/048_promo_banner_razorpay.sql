-- 048_promo_banner_razorpay.sql
--
-- Moves banner payment from "admin collects cash/UPI and types in a
-- reference" to "owner pays online via Razorpay" — and makes payment, not
-- just content approval, the thing that puts a banner in front of students.
--
-- Before this, `status = 'approved'` was both the content-moderation
-- decision and the on-air switch: approving a request made it live on the
-- spot, and payment was tracked separately purely for bookkeeping. That was
-- fine when an admin collected the money by hand at approval time, but it
-- means nothing once payment moves online and can lag approval by minutes
-- or never happen at all. So "live" now requires both: approved *and* paid
-- in full. See the updated `isLive()` in lib/utils/promo-banners.ts, which
-- must agree with the RLS policy below.
--
-- Safe to re-run.

ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS promo_banners_razorpay_order_id_key
  ON public.promo_banners (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Column guard: let the service role through, reset the new column too
-- ---------------------------------------------------------------------------
--
-- `is_admin(auth.uid())` is false for a service-role request — there is no
-- `sub` claim to look up, so no user row ever matches. The payment routes
-- and the webhook write through the service role (they've already verified
-- the Razorpay signature themselves; that's their authorization), and
-- without this fix the guard would silently reset amount_paid and
-- payment_reference right back to what they were, on every single payment.
CREATE OR REPLACE FUNCTION public.guard_promo_banner_write()
RETURNS TRIGGER AS $$
DECLARE
  admin BOOLEAN := public.is_admin(auth.uid()) OR auth.role() = 'service_role';
  rate NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT admin THEN
      SELECT promo_daily_rate INTO rate FROM public.platform_settings WHERE id;
      NEW.amount_due := ceil(
        extract(epoch FROM (NEW.ends_at - NEW.starts_at)) / 86400.0
      ) * coalesce(rate, 0);

      NEW.status := 'pending';
      NEW.priority := 0;
      NEW.amount_paid := 0;
      NEW.payment_reference := NULL;
      NEW.razorpay_order_id := NULL;
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
    THEN
      SELECT promo_daily_rate INTO rate FROM public.platform_settings WHERE id;
      NEW.amount_due := ceil(
        extract(epoch FROM (NEW.ends_at - NEW.starts_at)) / 86400.0
      ) * coalesce(rate, 0);
    ELSE
      NEW.amount_due := OLD.amount_due;
    END IF;

    NEW.amount_paid := OLD.amount_paid;
    NEW.payment_reference := OLD.payment_reference;
    NEW.razorpay_order_id := OLD.razorpay_order_id;
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

-- ---------------------------------------------------------------------------
-- What "live" means to a student, now paid-gated
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read live banners" ON public.promo_banners;
CREATE POLICY "Anyone can read live banners"
  ON public.promo_banners FOR SELECT
  USING (
    status = 'approved'
    AND amount_paid >= amount_due
    AND NOW() >= starts_at
    AND NOW() <= ends_at
  );

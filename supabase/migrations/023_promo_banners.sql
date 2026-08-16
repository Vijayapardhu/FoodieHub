-- 023_promo_banners.sql
--
-- Paid promotional banners for the home carousel.
--
-- A canteen owner buys a slot, an admin approves it and records the payment,
-- and the banner runs on /home between its start and end dates. This is the
-- platform's revenue line, so the money columns and the performance counters
-- are writable by admins only — enforced by a trigger rather than by trusting
-- the client, because an owner could otherwise mark their own slot approved
-- and paid straight from the browser.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Rate card
-- ---------------------------------------------------------------------------

-- What a slot costs per day. Lives on the settings singleton so an admin can
-- change the rate without a deploy, and so the owner-side quote and the
-- admin-side invoice read the same number.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS promo_daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 199
    CHECK (promo_daily_rate >= 0);

-- ---------------------------------------------------------------------------
-- Banners
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Every banner belongs to a canteen: it is that canteen's advertisement,
  -- whether the owner or an admin created it.
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  -- Optional discount the banner is advertising. SET NULL rather than CASCADE
  -- so deleting a finished offer doesn't wipe a paid-for slot.
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,

  headline TEXT NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 60),
  subtext TEXT CHECK (subtext IS NULL OR char_length(subtext) <= 120),
  image_url TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Order now'
    CHECK (char_length(cta_label) BETWEEN 1 AND 24),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'paused')),
  -- Why an admin rejected it, shown back to the owner.
  review_note TEXT,

  -- Higher sorts first in the carousel. Admin-only: a paid premium slot.
  priority INTEGER NOT NULL DEFAULT 0,

  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT promo_banners_window CHECK (ends_at > starts_at),

  -- Revenue. amount_due is quoted at request time from the rate card above;
  -- amount_paid is what the admin actually collected.
  amount_due NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  payment_reference TEXT,

  -- What the advertiser is buying, so both sides can judge renewals.
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,

  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The home query is "approved, and now() inside the window, best priority
-- first" on every page load, so index exactly that.
CREATE INDEX IF NOT EXISTS idx_promo_banners_live
  ON public.promo_banners (status, starts_at, ends_at, priority DESC);

CREATE INDEX IF NOT EXISTS idx_promo_banners_canteen
  ON public.promo_banners (canteen_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Column guard
-- ---------------------------------------------------------------------------

-- Owners write their own banners directly from the browser, so RLS alone is
-- not enough: it decides which *rows* they may touch, not which *columns*.
-- This resets the privileged columns to their previous values for anybody who
-- is not an admin, which makes self-approval and self-payment impossible even
-- with a hand-written request.
CREATE OR REPLACE FUNCTION public.guard_promo_banner_write()
RETURNS TRIGGER AS $$
DECLARE
  admin BOOLEAN := public.is_admin(auth.uid());
  rate NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT admin THEN
      -- Price the slot here rather than trusting the number the browser sent,
      -- so what an owner owes always matches the published rate card.
      SELECT promo_daily_rate INTO rate FROM public.platform_settings WHERE id;
      NEW.amount_due := ceil(
        extract(epoch FROM (NEW.ends_at - NEW.starts_at)) / 86400.0
      ) * coalesce(rate, 0);

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

  -- The impression/click counters are bumped by track_promo_banner(), which
  -- runs as the definer on behalf of an ordinary student. That function sets
  -- this flag so the counter write is let through while everything else on
  -- the row stays frozen.
  IF coalesce(current_setting('foodiehub.promo_metrics', true), '') = 'on' THEN
    -- Let the counter write through untouched, and leave updated_at alone so a
    -- view doesn't look like an edit in the owner's list.
    RETURN NEW;
  END IF;

  IF NOT admin THEN
    NEW.canteen_id := OLD.canteen_id;

    -- Re-quote when the owner moves the dates; otherwise keep whatever the
    -- admin settled on, which may be a negotiated figure.
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
    NEW.impressions := OLD.impressions;
    NEW.clicks := OLD.clicks;
    NEW.priority := OLD.priority;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.review_note := OLD.review_note;
    NEW.created_by := OLD.created_by;

    -- An owner may pause a running banner and resume it again. Every other
    -- status move (notably rejected/pending -> approved) is an admin's call.
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

DROP TRIGGER IF EXISTS promo_banners_guard ON public.promo_banners;
CREATE TRIGGER promo_banners_guard
  BEFORE INSERT OR UPDATE ON public.promo_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_promo_banner_write();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Students only ever see a banner that is approved and inside its window.
DROP POLICY IF EXISTS "Anyone can read live banners" ON public.promo_banners;
CREATE POLICY "Anyone can read live banners"
  ON public.promo_banners FOR SELECT
  USING (
    status = 'approved'
    AND NOW() >= starts_at
    AND NOW() <= ends_at
  );

DROP POLICY IF EXISTS "Owners read their own banners" ON public.promo_banners;
CREATE POLICY "Owners read their own banners"
  ON public.promo_banners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = canteen_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners request banners" ON public.promo_banners;
CREATE POLICY "Owners request banners"
  ON public.promo_banners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = canteen_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners edit their own banners" ON public.promo_banners;
CREATE POLICY "Owners edit their own banners"
  ON public.promo_banners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = canteen_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners withdraw their own banners" ON public.promo_banners;
CREATE POLICY "Owners withdraw their own banners"
  ON public.promo_banners FOR DELETE
  USING (
    status IN ('pending', 'rejected')
    AND EXISTS (
      SELECT 1 FROM public.canteens c
      WHERE c.id = canteen_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all banners" ON public.promo_banners;
CREATE POLICY "Admins manage all banners"
  ON public.promo_banners FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Impression and click tracking
-- ---------------------------------------------------------------------------

-- Students have no UPDATE rights on the table, so the carousel reports what it
-- showed and what was tapped through this function instead. It only ever
-- increments, and only on a banner that is actually live, so it cannot be used
-- to edit a row or to inflate a paused slot's numbers.
CREATE OR REPLACE FUNCTION public.track_promo_banner(
  banner_id UUID,
  event TEXT DEFAULT 'impression'
)
RETURNS VOID AS $$
BEGIN
  IF event NOT IN ('impression', 'click') THEN
    RAISE EXCEPTION 'unknown promo event: %', event;
  END IF;

  PERFORM set_config('foodiehub.promo_metrics', 'on', true);

  UPDATE public.promo_banners
  SET impressions = impressions + (CASE WHEN event = 'impression' THEN 1 ELSE 0 END),
      clicks = clicks + (CASE WHEN event = 'click' THEN 1 ELSE 0 END)
  WHERE id = banner_id
    AND status = 'approved'
    AND NOW() BETWEEN starts_at AND ends_at;

  PERFORM set_config('foodiehub.promo_metrics', 'off', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.track_promo_banner(UUID, TEXT)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- Banner artwork. Separate from the `canteens` bucket so an admin can clear
-- expired creative without touching a canteen's logo or cover photo.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('promos', 'promos', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE
  SET public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Public read access for promos" ON storage.objects;
CREATE POLICY "Public read access for promos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'promos');

DROP POLICY IF EXISTS "Authenticated users can upload promos" ON storage.objects;
CREATE POLICY "Authenticated users can upload promos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'promos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update promos" ON storage.objects;
CREATE POLICY "Authenticated users can update promos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'promos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete promos" ON storage.objects;
CREATE POLICY "Authenticated users can delete promos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'promos' AND auth.role() = 'authenticated');

-- 024_public_url_slugs.sql
--
-- Readable, non-guessable public identifiers so raw database UUIDs stop
-- appearing in the address bar.
--
--   /canteen/9f3c1e2a-...  ->  /canteen/central-canteen
--   /items/6b21d8f0-...    ->  /items/masala-dosa-4f2a
--   /orders/1d9e77c4-...   ->  /orders/A7K2QX      (the pickup token)
--   /profile/feedback/...  ->  /profile/feedback/rv_8fk2mq10
--
-- Beyond looking amateurish, a UUID in a shared link leaks the exact primary
-- key of a row to anyone the link is forwarded to, and it makes every URL
-- unreadable and unmemorable. Orders already had a public identifier — the
-- six-character token printed on the bill — it just was not being used for
-- routing.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Lowercase, ASCII, hyphenated. `unaccent` is not guaranteed to be installed,
-- so this strips anything outside a-z0-9 rather than transliterating it.
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
  SELECT nullif(
    trim(BOTH '-' FROM
      regexp_replace(
        regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'),
        '-{2,}', '-', 'g'
      )
    ),
    ''
  );
$$ LANGUAGE sql IMMUTABLE;

-- Short, lowercase, collision-resistant suffix. Not security-bearing: RLS
-- still decides who may read a row, this only stops the URL being a guess.
CREATE OR REPLACE FUNCTION public.short_code(len INTEGER DEFAULT 4)
RETURNS TEXT AS $$
  SELECT string_agg(
    substr('abcdefghijkmnpqrstuvwxyz23456789', (random() * 31)::int + 1, 1),
    ''
  )
  FROM generate_series(1, len);
$$ LANGUAGE sql VOLATILE;

-- ---------------------------------------------------------------------------
-- Canteens
-- ---------------------------------------------------------------------------

ALTER TABLE public.canteens ADD COLUMN IF NOT EXISTS slug TEXT;

-- Names are near-unique per campus, so a bare name slug is usually enough; the
-- loop only adds a suffix when it has to.
CREATE OR REPLACE FUNCTION public.set_canteen_slug()
RETURNS TRIGGER AS $$
DECLARE
  base TEXT;
  candidate TEXT;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base := coalesce(public.slugify(NEW.name), 'canteen');
  candidate := base;

  WHILE EXISTS (
    SELECT 1 FROM public.canteens
    WHERE slug = candidate AND id IS DISTINCT FROM NEW.id
  ) LOOP
    candidate := base || '-' || public.short_code(4);
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS canteens_set_slug ON public.canteens;
CREATE TRIGGER canteens_set_slug
  BEFORE INSERT OR UPDATE OF name, slug ON public.canteens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_canteen_slug();

-- Backfill. The UPDATE fires the trigger, which fills the column.
UPDATE public.canteens SET slug = NULL WHERE slug = '';
UPDATE public.canteens SET name = name WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS canteens_slug_key
  ON public.canteens (slug);

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS slug TEXT;

-- Two canteens both selling "Masala Dosa" is the normal case rather than the
-- exception, so item slugs always carry a suffix.
CREATE OR REPLACE FUNCTION public.set_item_slug()
RETURNS TRIGGER AS $$
DECLARE
  base TEXT;
  candidate TEXT;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base := coalesce(public.slugify(NEW.name), 'dish');
  candidate := base || '-' || public.short_code(4);

  WHILE EXISTS (
    SELECT 1 FROM public.items
    WHERE slug = candidate AND id IS DISTINCT FROM NEW.id
  ) LOOP
    candidate := base || '-' || public.short_code(5);
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_set_slug ON public.items;
CREATE TRIGGER items_set_slug
  BEFORE INSERT OR UPDATE OF name, slug ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_item_slug();

UPDATE public.items SET slug = NULL WHERE slug = '';
UPDATE public.items SET name = name WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS items_slug_key ON public.items (slug);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

-- A review has no name to slugify, so it gets an opaque handle.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS public_code TEXT;

CREATE OR REPLACE FUNCTION public.set_review_public_code()
RETURNS TRIGGER AS $$
DECLARE
  candidate TEXT;
BEGIN
  IF NEW.public_code IS NOT NULL AND NEW.public_code <> '' THEN
    RETURN NEW;
  END IF;

  LOOP
    candidate := 'rv-' || public.short_code(8);
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE public_code = candidate AND id IS DISTINCT FROM NEW.id
    );
  END LOOP;

  NEW.public_code := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_set_public_code ON public.reviews;
CREATE TRIGGER reviews_set_public_code
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_public_code();

-- Backfill without firing the insert-only trigger.
UPDATE public.reviews
SET public_code = 'rv-' || public.short_code(8)
WHERE public_code IS NULL OR public_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS reviews_public_code_key
  ON public.reviews (public_code);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- Orders are routed by their existing pickup token. Tokens were only ever
-- unique in practice, not by constraint, and routing by them makes that
-- distinction matter — two orders sharing a token would otherwise mean one
-- student opening another's bill.
--
-- Re-issue any collisions that already slipped through before the constraint
-- goes on, oldest order keeps its token.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY token ORDER BY created_at, id
  ) AS position
  FROM public.orders
)
UPDATE public.orders o
SET token = upper(public.short_code(6))
FROM ranked r
WHERE o.id = r.id AND r.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS orders_token_key ON public.orders (token);

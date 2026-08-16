-- Platform-wide configuration, held in a single row.
-- A one-row table (rather than a key/value store) keeps the settings typed and
-- lets a single SELECT fetch everything the app needs.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true,
  -- Guarantees exactly one row can ever exist.
  CONSTRAINT platform_settings_singleton CHECK (id),

  platform_name TEXT NOT NULL DEFAULT 'FoodieHub',
  support_email TEXT,
  support_phone TEXT,

  -- Ordering rules
  token_length INTEGER NOT NULL DEFAULT 6
    CHECK (token_length BETWEEN 4 AND 8),
  order_cancellation_window_minutes INTEGER NOT NULL DEFAULT 5
    CHECK (order_cancellation_window_minutes BETWEEN 0 AND 60),
  default_preparation_minutes INTEGER NOT NULL DEFAULT 20
    CHECK (default_preparation_minutes BETWEEN 1 AND 180),
  max_scheduled_days_ahead INTEGER NOT NULL DEFAULT 7
    CHECK (max_scheduled_days_ahead BETWEEN 0 AND 30),

  -- Feature switches
  ordering_enabled BOOLEAN NOT NULL DEFAULT true,
  scheduled_orders_enabled BOOLEAN NOT NULL DEFAULT true,
  reviews_enabled BOOLEAN NOT NULL DEFAULT true,
  loyalty_enabled BOOLEAN NOT NULL DEFAULT true,
  new_canteens_require_approval BOOLEAN NOT NULL DEFAULT true,

  -- Shown as a site-wide banner when set
  maintenance_message TEXT,

  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton row so the app always has settings to read.
INSERT INTO public.platform_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone signed in reads them (feature flags gate the customer UI);
-- only admins write.
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit trail for configuration changes.
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_created_at
  ON public.settings_audit_log (created_at DESC);

ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read the settings audit log" ON public.settings_audit_log;
CREATE POLICY "Admins can read the settings audit log"
  ON public.settings_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Records the diff whenever the settings row changes.
CREATE OR REPLACE FUNCTION public.log_platform_settings_change()
RETURNS TRIGGER AS $$
DECLARE
  diff JSONB;
BEGIN
  SELECT jsonb_object_agg(new_row.key, jsonb_build_object('from', old_row.value, 'to', new_row.value))
  INTO diff
  FROM jsonb_each(to_jsonb(NEW)) AS new_row
  JOIN jsonb_each(to_jsonb(OLD)) AS old_row ON old_row.key = new_row.key
  WHERE new_row.value IS DISTINCT FROM old_row.value
    AND new_row.key NOT IN ('updated_at', 'updated_by');

  IF diff IS NOT NULL THEN
    INSERT INTO public.settings_audit_log (changed_by, changes)
    VALUES (NEW.updated_by, diff);
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS platform_settings_audit ON public.platform_settings;
CREATE TRIGGER platform_settings_audit
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_platform_settings_change();

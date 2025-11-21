-- Add approval system for canteens
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_canteens_is_approved ON public.canteens(is_approved);

-- Update existing canteens to be approved (optional - for existing data)
-- UPDATE public.canteens SET is_approved = true WHERE is_approved IS NULL;

-- Add RLS policy: Only show approved canteens to non-admin users
DROP POLICY IF EXISTS "Anyone can view active canteens" ON public.canteens;
CREATE POLICY "Anyone can view approved canteens"
  ON public.canteens FOR SELECT
  USING (is_approved = true OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) OR auth.uid() = owner_id);

-- Add policy for admins to approve/reject canteens
DROP POLICY IF EXISTS "Admins can manage all canteens" ON public.canteens;
CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for owners to view their own canteen regardless of approval status
CREATE POLICY "Owners can view their own canteen"
  ON public.canteens FOR SELECT
  USING (auth.uid() = owner_id);


-- Add scheduled pickup/delivery time to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS scheduled_pickup_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'immediate' CHECK (order_type IN ('immediate', 'scheduled', 'recurring')),
ADD COLUMN IF NOT EXISTS preferred_time_slot TEXT,
ADD COLUMN IF NOT EXISTS estimated_preparation_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS dietary_notes TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_order_code TEXT;

-- Create order templates table for saved orders
CREATE TABLE IF NOT EXISTS public.order_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- Array of {item_id, quantity}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, canteen_id, name)
);

-- Create loyalty points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE, -- NULL for platform-wide points
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (total_redeemed >= 0),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, canteen_id)
);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dietary preferences table
CREATE TABLE IF NOT EXISTS public.user_dietary_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}', -- vegetarian, vegan, gluten_free, etc.
  preferred_cuisines TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_pickup_time ON public.orders(scheduled_pickup_time);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_templates_user_canteen ON public.order_templates(user_id, canteen_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON public.loyalty_transactions(user_id);

-- Enable RLS
ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dietary_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_templates
DROP POLICY IF EXISTS "Users can view their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can create their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can update their own order templates" ON public.order_templates;
DROP POLICY IF EXISTS "Users can delete their own order templates" ON public.order_templates;

CREATE POLICY "Users can view their own order templates"
  ON public.order_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own order templates"
  ON public.order_templates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL AND
    canteen_id IS NOT NULL
  );

CREATE POLICY "Users can update their own order templates"
  ON public.order_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own order templates"
  ON public.order_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for loyalty_points
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can manage loyalty points" ON public.loyalty_points;

CREATE POLICY "Users can view their own loyalty points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert/update loyalty points (via triggers)
CREATE POLICY "System can manage loyalty points"
  ON public.loyalty_points FOR ALL
  USING (false) -- This should be managed only by triggers, not direct API calls
  WITH CHECK (false);

-- RLS Policies for loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "No updates or deletes on loyalty transactions" ON public.loyalty_transactions;

CREATE POLICY "Users can view their own loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert transactions (via triggers)
CREATE POLICY "System can insert loyalty transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (false); -- Transactions only via triggers

CREATE POLICY "No updates or deletes on loyalty transactions"
  ON public.loyalty_transactions FOR ALL
  USING (false)
  WITH CHECK (false);

-- RLS Policies for dietary preferences
DROP POLICY IF EXISTS "Users can manage their own dietary preferences" ON public.user_dietary_preferences;

CREATE POLICY "Users can manage their own dietary preferences"
  ON public.user_dietary_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Function to automatically create loyalty points entry when user makes first order
CREATE OR REPLACE FUNCTION create_loyalty_points_on_first_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.loyalty_points (user_id, canteen_id, points, total_earned)
  VALUES (NEW.user_id, NEW.canteen_id, 0, 0)
  ON CONFLICT (user_id, canteen_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create loyalty points entry
DROP TRIGGER IF EXISTS create_loyalty_points_on_order ON public.orders;
CREATE TRIGGER create_loyalty_points_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_loyalty_points_on_first_order();

-- Function to calculate and award loyalty points after order completion
CREATE OR REPLACE FUNCTION award_loyalty_points_on_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  current_tier TEXT;
BEGIN
  -- Only award points when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate points (1 point per ₹10 spent, rounded down)
    points_to_award := FLOOR(NEW.total_amount / 10)::INTEGER;
    
    IF points_to_award > 0 THEN
      -- Update loyalty points
      INSERT INTO public.loyalty_points (user_id, canteen_id, points, total_earned)
      VALUES (NEW.user_id, NEW.canteen_id, points_to_award, points_to_award)
      ON CONFLICT (user_id, canteen_id) DO UPDATE
      SET points = loyalty_points.points + points_to_award,
          total_earned = loyalty_points.total_earned + points_to_award,
          tier = CASE
            WHEN loyalty_points.total_earned + points_to_award >= 10000 THEN 'platinum'
            WHEN loyalty_points.total_earned + points_to_award >= 5000 THEN 'gold'
            WHEN loyalty_points.total_earned + points_to_award >= 2000 THEN 'silver'
            ELSE 'bronze'
          END;
      
      -- Record transaction
      INSERT INTO public.loyalty_transactions (user_id, canteen_id, order_id, points, transaction_type, description)
      VALUES (NEW.user_id, NEW.canteen_id, NEW.id, points_to_award, 'earned', 
              'Points earned from order #' || NEW.token);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award points on order completion
DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON public.orders;
CREATE TRIGGER award_loyalty_points_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points_on_order_completion();


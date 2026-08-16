-- 031_remove_loyalty.sql
--
-- Removes the loyalty scheme.
--
-- It was awarding points on every completed order and advancing tiers from
-- bronze to platinum, but the points were only ever visible inside the cart,
-- at one canteen, at the moment of checkout — and there was no way to spend
-- them anywhere in the product. Students were accruing a currency that did
-- not exist.
--
-- A scheme with no redemption is worse than no scheme: it implies a promise
-- the product cannot keep. Removing it is the honest option; if loyalty comes
-- back later it should be designed with spending first.
--
-- Safe to re-run.

DROP TRIGGER IF EXISTS create_loyalty_points_on_order ON public.orders;
DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON public.orders;

DROP FUNCTION IF EXISTS public.create_loyalty_points_on_first_order() CASCADE;
DROP FUNCTION IF EXISTS public.award_loyalty_points_on_order_completion() CASCADE;

DROP TABLE IF EXISTS public.loyalty_transactions;
DROP TABLE IF EXISTS public.loyalty_points;

-- The feature switch has nothing left to switch.
ALTER TABLE public.platform_settings DROP COLUMN IF EXISTS loyalty_enabled;

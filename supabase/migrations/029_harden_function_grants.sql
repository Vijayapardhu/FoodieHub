-- 029_harden_function_grants.sql
--
-- PostgREST exposes every function in `public` as an RPC endpoint, trigger
-- functions included. Calling a trigger function directly usually errors out,
-- but there is no reason for them to be reachable at all.
--
-- The one that mattered: `track_promo_banner` was callable by `anon`, which
-- let a signed-out stranger inflate the impression count an advertiser is
-- billed against. Ordering requires a session, so nothing here needs anon.
--
-- Note that Postgres grants EXECUTE to PUBLIC on every new function, and
-- PUBLIC includes anon — revoking the named role alone leaves that blanket
-- grant in place and changes nothing. The revoke has to start from PUBLIC.
--
-- Safe to re-run.

REVOKE EXECUTE ON FUNCTION public.track_promo_banner(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_promo_banner(UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.vapid_public_key() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vapid_public_key() TO authenticated, service_role;

-- Trigger functions: reachable by the triggers that own them, nobody else.
REVOKE EXECUTE ON FUNCTION public.dispatch_push_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_promo_banner_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.raise_order_prep_estimate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_order_prep_estimate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_customer_on_decline() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_canteen_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_item_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_review_public_code() FROM PUBLIC, anon, authenticated;

-- A mutable search_path lets a caller who can create objects shadow the
-- tables these resolve against.
ALTER FUNCTION public.slugify(TEXT) SET search_path = public;
ALTER FUNCTION public.short_code(INTEGER) SET search_path = public;
ALTER FUNCTION public.set_canteen_slug() SET search_path = public;
ALTER FUNCTION public.set_item_slug() SET search_path = public;
ALTER FUNCTION public.set_review_public_code() SET search_path = public;
ALTER FUNCTION public.promo_placement_multiplier(TEXT) SET search_path = public;

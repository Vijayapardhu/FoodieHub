-- 040_lock_down_wait_functions.sql
--
-- 039's revokes were true and useless.
--
-- Supabase ships `alter default privileges in schema public grant execute on
-- functions to anon, authenticated, service_role`. So revoking from PUBLIC
-- removed a grant the roles were not relying on, and both functions stayed
-- callable by anon — including quote_prep_minutes, which is SECURITY DEFINER
-- and counts orders across a canteen regardless of RLS.
--
-- The same trap caught track_promo_banner earlier: a revoke that runs without
-- error is not evidence the privilege is gone. Verified after applying with
-- has_function_privilege for both roles.
--
-- Applied via the Supabase MCP.

revoke execute on function public.quote_prep_minutes(uuid, integer, timestamptz)
  from anon, authenticated;
revoke execute on function public.preview_order_wait(uuid, uuid[]) from anon;

grant execute on function public.preview_order_wait(uuid, uuid[]) to authenticated;

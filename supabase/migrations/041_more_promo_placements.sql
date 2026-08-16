-- 041_more_promo_placements.sql
--
-- Four more slots the platform can sell.
--
-- The inventory was four screens, three of which a student only sees once
-- they have already decided (cart, orders list). The places where somebody is
-- still choosing what to eat — a canteen's menu, a dish page — carried no
-- advertising at all, and neither did the one screen with a genuinely captive
-- reader: the order they are standing around waiting for.
--
-- Applied via the Supabase MCP.

alter table public.promo_banners
  drop constraint if exists promo_banners_placement_check;

alter table public.promo_banners
  add constraint promo_banners_placement_check
  check (placement in (
    'home_hero',
    'home_inline',
    'orders',
    'cart',
    'order_detail',
    'canteen_menu',
    'item_detail',
    'search_empty'
  ));

-- Priced by attention rather than by screen count. order_detail is worth more
-- than the orders list because it is re-read every couple of minutes by
-- somebody with nothing else to do; search_empty is worth least because it
-- only ever appears after the platform has failed to find what was asked for.
--
-- These numbers must stay in step with PROMO_PLACEMENTS in
-- lib/utils/promo-banners.ts, which is what the owner is quoted.
create or replace function public.promo_placement_multiplier(placement text)
returns numeric as $$
  select case placement
    when 'home_hero'     then 1.0
    when 'order_detail'  then 0.7
    when 'home_inline'   then 0.5
    when 'orders'        then 0.5
    when 'cart'          then 0.5
    when 'canteen_menu'  then 0.4
    when 'item_detail'   then 0.35
    when 'search_empty'  then 0.3
    else 0.5
  end;
$$ language sql immutable;

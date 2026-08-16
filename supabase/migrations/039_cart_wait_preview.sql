-- 039_cart_wait_preview.sql
--
-- Lets the cart quote a wait before anyone commits.
--
-- The queue arithmetic from 035 lived inside the order_items trigger, where
-- only an order that already exists could reach it. So the one screen where
-- "how long will this take?" actually changes a decision — the cart, before
-- the tap — was the one screen that could not answer it. Reimplementing the
-- formula in TypeScript would have left two copies of a number that is
-- certain to be tuned again, and they would disagree the first time it was.
--
-- `quote_prep_minutes` is now the single source: the trigger calls it, and
-- `preview_order_wait` exposes it to the cart for a prospective order.
--
-- Applied via the Supabase MCP.

create or replace function public.quote_prep_minutes(
  p_canteen_id uuid,
  p_slowest_dish integer,
  p_before timestamptz default now()
) returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  c record;
  ahead integer;
  base integer;
begin
  select prep_minutes, concurrent_orders into c
  from public.canteens where id = p_canteen_id;

  if not found then
    return null;
  end if;

  -- The slowest dish sets the floor; the canteen's own figure is only a
  -- fallback for menus that carry no per-dish times.
  base := coalesce(p_slowest_dish, c.prep_minutes, 20);

  select count(*) into ahead
  from public.orders
  where canteen_id = p_canteen_id
    and status in ('pending', 'confirmed', 'preparing')
    and scheduled_pickup_time is null
    and created_at < p_before;

  return least(
    base + floor(ahead::numeric / greatest(coalesce(c.concurrent_orders, 1), 1))
           * coalesce(c.prep_minutes, 20),
    120
  )::integer;
end;
$$;

-- What the cart shows before anyone commits. Returns minutes for a
-- prospective order of these dishes, quoted against the queue as it stands.
create or replace function public.preview_order_wait(
  p_canteen_id uuid,
  p_item_ids uuid[]
) returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.quote_prep_minutes(p_canteen_id, max(i.prep_minutes), now())
  from public.items i
  where i.id = any(p_item_ids)
    and i.canteen_id = p_canteen_id
    and i.is_available;
$$;

-- Two separate grants have to be undone here, and missing either leaves the
-- function open: Postgres grants EXECUTE to PUBLIC on every new function, and
-- Supabase adds default privileges granting it to anon and authenticated on
-- top. Revoking from PUBLIC alone looks right and changes nothing. See 040.
revoke all on function public.quote_prep_minutes(uuid, integer, timestamptz) from public;
revoke all on function public.preview_order_wait(uuid, uuid[]) from public;
revoke execute on function public.quote_prep_minutes(uuid, integer, timestamptz)
  from anon, authenticated;
revoke execute on function public.preview_order_wait(uuid, uuid[]) from anon;

grant execute on function public.preview_order_wait(uuid, uuid[]) to authenticated;

-- quote_prep_minutes stays unreachable from the client: it counts across every
-- order in a canteen and bypasses RLS to do it, so the RPC above is the only
-- door it needs. The trigger still reaches it by running as its owner.

create or replace function public.raise_order_prep_estimate()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  slowest_dish integer;
  o record;
begin
  select max(i.prep_minutes) into slowest_dish
  from public.order_items oi
  join public.items i on i.id = oi.item_id
  where oi.order_id = new.order_id;

  select o2.canteen_id, o2.created_at, o2.status, o2.scheduled_pickup_time,
         c.prep_minutes
  into o
  from public.orders o2
  join public.canteens c on c.id = o2.canteen_id
  where o2.id = new.order_id;

  if not found or o.status <> 'pending' then
    return new;
  end if;

  -- A booking is quoted by its slot, not by today's queue.
  if o.scheduled_pickup_time is not null then
    update public.orders
    set estimated_preparation_time = coalesce(slowest_dish, o.prep_minutes, 20)
    where id = new.order_id and status = 'pending';
    return new;
  end if;

  update public.orders
  set estimated_preparation_time =
    public.quote_prep_minutes(o.canteen_id, slowest_dish, o.created_at)
  where id = new.order_id
    and status = 'pending';

  return new;
end;
$$;

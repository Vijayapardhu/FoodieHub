-- 045_server_side_order_tokens.sql
--
-- The pickup token is what a student is called by at the counter, and it was
-- being invented in the browser.
--
-- generateToken() picked six random characters and the column is globally
-- unique, so a collision is rare but not impossible — and it fails exactly
-- where it hurts most. A cart spanning two canteens inserts two orders in a
-- loop, so a clash aborts checkout after the first order already exists and
-- its lines have already been cleared from the cart: the student is told the
-- order failed while one of them is sitting in a kitchen.
--
-- Generating it here removes the race. The loop retries against the live
-- table until it finds a free code, inside the same statement that inserts
-- the row. The client no longer sends a token at all.
--
-- Verified after applying: two consecutive inserts received distinct
-- six-character tokens with no token supplied.
--
-- Applied via the Supabase MCP.

create or replace function public.set_order_token()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  candidate text;
begin
  if new.token is not null and new.token <> '' then
    return new;
  end if;

  loop
    candidate := upper(public.short_code(6));
    exit when not exists (
      select 1 from public.orders where token = candidate
    );
  end loop;

  new.token := candidate;
  return new;
end;
$$;

drop trigger if exists orders_set_token on public.orders;

create trigger orders_set_token
  before insert on public.orders
  for each row
  execute function public.set_order_token();

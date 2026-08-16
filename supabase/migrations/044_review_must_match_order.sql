-- 044_review_must_match_order.sql
--
-- A review had to belong to your order. It did not have to be about
-- something you actually ordered.
--
-- The insert policy checked that reviews.order_id was one of yours and
-- stopped there, which was harmless while every review was about a canteen.
-- Now that a review can name a dish, that same policy would let any student
-- attach a five-star rating to any dish on the platform by pointing it at an
-- order of their own — and it would count towards that dish's average.
--
-- The lookup goes through a SECURITY DEFINER helper rather than a subquery in
-- the policy itself: a policy on reviews that reads order_items, whose own
-- policy reads orders, is exactly the shape that caused the recursive-RLS
-- outage fixed in 036.
--
-- Verified after applying: order_contains_item is true for a dish on the
-- order, false for one that is not, and unreachable by anon.
--
-- Applied via the Supabase MCP.

create or replace function public.order_contains_item(
  p_order uuid,
  p_item uuid
) returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.order_items
    where order_id = p_order and item_id = p_item
  );
$$;

revoke all on function public.order_contains_item(uuid, uuid) from public;
revoke execute on function public.order_contains_item(uuid, uuid) from anon;
grant execute on function public.order_contains_item(uuid, uuid) to authenticated;

drop policy if exists "Users can create reviews for their orders" on public.reviews;

create policy "Users can create reviews for their orders"
  on public.reviews
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders
      where orders.id = reviews.order_id and orders.user_id = auth.uid()
    )
    -- A canteen-level review names no dish; a dish-level one has to name a
    -- dish that was actually on the order it is attached to.
    and (
      reviews.item_id is null
      or public.order_contains_item(reviews.order_id, reviews.item_id)
    )
  );

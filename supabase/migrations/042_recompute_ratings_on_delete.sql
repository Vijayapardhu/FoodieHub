-- 042_recompute_ratings_on_delete.sql
--
-- Deleting a review left its rating behind.
--
-- Both recompute triggers were already firing on DELETE, but their bodies
-- read NEW.canteen_id / NEW.item_id, and NEW is not assigned on a delete. The
-- update therefore ran as `where id = null`, matched no rows, and reported
-- success — so a student could delete a review while the average and the
-- count it had contributed to stayed exactly where they were. Every delete
-- since the feature shipped has inflated a rating.
--
-- Measured on the live database before the change: inserting a review moved a
-- canteen from 1 to 2 reviews, and deleting that same review left it at 2.
-- After: 0 -> 1 -> 0 for a dish, and the canteen figure tracks its rows.
--
-- The same hole applies to an UPDATE that moves a review from one canteen or
-- dish to another, so both the old and the new target are recomputed.
--
-- Applied via the Supabase MCP.

create or replace function public.update_canteen_rating()
returns trigger
language plpgsql
as $$
declare
  targets uuid[] := '{}';
  target uuid;
begin
  if tg_op <> 'DELETE' and new.canteen_id is not null then
    targets := array_append(targets, new.canteen_id);
  end if;
  if tg_op <> 'INSERT' and old.canteen_id is not null then
    targets := array_append(targets, old.canteen_id);
  end if;

  foreach target in array targets loop
    update public.canteens
    set rating = (
          select coalesce(avg(rating), 0) from public.reviews
          where canteen_id = target
        ),
        total_reviews = (
          select count(*) from public.reviews where canteen_id = target
        )
    where id = target;
  end loop;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.update_item_rating()
returns trigger
language plpgsql
as $$
declare
  targets uuid[] := '{}';
  target uuid;
begin
  if tg_op <> 'DELETE' and new.item_id is not null then
    targets := array_append(targets, new.item_id);
  end if;
  if tg_op <> 'INSERT' and old.item_id is not null then
    targets := array_append(targets, old.item_id);
  end if;

  foreach target in array targets loop
    update public.items
    set rating = (
          select coalesce(avg(rating), 0) from public.reviews
          where item_id = target
        ),
        total_reviews = (
          select count(*) from public.reviews where item_id = target
        )
    where id = target;
  end loop;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- One-off resync. 034 reset the stored ratings to zero to clear the invented
-- ones, but it zeroed the columns rather than recomputing them from the rows,
-- so a canteen carrying a genuine 4-star review was still displaying as "New".
-- Cheap and safe to re-run.
update public.canteens c
set rating = (
      select coalesce(avg(r.rating), 0) from public.reviews r
      where r.canteen_id = c.id
    ),
    total_reviews = (
      select count(*) from public.reviews r where r.canteen_id = c.id
    );

update public.items i
set rating = (
      select coalesce(avg(r.rating), 0) from public.reviews r
      where r.item_id = i.id
    ),
    total_reviews = (
      select count(*) from public.reviews r where r.item_id = i.id
    );

-- 046_group_order_contributions.sql
--
-- Contributions to a group order could be added, and nothing else.
--
-- Three things were missing. order_items.added_by existed but was never
-- written by anything, so the "group members can see their own lines" policy
-- — which matches on added_by — could never match a line the contributor had
-- just added. There were no update or delete policies at all, so a friend who
-- tapped the wrong dish had no way back. And nothing marked a contribution as
-- final, so the host had no way to tell whether anyone was still deciding.
--
-- A line is now owned by whoever added it, editable by them until they say
-- they are done, and frozen afterwards.
--
-- Applied via the Supabase MCP.

-- Fill in the author. A column default cannot do this: auth.uid() has to be
-- read at insert time, in the caller's context.
create or replace function public.set_order_item_author()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.added_by is null then
    new.added_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_set_author on public.order_items;

create trigger order_items_set_author
  before insert on public.order_items
  for each row
  execute function public.set_order_item_author();

-- When the contributor called it done. Null means still deciding.
alter table public.order_items
  add column if not exists locked_at timestamptz;

drop policy if exists "Group members can edit their own unlocked lines" on public.order_items;
create policy "Group members can edit their own unlocked lines"
  on public.order_items
  for update
  using (
    added_by = auth.uid()
    and locked_at is null
    and public.is_open_group_order(order_id)
  )
  with check (added_by = auth.uid());

drop policy if exists "Group members can remove their own unlocked lines" on public.order_items;
create policy "Group members can remove their own unlocked lines"
  on public.order_items
  for delete
  using (
    added_by = auth.uid()
    and locked_at is null
    and public.is_open_group_order(order_id)
  );

-- Everything on the order, with who added it, for anyone taking part.
--
-- SECURITY DEFINER so a contributor can see the other names without the users
-- table being opened up, and so this cannot recurse back through the
-- order_items policies the way 036 did.
create or replace function public.group_order_lines(p_order uuid)
returns table (
  line_id uuid,
  item_name text,
  quantity integer,
  price numeric,
  added_by uuid,
  added_by_name text,
  locked boolean
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    oi.id,
    i.name,
    oi.quantity,
    oi.price,
    oi.added_by,
    coalesce(split_part(u.full_name, ' ', 1), 'Someone'),
    oi.locked_at is not null
  from public.order_items oi
  join public.items i on i.id = oi.item_id
  left join public.users u on u.id = oi.added_by
  where oi.order_id = p_order
    and (
      public.is_group_contributor(p_order)
      or exists (
        select 1 from public.orders o
        where o.id = p_order and o.user_id = auth.uid()
      )
    )
  order by oi.created_at;
$$;

-- Calling it done. Everything this person added stops being editable.
create or replace function public.lock_my_group_lines(p_order uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  affected integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in.' using errcode = 'check_violation';
  end if;

  update public.order_items
  set locked_at = now()
  where order_id = p_order
    and added_by = auth.uid()
    and locked_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Supabase's default privileges hand every new public function to anon and
-- authenticated, so revoking from PUBLIC alone would leave both open (see 040).
revoke all on function public.group_order_lines(uuid) from public;
revoke all on function public.lock_my_group_lines(uuid) from public;
revoke execute on function public.group_order_lines(uuid) from anon;
revoke execute on function public.lock_my_group_lines(uuid) from anon;
grant execute on function public.group_order_lines(uuid) to authenticated;
grant execute on function public.lock_my_group_lines(uuid) to authenticated;

-- 033_order_status_no_show.sql
--
-- A no-show is not a cancellation. Nobody changed their mind: the food was
-- cooked, the token was never presented, and it went in the bin. Recording it
-- as 'cancelled' loses the only fact that matters about it.
--
-- Applied on its own because Postgres will not let a new enum value be used
-- in the same transaction that creates it.

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'no_show';

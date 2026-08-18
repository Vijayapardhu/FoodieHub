-- 050_delivery_block_restrict.sql
--
-- 049 gave orders.delivery_block_id ON DELETE SET NULL, which quietly blanks
-- "delivered to" on every past order the moment the block is deleted — the
-- kind of data loss nobody notices until the exact bill they needed it on.
-- RESTRICT instead: a block that's ever been ordered to can be paused
-- (is_active = false, hidden from checkout) but not deleted. A block that
-- was never used can still be removed outright.
--
-- Safe to re-run.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_delivery_block_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_delivery_block_id_fkey
  FOREIGN KEY (delivery_block_id) REFERENCES public.delivery_blocks(id) ON DELETE RESTRICT;

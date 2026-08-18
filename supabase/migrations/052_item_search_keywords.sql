-- 052_item_search_keywords.sql
--
-- Search only ever matched a dish's own name, description, or its canteen's
-- name — nothing catches the words a student actually searches with when
-- neither the dish nor the description happens to use them (a "Masala Dosa"
-- never turns up for "south indian" or "crepe" unless the owner happened to
-- write that into the description). This lets an owner name the dish's
-- synonyms and cuisine explicitly, and search checks it alongside
-- everything else.
--
-- Safe to re-run.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS search_keywords TEXT;

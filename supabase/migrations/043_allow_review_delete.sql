-- 043_allow_review_delete.sql
--
-- A student could not actually delete their own review.
--
-- reviews had policies for select, insert and update, and none for delete —
-- so the "Delete review" button ran a statement that matched zero rows under
-- RLS, returned no error, and showed "Review deleted". The review stayed.
-- A delete that removes nothing is indistinguishable from one that succeeds
-- unless you ask for the affected rows back, which the client did not.
--
-- Retracting what you said about somebody's food carries no time limit here.
-- The 24-hour restriction on editing stays as it was: rewriting the words
-- under a reply the owner has already published is a different act from
-- withdrawing them.
--
-- Applied via the Supabase MCP.

drop policy if exists "Users can delete their own reviews" on public.reviews;

create policy "Users can delete their own reviews"
  on public.reviews
  for delete
  using (auth.uid() = user_id);

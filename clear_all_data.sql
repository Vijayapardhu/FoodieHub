-- ⚠️ WARNING: This will delete ALL data from all tables!
-- This is a destructive operation. Use with caution.
-- 
-- To run this:
-- 1. Copy the SQL below
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run
-- 
-- OR use Supabase CLI:
-- supabase db execute --file clear_all_data.sql

-- Disable triggers temporarily to speed up deletion
SET session_replication_role = 'replica';

-- Delete in order to respect foreign key constraints (child tables first)

-- Delete order-related data
DELETE FROM public.order_items;
DELETE FROM public.order_templates;
DELETE FROM public.orders;

-- Delete review and feedback data
DELETE FROM public.reviews;

-- Delete loyalty program data
DELETE FROM public.loyalty_transactions;
DELETE FROM public.loyalty_points;

-- Delete favorites
DELETE FROM public.favorites;

-- Delete notifications
DELETE FROM public.notifications;

-- Delete offers/promotions
DELETE FROM public.offers;

-- Delete menu items
DELETE FROM public.items;

-- Delete canteens
DELETE FROM public.canteens;

-- Delete user profiles (this will cascade from auth.users if needed)
DELETE FROM public.users;

-- Delete categories (can be kept if you want, but clearing for complete reset)
DELETE FROM public.categories;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM public.users) as users,
  (SELECT COUNT(*) FROM public.canteens) as canteens,
  (SELECT COUNT(*) FROM public.items) as items,
  (SELECT COUNT(*) FROM public.orders) as orders,
  (SELECT COUNT(*) FROM public.order_items) as order_items,
  (SELECT COUNT(*) FROM public.reviews) as reviews,
  (SELECT COUNT(*) FROM public.categories) as categories,
  (SELECT COUNT(*) FROM public.favorites) as favorites,
  (SELECT COUNT(*) FROM public.notifications) as notifications,
  (SELECT COUNT(*) FROM public.offers) as offers;


-- 021_seed_image_urls.sql
-- Points the seeded menu and canteens at the demo photographs in public/seed/
-- (fetched by scripts/fetch-seed-images.mjs; credits in public/seed/ATTRIBUTION.md
-- and surfaced in-app at /credits).
--
-- Paths are app-relative rather than Supabase Storage URLs: these ship with
-- the repo, so the demo works before any bucket exists. Real owner uploads
-- go to the buckets created in 022.
--
-- Matched on name so it survives a re-seed with fresh UUIDs. Idempotent.

UPDATE items SET image_url = '/seed/cheese-maggi.jpg' WHERE name = 'Cheese Maggi';
UPDATE items SET image_url = '/seed/chicken-biryani.jpg' WHERE name = 'Chicken Biryani';
UPDATE items SET image_url = '/seed/cold-coffee.jpg' WHERE name = 'Cold Coffee';
UPDATE items SET image_url = '/seed/dal-tadka.jpg' WHERE name = 'Dal Tadka';
UPDATE items SET image_url = '/seed/egg-puff.jpg' WHERE name = 'Egg Puff';
UPDATE items SET image_url = '/seed/filter-coffee.jpg' WHERE name = 'Filter Coffee';
UPDATE items SET image_url = '/seed/fresh-lime-soda.jpg' WHERE name = 'Fresh Lime Soda';
UPDATE items SET image_url = '/seed/grilled-sandwich.jpg' WHERE name = 'Grilled Sandwich';
UPDATE items SET image_url = '/seed/idli-vada-combo.jpg' WHERE name = 'Idli Vada Combo';
UPDATE items SET image_url = '/seed/masala-chai.jpg' WHERE name = 'Masala Chai';
UPDATE items SET image_url = '/seed/masala-dosa.jpg' WHERE name = 'Masala Dosa';
UPDATE items SET image_url = '/seed/midnight-chai.jpg' WHERE name = 'Midnight Chai';
UPDATE items SET image_url = '/seed/north-thali.jpg' WHERE name = 'North Thali';
UPDATE items SET image_url = '/seed/paneer-butter-masala.jpg' WHERE name = 'Paneer Butter Masala';
UPDATE items SET image_url = '/seed/samosa.jpg' WHERE name = 'Samosa (2 pcs)';
UPDATE items SET image_url = '/seed/south-combo.jpg' WHERE name = 'South Combo';
UPDATE items SET image_url = '/seed/veg-puff.jpg' WHERE name = 'Veg Puff';

UPDATE canteens SET logo_url = '/seed/canteen-central.jpg', banner_url = '/seed/canteen-central.jpg' WHERE name = 'Central Canteen';
UPDATE canteens SET logo_url = '/seed/canteen-hostel.jpg', banner_url = '/seed/canteen-hostel.jpg' WHERE name = 'Hostel Night Canteen';

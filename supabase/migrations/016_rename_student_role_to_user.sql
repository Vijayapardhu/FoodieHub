-- Rename student role to user
-- This migration properly handles enum value changes in PostgreSQL
-- We need to drop and recreate policies that depend on the role column

-- Step 1: Drop all policies that reference the role column
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage all canteens" ON public.canteens;
DROP POLICY IF EXISTS "Anyone can view approved canteens" ON public.canteens;
DROP POLICY IF EXISTS "Admins can manage all items" ON public.items;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view and manage all offers" ON public.offers;

-- Also drop policies from other migrations that might use role
DROP POLICY IF EXISTS "Owners can view their own canteen" ON public.canteens;
DROP POLICY IF EXISTS "System can manage loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_transactions;

-- Step 2: Create a new enum type with 'user' instead of 'student'
CREATE TYPE user_role_new AS ENUM ('user', 'canteen_owner', 'admin');

-- Step 3: Drop the default value temporarily (it references the old enum type)
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT;

-- Step 4: Change the column type to text temporarily and map 'student' to 'user'
ALTER TABLE public.users 
  ALTER COLUMN role TYPE text USING 
    CASE 
      WHEN role::text = 'student' THEN 'user'
      ELSE role::text
    END;

-- Step 5: Change the column type to the new enum
ALTER TABLE public.users 
  ALTER COLUMN role TYPE user_role_new USING role::user_role_new;

-- Step 6: Set the new default value
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'user'::user_role_new;

-- Step 7: Drop the old enum (only if no other tables use it)
DO $$
DECLARE
  enum_used_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enum_used_count
  FROM information_schema.columns
  WHERE udt_name = 'user_role' AND table_schema = 'public' AND table_name != 'users';
  
  IF enum_used_count = 0 THEN
    DROP TYPE user_role CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If drop fails, continue
    NULL;
END $$;

-- Step 8: Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 8.5: Ensure the is_admin helper function exists (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Step 9: Recreate all policies that reference the role column (using is_admin function to avoid recursion)
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all canteens"
  ON public.canteens FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view approved canteens"
  ON public.canteens FOR SELECT
  USING (is_approved = true OR public.is_admin(auth.uid()) OR auth.uid() = owner_id);

CREATE POLICY "Owners can view their own canteen"
  ON public.canteens FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all items"
  ON public.items FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view and manage all offers"
  ON public.offers FOR ALL
  USING (public.is_admin(auth.uid()));

-- Step 10: Update the trigger function to use 'user' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  user_role_val public.user_role;
  user_full_name TEXT;
BEGIN
  -- Log entry for debugging
  RAISE LOG 'handle_new_user triggered for ID: %, Email: %', NEW.id, NEW.email;
  RAISE LOG 'Raw metadata: %', NEW.raw_user_meta_data;

  -- Get role from metadata
  BEGIN
    user_role_val := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'user'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
     RAISE LOG 'Error casting role: %', SQLERRM;
     BEGIN 
        user_role_val := 'student'::public.user_role;
     EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Critical error: role fallback failed.';
     END;
  END;

  RAISE LOG 'Determined Role: %', user_role_val;

  -- Prevent non-admin users from registering as admin
  IF user_role_val = 'admin' THEN
    user_role_val := 'user';
  END IF;

  -- Get full name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );
  
  RAISE LOG 'Determined Full Name: %', user_full_name;

  -- Insert logic with exception handling
  BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role, phone_number)
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      NEW.raw_user_meta_data->>'avatar_url',
      user_role_val,
      NEW.raw_user_meta_data->>'phone_number'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role = COALESCE(users.role, EXCLUDED.role),
      phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
      updated_at = NOW();
      
     RAISE LOG 'User profile inserted successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting user profile: %', SQLERRM;
    RAISE EXCEPTION 'Database error saving new user (Detail: %)', SQLERRM;
  END;

  RETURN NEW;
END;
$func$;

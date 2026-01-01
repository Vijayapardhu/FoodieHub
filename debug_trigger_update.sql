-- Debug Script with safe delimiters and search_path fix
-- Ensures the function can find the public.user_role type

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

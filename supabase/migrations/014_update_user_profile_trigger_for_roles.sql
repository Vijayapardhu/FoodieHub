-- Update trigger to handle roles from metadata and prevent admin self-registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
  user_full_name TEXT;
BEGIN
  -- Get role from metadata, default to 'user'
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'
  );

  -- Prevent non-admin users from registering as admin
  -- Only allow admin role if explicitly set by an existing admin
  IF user_role_val = 'admin' THEN
    -- Check if there's an existing admin who approved this
    -- For now, default to user and require admin approval
    user_role_val := 'student';
  END IF;

  -- Get full name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  -- Insert user profile
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
    role = COALESCE(users.role, EXCLUDED.role), -- Don't override existing role
    phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 054_signup_phone_number.sql
--
-- handle_new_user() (migration 003) reads full_name out of the signup
-- metadata but never phone_number, even though the sign-up form has always
-- collected one and passed it in options.data alongside full_name. The
-- client tried to fill the gap itself with a follow-up UPDATE right after
-- signUp() — which only works if that call already has a live session to
-- act as. With email confirmation on, signUp() returns no session until the
-- link is clicked, so that update silently failed under RLS ("update your
-- own row" requires auth.uid(), and there was no uid yet) and the phone
-- number was simply never saved. The trigger runs as the row is created, no
-- session required, so this is where it belongs.
--
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone_number, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

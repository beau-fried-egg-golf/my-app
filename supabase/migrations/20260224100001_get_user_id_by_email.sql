-- Security definer function to look up auth.users.id by email.
-- Used by edge functions to find profiles by email (e.g. Stripe webhook matching).
CREATE OR REPLACE FUNCTION get_user_id_by_email(lookup_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_id UUID;
BEGIN
  SELECT id INTO found_id FROM auth.users WHERE email = lookup_email LIMIT 1;
  RETURN found_id;
END;
$$;

-- Migration 006 — RPC: get_allowed_emails
-- Returns emails of all profiles that have dashboard access (admin, gestor, staff).
-- SECURITY DEFINER so it works even when the caller's RLS policies
-- would not allow a full table scan.
-- Used by AuthContext on init to build the in-memory whitelist.

CREATE OR REPLACE FUNCTION public.get_allowed_emails()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT LOWER(TRIM(email))
    FROM profiles
    WHERE email IS NOT NULL
      AND role IN ('admin', 'gestor', 'staff')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_allowed_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_allowed_emails() TO anon;

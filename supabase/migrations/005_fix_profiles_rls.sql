-- Allow every authenticated user to read their OWN profile row.
-- Previously missing, causing fetchProfile to fail for non-admin users
-- (the RPC fallback in AuthContext handles this in the meantime).
CREATE POLICY IF NOT EXISTS users_read_own_profile
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Also allow users to update their own gym_ids (needed for onboarding)
CREATE POLICY IF NOT EXISTS users_update_own_gym_ids
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

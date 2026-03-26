-- Add email to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users
UPDATE profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

-- Security definer function to check admin role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Security definer to get caller's gym_ids
CREATE OR REPLACE FUNCTION public.current_user_gym_ids()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT gym_ids FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_gym_ids() TO authenticated;

-- Admins can read ALL profiles
DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT USING (current_user_role() = 'admin');

-- Gestors can read profiles of users in their gyms (team members)
DROP POLICY IF EXISTS "gestors_read_team_profiles" ON profiles;
CREATE POLICY "gestors_read_team_profiles" ON profiles
  FOR SELECT USING (
    current_user_role() IN ('admin', 'gestor')
    AND gym_ids && current_user_gym_ids()
  );

-- Admins can update any profile (role changes, assignments)
DROP POLICY IF EXISTS "admins_update_profiles" ON profiles;
CREATE POLICY "admins_update_profiles" ON profiles
  FOR UPDATE USING (current_user_role() = 'admin');

-- Gestors can update gym_ids of profiles in their gyms (revoke access)
DROP POLICY IF EXISTS "gestors_update_team_gym_ids" ON profiles;
CREATE POLICY "gestors_update_team_gym_ids" ON profiles
  FOR UPDATE USING (
    current_user_role() IN ('admin', 'gestor')
    AND gym_ids && current_user_gym_ids()
  );

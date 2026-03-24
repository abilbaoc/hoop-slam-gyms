-- ════════════════════════════════════════
-- Migration 001: New Scope
-- Adds court properties, club_members, court_slots
-- ════════════════════════════════════════

-- ── New columns in courts ──

ALTER TABLE courts ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE courts ADD COLUMN IF NOT EXISTS opening_time time DEFAULT '09:00';
ALTER TABLE courts ADD COLUMN IF NOT EXISTS closing_time time DEFAULT '21:00';
ALTER TABLE courts ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS match_duration_minutes int NOT NULL DEFAULT 30;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS slot_duration_minutes int NOT NULL DEFAULT 30;

-- ── club_members ──

CREATE TABLE IF NOT EXISTS club_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  nickname text NOT NULL,
  email text,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_gym ON club_members(gym_id);

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read club members of their gyms" ON club_members
  FOR SELECT USING (
    gym_id::text = ANY(
      (SELECT gym_ids FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Gestors can manage club members" ON club_members
  FOR ALL USING (
    gym_id::text = ANY(
      (SELECT gym_ids FROM profiles WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- ── court_slots ──

CREATE TABLE IF NOT EXISTS court_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'blocked')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_court_slots_court_date ON court_slots(court_id, date);

ALTER TABLE court_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read court slots of their gyms" ON court_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courts c
      WHERE c.id = court_id
        AND c.gym_id::text = ANY(
          (SELECT gym_ids FROM profiles WHERE id = auth.uid())
        )
    )
  );

CREATE POLICY "Gestors can manage court slots" ON court_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courts c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = court_id
        AND c.gym_id::text = ANY(p.gym_ids)
        AND p.role IN ('admin', 'gestor', 'staff')
    )
  );

-- ── FK: reservations -> court_slots ──

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES court_slots(id);

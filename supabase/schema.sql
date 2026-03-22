-- Hoop Slam B2B - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- ════════════════════════════════════════
-- PROFILES (linked to auth.users)
-- ════════════════════════════════════════
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'gestor' check (role in ('admin', 'gestor', 'staff')),
  gym_ids text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'gestor'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ════════════════════════════════════════
-- GYMS
-- ════════════════════════════════════════
create table if not exists gyms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  address text not null,
  city text not null,
  timezone text not null default 'Europe/Madrid',
  phone text default '',
  email text default '',
  logo_url text,
  opening_hours jsonb not null default '{
    "weekdayOpen": "08:00",
    "weekdayClose": "22:00",
    "weekendOpen": "09:00",
    "weekendClose": "21:00"
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ════════════════════════════════════════
-- COURTS
-- ════════════════════════════════════════
create table if not exists courts (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) on delete cascade not null,
  name text not null,
  location text default '',
  status text not null default 'online' check (status in ('online', 'offline', 'maintenance')),
  sensor_status text not null default 'ok' check (sensor_status in ('ok', 'warning', 'error')),
  firmware_version text,
  last_heartbeat timestamptz,
  installed_date date default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_courts_gym_id on courts(gym_id);

-- ════════════════════════════════════════
-- MATCHES
-- ════════════════════════════════════════
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  court_id uuid references courts(id) on delete cascade not null,
  gym_id uuid references gyms(id) on delete cascade not null,
  format text not null check (format in ('1v1', '2v2', '3v3')),
  score_a int not null default 0,
  score_b int not null default 0,
  duration int not null default 0,
  player_count int not null default 2,
  started_at timestamptz not null,
  ended_at timestamptz not null
);

create index if not exists idx_matches_gym_started on matches(gym_id, started_at desc);

-- ════════════════════════════════════════
-- RESERVATIONS
-- ════════════════════════════════════════
create table if not exists reservations (
  id uuid default gen_random_uuid() primary key,
  court_id uuid references courts(id) on delete cascade not null,
  gym_id uuid references gyms(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  player_name text not null,
  format text default '1v1',
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'blocked')),
  created_at timestamptz default now()
);

create index if not exists idx_reservations_gym_date on reservations(gym_id, date, court_id);

-- ════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) on delete cascade not null,
  type text not null check (type in ('maintenance_alert', 'reservation_confirmation', 'system_alert', 'low_occupancy_warning')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_gym_created on notifications(gym_id, created_at desc);

-- ════════════════════════════════════════
-- AUDIT LOG
-- ════════════════════════════════════════
create table if not exists audit_log (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null check (action in ('create', 'update', 'delete')),
  entity text not null,
  entity_id text not null,
  description text not null,
  created_at timestamptz default now()
);

create index if not exists idx_audit_gym_created on audit_log(gym_id, created_at desc);

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════
alter table profiles enable row level security;
alter table gyms enable row level security;
alter table courts enable row level security;
alter table matches enable row level security;
alter table reservations enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Gyms: users can read gyms they belong to
create policy "Users can read their gyms" on gyms for select using (
  id::text = any(
    (select gym_ids from profiles where id = auth.uid())
  )
);

-- Gyms: gestors can insert (for onboarding)
create policy "Gestors can create gyms" on gyms for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gestor'))
);

-- Courts: inherit from gym access
create policy "Users can read courts of their gyms" on courts for select using (
  gym_id::text = any(
    (select gym_ids from profiles where id = auth.uid())
  )
);

-- Notifications: users can read/update notifications of their gyms
create policy "Users can read notifications" on notifications for select using (
  gym_id::text = any(
    (select gym_ids from profiles where id = auth.uid())
  )
);

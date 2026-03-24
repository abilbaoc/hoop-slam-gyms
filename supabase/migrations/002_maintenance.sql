-- ════════════════════════════════════════
-- MIGRATION 002: Maintenance Tickets
-- Hoop Slam B2B - Sistema de incidencias gym → equipo Hoop
-- ════════════════════════════════════════

create type ticket_priority    as enum ('low', 'medium', 'high', 'critical');
create type ticket_status      as enum ('open', 'in_progress', 'resolved', 'closed');
create type hoop_status        as enum ('pending', 'acknowledged', 'in_progress', 'resolved');
create type maintenance_action as enum ('created', 'status_changed', 'commented', 'assigned', 'hoop_response');

create table if not exists maintenance_tickets (
  id            uuid            default gen_random_uuid() primary key,
  court_id      text            not null,
  gym_id        text            not null,
  title         text            not null,
  description   text            not null default '',
  priority      ticket_priority not null default 'medium',
  status        ticket_status   not null default 'open',
  assigned_to   text,
  created_by    text            not null,
  created_at    timestamptz     not null default now(),
  updated_at    timestamptz     not null default now(),
  resolved_at   timestamptz,
  hoop_status       hoop_status,
  hoop_assigned_to  text,
  hoop_notes        text,
  notified_at       timestamptz
);

create index if not exists idx_maintenance_tickets_gym_id   on maintenance_tickets (gym_id);
create index if not exists idx_maintenance_tickets_court_id on maintenance_tickets (court_id);
create index if not exists idx_maintenance_tickets_status   on maintenance_tickets (status);
create index if not exists idx_maintenance_tickets_priority on maintenance_tickets (priority);

create or replace function update_maintenance_ticket_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_maintenance_tickets_updated_at on maintenance_tickets;
create trigger trg_maintenance_tickets_updated_at
  before update on maintenance_tickets
  for each row execute procedure update_maintenance_ticket_timestamp();

create table if not exists maintenance_logs (
  id         uuid               default gen_random_uuid() primary key,
  ticket_id  uuid               not null references maintenance_tickets (id) on delete cascade,
  action     maintenance_action not null,
  user_id    text               not null,
  comment    text,
  timestamp  timestamptz        not null default now()
);

create index if not exists idx_maintenance_logs_ticket_id on maintenance_logs (ticket_id);

alter table maintenance_tickets enable row level security;
alter table maintenance_logs    enable row level security;

-- Gym users can select tickets belonging to their gyms; admins see all
create policy "gym_users_select_own_tickets" on maintenance_tickets
  for select using (
    auth.role() = 'authenticated' and (
      (select role from profiles where id = auth.uid()) = 'admin'
      or gym_id = any((select gym_ids from profiles where id = auth.uid()))
    )
  );

-- Gym users can insert tickets for their gyms
create policy "gym_users_insert_tickets" on maintenance_tickets
  for insert with check (
    auth.role() = 'authenticated' and (
      (select role from profiles where id = auth.uid()) = 'admin'
      or gym_id = any((select gym_ids from profiles where id = auth.uid()))
    )
  );

-- Gym users can update tickets for their gyms; admins can update all (to write hoop_* fields)
create policy "gym_users_update_own_tickets" on maintenance_tickets
  for update using (
    auth.role() = 'authenticated' and (
      (select role from profiles where id = auth.uid()) = 'admin'
      or gym_id = any((select gym_ids from profiles where id = auth.uid()))
    )
  );

-- Logs: select follows ticket ownership
create policy "gym_users_select_logs" on maintenance_logs
  for select using (
    auth.role() = 'authenticated' and (
      (select role from profiles where id = auth.uid()) = 'admin'
      or exists (
        select 1 from maintenance_tickets t
        where t.id = ticket_id
          and t.gym_id = any((select gym_ids from profiles where id = auth.uid()))
      )
    )
  );

-- Logs: insert follows ticket ownership
create policy "gym_users_insert_logs" on maintenance_logs
  for insert with check (
    auth.role() = 'authenticated' and (
      (select role from profiles where id = auth.uid()) = 'admin'
      or exists (
        select 1 from maintenance_tickets t
        where t.id = ticket_id
          and t.gym_id = any((select gym_ids from profiles where id = auth.uid()))
      )
    )
  );

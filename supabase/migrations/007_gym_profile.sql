-- ════════════════════════════════════════
-- MIGRATION 007: Gym profile persistence
-- El dashboard localiza el gym por SLUG (los gym_ids de profiles son slugs
-- tipo 'laieta', no uuids). Esta migración:
--   1. Añade policies de SELECT/UPDATE por slug (las existentes comparan
--      id::text contra gym_ids, que nunca coincide con un slug).
--   2. Siembra la fila del club Laietà si no existe.
-- ════════════════════════════════════════

-- 1a. SELECT por slug (o admin)
drop policy if exists "users_select_gyms_by_slug" on gyms;
create policy "users_select_gyms_by_slug" on gyms
  for select using (
    current_user_role() = 'admin'
    or slug = any(current_user_gym_ids())
  );

-- 1b. UPDATE por slug (o admin) — hasta ahora no existía ninguna policy de update
drop policy if exists "users_update_gyms_by_slug" on gyms;
create policy "users_update_gyms_by_slug" on gyms
  for update using (
    current_user_role() = 'admin'
    or slug = any(current_user_gym_ids())
  )
  with check (
    current_user_role() = 'admin'
    or slug = any(current_user_gym_ids())
  );

-- 2. Seed del club Laietà (idempotente)
insert into gyms (name, slug, address, city, timezone)
values ('Club Laietà', 'laieta', '', 'Barcelona', 'Europe/Madrid')
on conflict (slug) do nothing;

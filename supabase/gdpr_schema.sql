-- Hoop Slam B2B - GDPR Compliance Schema
-- Cumplimiento RGPD: consentimiento, portabilidad (Art. 20) y derecho al olvido (Art. 17)
-- Run this AFTER schema.sql — depende de la tabla profiles

-- ════════════════════════════════════════
-- CONSENT LOG
-- Registro de consentimientos explícitos del usuario
-- RGPD Art. 7: el consentimiento debe ser verificable y revocable
-- ════════════════════════════════════════
create table if not exists consent_log (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references profiles(id) on delete cascade not null,
  consent_type    text        not null check (consent_type in ('analytics', 'marketing', 'necessary')),
  accepted        boolean     not null,
  policy_version  text        not null default '1.0',
  created_at      timestamptz default now(),
  -- SHA-256 de la IP del cliente — NUNCA se almacena la IP directa (RGPD Art. 4.1)
  ip_hash         text
);

-- Índice para consultas por usuario ordenadas cronológicamente
create index if not exists idx_consent_log_user_created
  on consent_log(user_id, created_at desc);

-- Índice para auditar un tipo de consentimiento concreto por usuario
create index if not exists idx_consent_log_user_type
  on consent_log(user_id, consent_type);

-- ════════════════════════════════════════
-- DATA DELETION REQUESTS
-- Solicitudes de derecho al olvido — RGPD Art. 17
-- ════════════════════════════════════════
create table if not exists data_deletion_requests (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references profiles(id) not null,
  status        text        not null default 'pending'
                            check (status in ('pending', 'processing', 'completed', 'rejected')),
  requested_at  timestamptz default now(),
  processed_at  timestamptz,
  -- Admin que procesó la solicitud (puede ser null hasta que se gestione)
  processed_by  uuid        references profiles(id),
  notes         text
);

create index if not exists idx_deletion_requests_user
  on data_deletion_requests(user_id, requested_at desc);

create index if not exists idx_deletion_requests_status
  on data_deletion_requests(status, requested_at desc);

-- ════════════════════════════════════════
-- DATA EXPORT REQUESTS
-- Solicitudes de portabilidad de datos — RGPD Art. 20
-- ════════════════════════════════════════
create table if not exists data_export_requests (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references profiles(id) not null,
  status          text        not null default 'pending'
                              check (status in ('pending', 'processing', 'ready', 'expired')),
  requested_at    timestamptz default now(),
  ready_at        timestamptz,
  -- Caducidad: 48 horas tras la generación del export (RGPD — mínimo tiempo de retención)
  expires_at      timestamptz,
  -- Token firmado para la URL de descarga segura — único por solicitud
  download_token  text        unique
);

create index if not exists idx_export_requests_user
  on data_export_requests(user_id, requested_at desc);

create index if not exists idx_export_requests_status
  on data_export_requests(status, requested_at desc);

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════
alter table consent_log             enable row level security;
alter table data_deletion_requests  enable row level security;
alter table data_export_requests    enable row level security;

-- ────────────────────────────────────────
-- consent_log
-- ────────────────────────────────────────

-- Usuarios: solo ven sus propios registros de consentimiento
create policy "Users can read own consent log"
  on consent_log for select
  using (auth.uid() = user_id);

-- Usuarios: solo pueden insertar registros para sí mismos
create policy "Users can insert own consent"
  on consent_log for insert
  with check (auth.uid() = user_id);

-- service_role: acceso completo para auditoría y reporting (bypassa RLS por defecto,
-- pero se documenta explícitamente para claridad operacional)
-- Nota: service_role bypasses RLS en Supabase — no requiere policy adicional.
-- Para forzar acceso explícito via policy, crear un rol 'compliance_admin' con grant select.

-- ────────────────────────────────────────
-- data_deletion_requests
-- ────────────────────────────────────────

-- Usuarios: ven únicamente sus propias solicitudes
create policy "Users can read own deletion requests"
  on data_deletion_requests for select
  using (auth.uid() = user_id);

-- Usuarios: pueden crear una solicitud de borrado para sí mismos
create policy "Users can request own data deletion"
  on data_deletion_requests for insert
  with check (auth.uid() = user_id);

-- Admins: pueden actualizar el status (procesado, rechazado, etc.)
create policy "Admins can update deletion request status"
  on data_deletion_requests for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );

-- ────────────────────────────────────────
-- data_export_requests
-- ────────────────────────────────────────

-- Usuarios: solo ven sus propias solicitudes de exportación
create policy "Users can read own export requests"
  on data_export_requests for select
  using (auth.uid() = user_id);

-- Usuarios: pueden crear una solicitud de exportación para sí mismos
create policy "Users can request own data export"
  on data_export_requests for insert
  with check (auth.uid() = user_id);

-- ════════════════════════════════════════
-- EDGE FUNCTIONS (referencia de implementación)
-- ════════════════════════════════════════

-- ────────────────────────────────────────
-- EDGE FUNCTION: export-user-data
-- ────────────────────────────────────────
-- Trigger   : INSERT en data_export_requests (webhook desde Supabase Database Webhooks)
-- Entrada   : { user_id, request_id }
--
-- Lógica:
--   1. Recoge todos los datos del usuario:
--        profiles        → datos de perfil
--        gyms            → gimnasios vinculados (via gym_ids)
--        courts          → pistas de esos gimnasios
--        matches         → partidos registrados en esas pistas
--        reservations    → reservas del jugador
--        consent_log     → historial de consentimientos del user_id
--   2. Genera un JSON estructurado con todos los registros anteriores
--   3. Sube el JSON a Supabase Storage:
--        bucket : 'gdpr-exports'
--        path   : {user_id}/{download_token}.json
--        acceso : privado — solo vía signed URL
--   4. Genera download_token (signed JWT o UUID v4 criptográfico)
--   5. Actualiza data_export_requests:
--        status         = 'ready'
--        ready_at       = now()
--        expires_at     = now() + interval '48 hours'
--        download_token = <token generado>
--   6. Envía email al usuario con el link de descarga (signed URL 48h)
--
-- Cumplimiento : RGPD Art. 20 — Derecho a la portabilidad de los datos
--                Plazo legal: respuesta en < 30 días; recomendado < 72h
-- ────────────────────────────────────────

-- ────────────────────────────────────────
-- EDGE FUNCTION: delete-account
-- ────────────────────────────────────────
-- Trigger   : Llamada manual desde el dashboard del usuario
--             (requiere confirmación explícita — doble paso UI)
-- Entrada   : { user_id } — autenticado via JWT del propio usuario
--
-- Lógica:
--   1. NO realiza hard delete — anonimiza el perfil para preservar integridad
--      referencial y datos agregados estadísticos:
--        profiles.name  = 'Usuario eliminado'
--        profiles.email = 'deleted_' || user_id || '@deleted.hoopslam.com'
--        profiles.phone = null
--        (cualquier otro campo PII se pone a null o valor neutro)
--   2. Anonimiza auth.users vía Supabase Admin API (updateUserById):
--        email = mismo valor anonimizado
--        user_metadata = {}
--   3. Revoca todas las sesiones activas del usuario:
--        supabaseAdmin.auth.admin.signOut(user_id, 'global')
--   4. Inserta registro en data_deletion_requests:
--        user_id     = <user_id>
--        status      = 'completed'
--        processed_at = now()
--        notes       = 'Anonimización automática vía Edge Function delete-account'
--   5. Inserta entrada en audit_log:
--        action      = 'delete'
--        entity      = 'profiles'
--        entity_id   = <user_id>
--        description = 'account_deleted — anonimización RGPD Art. 17'
--   6. Responde 200 OK al cliente — la sesión ya habrá sido revocada
--
-- Nota      : Los datos agregados (matches, stats) permanecen anonimizados,
--             no se borran, para mantener la integridad de las métricas del gimnasio.
-- Cumplimiento : RGPD Art. 17 — Derecho de supresión (derecho al olvido)
-- ────────────────────────────────────────

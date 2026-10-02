# Runbook de despliegue — remediación 2026-07-24

⚠️ **Orden importante**: no hagas `git push` (auto-deploy) hasta completar los pasos 1-3.
El código nuevo exige env vars que aún no existen en Vercel; desplegar antes rompería
la autenticación de Firebase y los endpoints de gestores en producción.

## 1. Supabase (dashboard → proyecto `afhxzrnylpvjgtlewflq`) — ✅ COMPLETADO 2026-10-01

- [x] **El proyecto estaba PAUSADO** (free tier, inactividad) — reanudado y restaurado. Nota: en plan free se volverá a pausar tras ~1 semana sin tráfico; valorar upgrade a Pro o un ping periódico.
- [x] **SQL Editor**: migración `007_gym_profile.sql` ejecutada (policies por slug + seed `laieta`). Migraciones 001-006 verificadas (las 11 tablas existen).
- [x] **Authentication → Sign In / Up**: **Enable Sign Up desactivado**.
- [x] **profiles**: gestores reales (`cole.ferreiro@` y `lluis.garcia@hoopslam.net`) asignados a `gym_ids=['laieta']`. Quedan ~6 perfiles de prueba ("a", "aaaaaa", "Helllo", etc.) y 3 gyms basura ("a", "laiet", "paquito") — recomendable borrarlos desde Admin → Gestores cuando el deploy esté hecho.

## 2. Firebase (console → proyecto `hoopslam-a6c30`)

- [ ] **Project settings → Service accounts → Generate new private key**: descargar el JSON. Se usará como env var en el paso 3.
- [ ] **Firestore → Rules**: verificar que todas las colecciones (`courts`, `reservations`, `users`, `stats`, `court_blocks`, `court_incidents`) exigen `request.auth != null`.
- [ ] **Authentication → Users**: rotar la contraseña de `laieta@hoopslam.net` (la actual está quemada en bundles ya publicados). Actualizarla en tu `.env.local` (solo dev).

## 3. Vercel (dashboard → hoop-slam-gyms → Settings → Environment Variables) — casi completo 2026-10-02

- [x] Saltos de línea `\n`: **falsa alarma** — revisados en el dashboard (`VITE_DATA_SOURCE` = `firebase` limpio, `SUPABASE_SERVICE_ROLE_KEY` limpio). El `\n` solo estaba en el `.env.vercel` local, ya corregido.
- [x] `SUPABASE_ANON_KEY`: ya no hace falta — `api/_auth.ts` reutiliza `VITE_SUPABASE_ANON_KEY` (existente).
- [x] `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` existen. (Vercel marca la service role key como "Needs Attention": está guardada como *Config* legible; recomendable cambiarla a tipo *Secret*.)
- [x] **Eliminadas** `VITE_FIREBASE_AUTH_EMAIL` y `VITE_FIREBASE_AUTH_PASSWORD`. (El deploy actual sigue funcionando porque las lleva compiladas; la contraseña sigue siendo válida en Firebase hasta rotarla — paso 2.)
- [ ] **Añadir `FIREBASE_SERVICE_ACCOUNT`** = contenido completo del JSON del paso 2 (una sola línea), tipo *Secret*, entorno Production. ← **único bloqueo para el push**

## 4. Desplegar

- [ ] `git push` (el commit de remediación ya está hecho en local).
- [ ] Vercel desplegará automáticamente desde `master`.

## 5. Verificación en producción

- [ ] Login de gestor → aterriza en su dashboard; KPIs cargan con datos reales.
- [ ] `curl -X POST https://hoop-slam-gyms.vercel.app/api/invite-gestor` sin token → **401**.
- [ ] Crear un ticket de mantenimiento → recargar → sigue ahí (fila en `maintenance_tickets`).
- [ ] Editar teléfono/horarios del club → recargar → persiste.
- [ ] Como gestor, visitar `/gym/otro/dashboard` → rebota.
- [ ] "¿Olvidaste tu contraseña?" → llega el email → establecer nueva contraseña → login.

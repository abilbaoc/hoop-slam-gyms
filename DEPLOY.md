# Runbook de despliegue — remediación 2026-07-24

⚠️ **Orden importante**: no hagas `git push` (auto-deploy) hasta completar los pasos 1-3.
El código nuevo exige env vars que aún no existen en Vercel; desplegar antes rompería
la autenticación de Firebase y los endpoints de gestores en producción.

## 1. Supabase (dashboard → proyecto `afhxzrnylpvjgtlewflq`)

- [ ] **SQL Editor**: ejecutar `supabase/migrations/007_gym_profile.sql` (policies por slug de `gyms` + seed del club Laietà). Verificar antes que 001-006 están aplicadas (`select * from gyms limit 1;` y `select * from maintenance_tickets limit 1;` no deben dar "relation does not exist").
- [ ] **Authentication → Sign In / Up**: desactivar **Enable Sign Up** (el alta es solo por invitación).
- [ ] **Table Editor → profiles**: verificar que cada gestor tiene `gym_ids = ['laieta']`. Con el nuevo control de acceso, un gestor sin club va a la pantalla "pendiente de asignación".

## 2. Firebase (console → proyecto `hoopslam-a6c30`)

- [ ] **Project settings → Service accounts → Generate new private key**: descargar el JSON. Se usará como env var en el paso 3.
- [ ] **Firestore → Rules**: verificar que todas las colecciones (`courts`, `reservations`, `users`, `stats`, `court_blocks`, `court_incidents`) exigen `request.auth != null`.
- [ ] **Authentication → Users**: rotar la contraseña de `laieta@hoopslam.net` (la actual está quemada en bundles ya publicados). Actualizarla en tu `.env.local` (solo dev).

## 3. Vercel (dashboard → hoop-slam-gyms → Settings → Environment Variables)

- [ ] Re-guardar las variables que tienen un salto de línea al final del valor (se ven como `hoopslam-a6c30\n`): `VITE_DATA_SOURCE`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`.
- [ ] Añadir `SUPABASE_ANON_KEY` (mismo valor que `VITE_SUPABASE_ANON_KEY`).
- [ ] Verificar que existen `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Añadir `FIREBASE_SERVICE_ACCOUNT` = contenido completo del JSON del paso 2 (una sola línea).
- [ ] **Eliminar** `VITE_FIREBASE_AUTH_EMAIL` y `VITE_FIREBASE_AUTH_PASSWORD`.

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

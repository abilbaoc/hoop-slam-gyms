# Runbook de despliegue — remediación 2026-07-24

⚠️ **Orden importante**: no hagas `git push` (auto-deploy) hasta completar los pasos 1-3.
El código nuevo exige env vars que aún no existen en Vercel; desplegar antes rompería
la autenticación de Firebase y los endpoints de gestores en producción.

## 1. Supabase (dashboard → proyecto `afhxzrnylpvjgtlewflq`) — ✅ COMPLETADO 2026-10-01

- [x] **El proyecto estaba PAUSADO** (free tier, inactividad) — reanudado y restaurado. Nota: en plan free se volverá a pausar tras ~1 semana sin tráfico; valorar upgrade a Pro o un ping periódico.
- [x] **SQL Editor**: migración `007_gym_profile.sql` ejecutada (policies por slug + seed `laieta`). Migraciones 001-006 verificadas (las 11 tablas existen).
- [x] **Authentication → Sign In / Up**: **Enable Sign Up desactivado**.
- [x] **profiles**: gestores reales (`cole.ferreiro@` y `lluis.garcia@hoopslam.net`) asignados a `gym_ids=['laieta']`. Quedan ~6 perfiles de prueba ("a", "aaaaaa", "Helllo", etc.) y 3 gyms basura ("a", "laiet", "paquito") — recomendable borrarlos desde Admin → Gestores cuando el deploy esté hecho.

## 2. Firebase (console → proyecto `hoopslam-a6c30`) — ⛔ sin acceso a la cuenta propietaria (2026-10-02)

Todo este bloque queda a la espera de quien tenga la cuenta de Google propietaria. Mientras tanto se usa el modo de credenciales servidas por `/api/firebase-token` (ver paso 3).

- [ ] **Project settings → Service accounts → Generate new private key**: descargar el JSON. Se usará como env var en el paso 3.
- [ ] **Firestore → Rules**: verificar que todas las colecciones (`courts`, `reservations`, `users`, `stats`, `court_blocks`, `court_incidents`) exigen `request.auth != null`.
- [ ] **Authentication → Users**: rotar la contraseña de `laieta@hoopslam.net` (la actual está quemada en bundles ya publicados). Actualizarla en tu `.env.local` (solo dev).

## 3. Vercel (dashboard → hoop-slam-gyms → Settings → Environment Variables) — casi completo 2026-10-02

- [x] Saltos de línea `\n`: **falsa alarma** — revisados en el dashboard (`VITE_DATA_SOURCE` = `firebase` limpio, `SUPABASE_SERVICE_ROLE_KEY` limpio). El `\n` solo estaba en el `.env.vercel` local, ya corregido.
- [x] `SUPABASE_ANON_KEY`: ya no hace falta — `api/_auth.ts` reutiliza `VITE_SUPABASE_ANON_KEY` (existente).
- [x] `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` existen. (Vercel marca la service role key como "Needs Attention" porque es *Config* legible. Pasarla a *Secret* **exige un valor nuevo** — Vercel no deja convertir la actual —, o sea rotarla en Supabase → Settings → API. Pendiente, no bloquea.)
- [x] **Eliminadas** `VITE_FIREBASE_AUTH_EMAIL` y `VITE_FIREBASE_AUTH_PASSWORD` (las públicas del bundle). El deploy actual sigue funcionando porque las lleva compiladas.
- [x] **Añadir 2 variables server-only** (hecho por el usuario 2026-10-02; verificadas: Production, Secret, sin prefijo VITE_) (sin prefijo `VITE_`, tipo *Secret*, entorno Production) — sustituyen al service account mientras no haya acceso a la cuenta propietaria de Firebase:
  - `FIREBASE_AUTH_EMAIL` = `laieta@hoopslam.net`
  - `FIREBASE_AUTH_PASSWORD` = la contraseña actual de ese usuario (está en tu `.env.local`)
  `/api/firebase-token` las entrega solo a usuarios con sesión de Supabase válida, nunca a visitantes anónimos. ← **único bloqueo para el push**
- [ ] (Opcional, cuando haya acceso a la cuenta propietaria) `FIREBASE_SERVICE_ACCOUNT` = JSON del service account. Si existe, el endpoint pasa automáticamente a custom tokens por usuario y las 2 variables anteriores se pueden borrar.

> Comprobado 2026-10-02: Firestore **exige autenticación** (todas las colecciones devuelven 403 sin credenciales), por eso no se puede desplegar sin alguno de los dos métodos.

## 4. Desplegar — ✅ 2026-10-02

- [x] `git push` (427b734..8c547d3) → Vercel desplegó desde `master`.

## 5. Verificación en producción

- [x] `/login` carga sin errores de consola; bundle nuevo con code-splitting (~254 kB de JS inicial).

- [ ] Login de gestor → aterriza en su dashboard; KPIs cargan con datos reales.
- [x] `invite/update/delete-gestor` y `firebase-token` sin token o con token falso → **401** (verificado en producción).
- [ ] Crear un ticket de mantenimiento → recargar → sigue ahí (fila en `maintenance_tickets`).
- [ ] Editar teléfono/horarios del club → recargar → persiste.
- [ ] Como gestor, visitar `/gym/otro/dashboard` → rebota.
- [ ] "¿Olvidaste tu contraseña?" → llega el email → establecer nueva contraseña → login.

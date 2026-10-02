# Hoop Slam — Dashboard B2B de Gestión de Gimnasios

Panel de control para gestores de clubes con canastas inteligentes Hoop Slam.
Producción: [hoop-slam-gyms.vercel.app](https://hoop-slam-gyms.vercel.app)

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 (dark theme, accent `#7BFF00`)
- **Deploy**: Vercel (auto-deploy desde `master`) + serverless functions en `api/`
- **Datos**: arquitectura híbrida de dos backends (ver abajo)

## Arquitectura de datos

Cada entidad persiste en UN solo sitio:

| Backend | Qué guarda |
|---|---|
| **Firebase Firestore** (`hoopslam-a6c30`) | Operativa de pistas: `courts`, `reservations` (+subcolección `games`), `users`, `stats`, `court_blocks`, `court_incidents`. Aquí escriben la app móvil y el hardware. |
| **Supabase** (`afhxzrnylpvjgtlewflq`) | Identidad y back-office: Auth, `profiles`, `gyms` (perfil editable del club, localizado por `slug`), `maintenance_tickets` + `maintenance_logs`. |
| Mock in-memory (`src/data/mock/`) | Solo fallback de desarrollo cuando no hay credenciales configuradas. |

`src/data/api.ts` es el orquestador: decide por función a qué backend llamar.
Las notificaciones se **derivan** de datos reales (incidencias + tickets); el estado "leída" vive en localStorage.

## Autenticación y roles

- Login con Supabase Auth (email + contraseña). **No hay registro público** — los usuarios se crean por invitación desde Admin → Gestores.
- La sesión de Firebase del navegador se obtiene vía `/api/firebase-token`, que solo responde a usuarios con sesión de Supabase: con `FIREBASE_SERVICE_ACCOUNT` emite un custom token por usuario; sin él, entrega las credenciales compartidas `FIREBASE_AUTH_EMAIL/PASSWORD` (server-only). En ningún caso viajan credenciales en el bundle público.
- Roles: `admin` (todo), `gestor` (su club), `staff` (reservas de su club). Permisos en `src/types/auth.ts`; el acceso por club se comprueba en `GymLayout` (`canAccessGym`).

## Endpoints serverless (`api/`)

Todos exigen un JWT de Supabase en `Authorization: Bearer` (ver `api/_auth.ts`):

- `POST /api/invite-gestor` — crea usuario + perfil (solo admin)
- `POST /api/update-gestor` — cambia rol / club asignado (solo admin)
- `POST /api/delete-gestor` — elimina usuario (solo admin, no a sí mismo)
- `POST /api/firebase-token` — custom token de Firebase o credenciales compartidas (cualquier usuario autenticado)

Edge function de Supabase: `notify-hoop-on-ticket` (notifica al equipo Hoop los tickets high/critical).

## Variables de entorno

**Vite (cliente, prefijo `VITE_`)** — ⚠️ sin saltos de línea al final del valor:

```
VITE_DATA_SOURCE=firebase
VITE_SUPABASE_URL=…
VITE_SUPABASE_ANON_KEY=…
VITE_FIREBASE_API_KEY=…
VITE_FIREBASE_AUTH_DOMAIN=…
VITE_FIREBASE_PROJECT_ID=…
VITE_FIREBASE_STORAGE_BUCKET=…
VITE_FIREBASE_MESSAGING_SENDER_ID=…
VITE_FIREBASE_APP_ID=…
```

**Solo server (Vercel, sin prefijo)**:

```
SUPABASE_URL=…
SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",…}   # JSON completo (preferido)
# …o, mientras no haya service account:
FIREBASE_AUTH_EMAIL=…
FIREBASE_AUTH_PASSWORD=…
```

Solo desarrollo local (fallback DEV de auth Firebase, nunca en Vercel): `VITE_FIREBASE_AUTH_EMAIL`, `VITE_FIREBASE_AUTH_PASSWORD`.

## Migraciones Supabase

Aplicar en orden `supabase/schema.sql` → `migrations/001…007` (+ `gdpr_schema.sql`).
La 007 añade las policies por `slug` de `gyms` y siembra el club Laietà.

## Scripts

```
npm run dev        # servidor de desarrollo
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Documentación

- `HOOP_SLAM_CONTEXT.md` — contexto de producto
- `docs/security-audit.md` — auditoría de seguridad
- `docs/ux/` — specs de UX

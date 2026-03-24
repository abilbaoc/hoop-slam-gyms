# Security & RGPD Audit — Hoop Slam B2B Dashboard

**Fecha:** 2026-03-24
**Auditor:** Cybersecurity & Data Compliance Engineer (Claude Code)
**Scope:** `C:\Users\aleja\Documents\SAP gyms` — React 19 + TypeScript + Vite, Firebase + Supabase
**npm audit result:** `found 0 vulnerabilities`

---

## Resumen ejecutivo

| Severidad | Hallazgos | Corregidos | Pendientes |
|-----------|-----------|------------|------------|
| CRÍTICO   | 1         | 1          | 0          |
| ALTO      | 3         | 3          | 0          |
| MEDIO     | 4         | 1 (SQL)    | 3          |
| BAJO      | 3         | 0          | 3          |
| INFO      | 5         | —          | —          |

---

## Hallazgos CRÍTICOS

### [CRÍTICO-01] Rutas `/admin/*` sin guard de rol — acceso a cualquier usuario autenticado

**Archivo:** `src/App.tsx` (líneas 40-44 antes del fix)
**Estado:** CORREGIDO

**Descripción:**
Las rutas `/admin/clubs` y `/admin/gestores` estaban anidadas bajo un `<GymLayout>` sin ninguna comprobación de rol. Cualquier usuario autenticado (gestor, staff) podía navegar directamente a `/admin/clubs` o `/admin/gestores` y ver/crear/editar clubs y usuarios del sistema, incluyendo emails de todos los gestores de la plataforma.

**Fix aplicado:**
Se añadió el componente `AdminGuard` en `src/App.tsx`:

```tsx
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

Las rutas `/admin/*` ahora están envueltas en `<AdminGuard>`. Adicionalmente, se añadió una comprobación `defence-in-depth` al inicio de `AdminClubsPage` y `AdminGestoresPage` con un `<Navigate to="/" replace />` en caso de que el guard de ruta sea bypaseado.

---

## Hallazgos ALTOS

### [ALTO-01] `canAccessGym()` con bypass total para usuarios sin gymIds asignados

**Archivo:** `src/contexts/AuthContext.tsx` (línea 293 antes del fix)
**Estado:** CORREGIDO

**Descripción:**
La función `canAccessGym` contenía la siguiente lógica:

```typescript
// Users with no gyms assigned (new Supabase users) can access all gyms for demo
if (!currentUser.gymIds || currentUser.gymIds.length === 0) return true;
```

Cualquier usuario recién registrado en Supabase (cuyo perfil aún no tuviese `gym_ids` asignados) podía acceder a **todos** los gimnasios de la plataforma. Esto es un bypass completo del control de acceso por gym, clasificado como ALTO porque un atacante podría registrarse y tener visibilidad total de datos de todos los clientes.

**Fix aplicado:**
Eliminada la condición de bypass. La función ahora retorna `false` para usuarios sin gymIds asignados (el administrador deberá asignarlos explícitamente):

```typescript
const canAccessGym = useCallback(
  (gymId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.gymIds?.includes(gymId) ?? false;
  },
  [currentUser],
);
```

**Nota de producto:** Los gestores recién creados verán el dashboard vacío hasta que un admin les asigne un gym. Esto es el comportamiento correcto desde el punto de vista de seguridad.

---

### [ALTO-02] Columna `email` en tabla `club_members` — exposición de datos B2C a gestores

**Archivo:** `supabase/migrations/001_new_scope.sql` (línea 23)
**Estado:** CORREGIDO (migration 003)

**Descripción:**
La tabla `club_members` definía una columna `email text` y la política RLS de SELECT permitía a cualquier gestor del gym leer `*`. El código TypeScript en `firebaseProvider.ts` ya omite el email (comentario explícito en línea 208), pero la columna existía en la BD y podía ser leída directamente vía Supabase client o PostgREST.

Esto supone una violación del principio de minimización de datos del RGPD (Art. 5.1.c) y del acuerdo entre Hoop Slam y sus clubs B2B (los clubs solo deben ver el nickname del jugador).

**Fix aplicado:**
Nueva migración `003_security_fixes.sql` que elimina la columna:

```sql
ALTER TABLE club_members DROP COLUMN IF EXISTS email;
```

**RGPD:** Aplica también el principio de exactitud y limitación del plazo de conservación — si el email ya no tiene uso legítimo en el contexto B2B, debe suprimirse.

---

### [ALTO-03] `AdminGestoresPage` muestra emails de B2B users sin comprobación de permiso en UI

**Archivo:** `src/pages/Admin/AdminGestoresPage.tsx`
**Estado:** CORREGIDO (defence-in-depth check añadido)

**Descripción:**
La página mostraba la columna "Email" de todos los gestores del sistema (línea 144: `{user.email}`) sin ninguna comprobación de rol en el propio componente. Antes del fix de [CRÍTICO-01], cualquier gestor/staff podía ver la lista completa de usuarios con sus emails.

**Fix aplicado:**
Añadido guard `if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;` al inicio del componente, como segunda línea de defensa independiente del router guard.

---

## Hallazgos MEDIOS

### [MEDIO-01] `maintenance_tickets` usa `text` para `gym_id` y `court_id` sin integridad referencial

**Archivo:** `supabase/migrations/002_maintenance.sql` (líneas 14-15)
**Estado:** PARCIALMENTE CORREGIDO (migration 003 añade CHECK constraint)

**Descripción:**
Los campos `gym_id` y `court_id` de la tabla `maintenance_tickets` son de tipo `text` en lugar de `uuid` con FK. Esto impide la integridad referencial y podría permitir insertar tickets con `gym_id` arbitrario, potencialmente saltándose los filtros de las políticas RLS (que comparan `gym_id = ANY(...)` sobre strings).

**Fix parcial aplicado (migration 003):**
```sql
ALTER TABLE maintenance_tickets
  ADD CONSTRAINT chk_maintenance_tickets_gym_id_nonempty CHECK (gym_id <> '');
```

**Fix completo recomendado (no automático — requiere data migration):**
Si los IDs de Firebase son strings no-UUID, considerar añadir una tabla `firebase_gyms(firebase_id text PK)` y referenciar desde `maintenance_tickets`. Si son UUIDs, migrar columnas a `uuid` con FK.

---

### [MEDIO-02] Gestores pueden actualizar campos `hoop_*` en `maintenance_tickets`

**Archivo:** `supabase/migrations/002_maintenance.sql`
**Estado:** CORREGIDO (migration 003)

**Descripción:**
La política `gym_users_update_own_tickets` permitía a cualquier gestor autenticado del gym hacer UPDATE sobre cualquier campo de un ticket, incluyendo `hoop_status`, `hoop_notes` y `hoop_assigned_to` — campos de uso interno del equipo de operaciones de Hoop Slam. Un gestor malintencionado podría alterar el estado interno de un ticket de mantenimiento.

**Fix aplicado (migration 003):**
Se reemplazó la política única por dos políticas diferenciadas: `gestors_update_own_tickets` (con WITH CHECK que congela los campos `hoop_*`) y `admins_update_all_tickets`.

---

### [MEDIO-03] Perfil de usuario en `buildDefaultUser` persiste en localStorage con role `gestor` sin verificación Supabase

**Archivo:** `src/contexts/AuthContext.tsx` (líneas 97-111)
**Estado:** DOCUMENTADO — no modificado

**Descripción:**
`buildDefaultUser()` es llamado cuando falla la consulta al perfil de Supabase. Crea un usuario con `role: 'gestor'` y lo persiste en localStorage. Si un atacante puede provocar un error transitorio en la consulta de perfil (p.ej. rate limit, error de red), el usuario podría quedar con el rol por defecto durante la sesión.

**Mitigación existente:** El token JWT de Supabase sigue siendo válido en el servidor; las políticas RLS protegen la BD independientemente del rol que el cliente crea tener. El riesgo real queda limitado al scope de UI (ver secciones que no corresponden al rol real).

**Recomendación:** Añadir un campo `profileFetchFailed: boolean` al estado de auth y mostrar un banner de advertencia en lugar de asumir rol por defecto cuando el fetch falla.

---

### [MEDIO-04] `GymLayout.tsx` resuelve el gym por `gymId` del URL solo contra los datos mock en modo Firebase

**Archivo:** `src/layouts/GymLayout.tsx` (línea 29)
**Estado:** DOCUMENTADO — no modificado

**Descripción:**
```typescript
const gym = gyms.find((g) => g.id === gymId);
```
Se usa la lista `gyms` de `mock/gyms.ts` incluso cuando `USE_FIREBASE=true`. En producción con Firebase, un `gymId` válido en Firestore pero ausente en el mock retornará `gym=undefined` y mostrará "Gimnasio no encontrado". No es un riesgo de seguridad directo, pero sí una inconsistencia que podría causar acceso denegado incorrecto o, en un escenario de gym creado dinámicamente, permitir acceso si el mock tiene IDs hardcodeados que coinciden.

**Recomendación:** Utilizar `getGymById(gymId)` (que sí consulta Firebase) en lugar de `gyms.find()` cuando `USE_FIREBASE=true`.

---

## Hallazgos BAJOS

### [BAJO-01] Sesión parcialmente restaurada desde localStorage antes de verificar con Supabase

**Archivo:** `src/contexts/AuthContext.tsx` (líneas 117-124)
**Estado:** DOCUMENTADO — no modificado

**Descripción:**
En el `useEffect` de inicialización, el usuario se restaura inmediatamente desde localStorage (`setCurrentUser(parsed)`) antes de que Supabase confirme que la sesión sigue activa. Durante el intervalo entre la restauración y la respuesta de `supabase.auth.getSession()`, el usuario puede interactuar con rutas protegidas como si estuviese autenticado, aunque su sesión haya expirado.

**Mitigación existente:** El código corrige el estado si `getSession()` retorna `null` (líneas 135-139). El impacto es una ventana de milisegundos en el cliente.

**Recomendación:** Mostrar un skeleton/loading durante la verificación en lugar de renderizar contenido protegido inmediatamente.

---

### [BAJO-02] Contraseña temporal en `AdminGestoresPage` se muestra en campo `type="text"`

**Archivo:** `src/pages/Admin/AdminGestoresPage.tsx` (línea 60)
**Estado:** DOCUMENTADO — no modificado

**Descripción:**
El campo de contraseña temporal usa `type="text"` en lugar de `type="password"`. La contraseña queda visible en pantalla y potencialmente en el historial de autocompletado del navegador.

**Recomendación:** Cambiar a `type="password"` y añadir un icono de "mostrar/ocultar" si se desea visibilidad.

---

### [BAJO-03] Filtro de gymId en `fbGetMatches` no se aplica en servidor — data leak potencial

**Archivo:** `src/data/firebaseProvider.ts` (líneas 154-158)
**Estado:** DOCUMENTADO — no modificado

**Descripción:**
El bloque de filtro por `gymId` en `fbGetMatches` está vacío (TODO comentado). La query obtiene hasta 500 partidos sin filtrar por gym, y el filtrado se haría en cliente. Esto significa que la SDK de Firebase descarga datos de todos los gyms cuando se solicita con `gymId`.

**Recomendación:** Añadir índice compuesto `courtId+gymId` en Firestore y filtrar en servidor, o resolver los `courtIds` del gym primero y usar `where('courtId', 'in', courtIds)`.

---

## Hallazgos INFO

### [INFO-01] Firebase config keys en bundle de producción — ESPERADO y ACEPTADO

**Archivo:** `src/lib/firebase.ts`

Las claves `VITE_FIREBASE_*` son públicas por diseño del SDK de Firebase Web. La seguridad de Firebase recae en las reglas de Firestore (Firebase Security Rules), no en ocultar la config. Verificar que las reglas de Firestore del proyecto solo permiten lectura autenticada y con los filtros adecuados.

---

### [INFO-02] Variables VITE_SUPABASE_ANON_KEY pública en bundle — ESPERADO y ACEPTADO

La `anon key` de Supabase es pública por diseño; la seguridad recae en las políticas RLS de la BD (auditadas en secciones anteriores). La `service_role` key nunca debe incluirse en variables VITE_*.

**Verificado:** `.env.example` solo incluye `VITE_SUPABASE_ANON_KEY`. No hay `SERVICE_ROLE` expuesta.

---

### [INFO-03] `.env` correctamente excluido de git via `.gitignore`

**Verificado:** `.env` aparece en `.gitignore`. Los valores de `.env` actuales están vacíos (en espera de configuración), sin secrets reales expuestos.

---

### [INFO-04] Cookie consent — implementación RGPD correcta

**Archivo:** `src/components/ui/CookieBanner.tsx` + `src/hooks/useCookieConsent.ts`

Implementación conforme al RGPD Art. 7:
- Se muestra antes de que el usuario haya dado consent (`if (hasConsented) return null`).
- Ofrece rechazo explícito ("Rechazar todo") al mismo nivel visual que "Aceptar todo".
- Granularidad por categoría (analytics, marketing).
- Almacena timestamp y version en localStorage para trazabilidad.
- Las cookies necesarias están marcadas como "siempre activas" (correcto — no requieren consent).

**Observación menor:** El banner no discrimina si el usuario ya cargó scripts analíticos/marketing antes de dar consent (depende de si Google Analytics / Meta Pixel están integrados condicionalmente). Si se añaden estas integraciones en el futuro, asegurar que los scripts solo se cargan tras consent positivo.

---

### [INFO-05] Política de Privacidad — contenido RGPD completo

**Archivo:** `src/pages/Privacy/PrivacyPolicyPage.tsx`

Contenido correcto y completo:
- Responsable del tratamiento identificado.
- Finalidades y bases legales según Art. 6 RGPD (tabla completa).
- Plazos de conservación específicos y con referencias legales (Ccom, LGT, LSSI).
- Derechos ARCO-POL completos con canal de ejercicio.
- Encargados del tratamiento listados (AWS, Stripe, Google/Firebase, Intercom).
- Transferencias internacionales mencionadas (CCT para Google LLC).
- DPO con email de contacto.

**Pendiente menor:** El CIF aparece como `B-XXXXXXXX` (placeholder). Completar cuando la sociedad esté inscrita.

---

## Resumen de archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `src/App.tsx` | Añadido `AdminGuard` component + aplicado a rutas `/admin/*` |
| `src/contexts/AuthContext.tsx` | Eliminado bypass `gymIds.length === 0` en `canAccessGym` |
| `src/pages/Admin/AdminClubsPage.tsx` | Añadido import `useAuth`/`Navigate` + defence-in-depth role check |
| `src/pages/Admin/AdminGestoresPage.tsx` | Añadido import `useAuth`/`Navigate` + defence-in-depth role check |
| `supabase/migrations/003_security_fixes.sql` | Nueva migración: elimina `email` de `club_members`, añade CHECK constraints, restricción UPDATE de campos `hoop_*` |

## Verificación de compilación

```
npm run build → EXIT 0
✓ 3247 modules transformed
✓ built in 569ms
npm audit → found 0 vulnerabilities
```

---

*Informe generado automáticamente. Revisión humana recomendada antes de desplegar en producción.*

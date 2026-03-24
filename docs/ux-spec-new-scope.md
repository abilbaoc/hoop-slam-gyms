# Hoop Slam Dashboard — Especificaciones UX: Nuevo Scope
**Versión:** 1.0 | **Fecha:** 2026-03-24 | **Autor:** hoop-ux | **Estado:** Aprobado para implementación

---

## 1. Nueva navegación (Sidebar)

### 1.1 Sidebar — Rol Admin (`/admin/`)

| Icono Lucide | Label | Ruta |
|---|---|---|
| `Building2` | Clubs | `/admin/clubs` |
| `UserCog` | Gestores | `/admin/gestores` |

El Admin puede entrar a cualquier club como gestor desde la lista de clubs con un botón "Gestionar" → `/gym/:gymId/overview`.

### 1.2 Sidebar — Rol Gestor (`/gym/:gymId/`)

| Icono Lucide | Label | Ruta |
|---|---|---|
| `BarChart2` | Overview | `/gym/:gymId/overview` |
| `Dribbble` | Canastas | `/gym/:gymId/courts` |
| `Users` | Miembros | `/gym/:gymId/members` |

### 1.3 Sidebar — Rol Staff

| Icono Lucide | Label | Ruta |
|---|---|---|
| `CalendarCheck` | Reservas | `/gym/:gymId/reservations` |

---

## 2. Panel Admin `/admin`

### 2.1 `/admin/clubs` — CRUD Clubs

Tabla con columnas: Nombre, Ciudad, Nº Canastas, Gestor asignado, Acciones (menú `MoreHorizontal`).

**Acciones por fila:** `Pencil` Editar / `UserCog` Gestionar / `Dribbble` Ver canastas / `Trash2` Eliminar.

**Modal "Crear club":**

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| Nombre del club | `Input` text | Sí | 2–60 chars, único |
| Ciudad | `Input` text | Sí | Min 2 chars |
| Dirección | `Input` text | No | Max 120 chars |

Estado vacío: `EmptyState` icono `Building2`, "No hay clubs creados todavía."

### 2.2 `/admin/gestores` — CRUD Gestores

**Modal "Crear gestor":**

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| Nombre completo | `Input` text | Sí | Min 2 chars |
| Email | `Input` email | Sí | Formato válido + único |
| Contraseña temporal | `Input` password | Sí | Min 8 chars; botón `KeyRound` "Generar" |
| Asignar a club | `Select` | No | Lista de clubs activos |

Éxito: Toast "Gestor creado. Se ha enviado un email de bienvenida a [email]."

**Acciones por fila:** `Pencil` Editar / `KeyRound` Resetear contraseña / `Trash2` Eliminar.

### 2.3 `/admin/clubs/:clubId/courts` — Asignación de canastas

Modal "Asignar canasta": lista de canastas con `clubId === null` (sin asignar). Selección simple + botón "Asignar". Solo una canasta por club. Desasignar: acción `Unlink` en la fila.

Estado vacío del modal: "No hay canastas disponibles. Todas las canastas ya están asignadas a un club."

---

## 3. Court Detail Page — 3 tabs

**Ruta:** `/gym/:gymId/courts/:courtId`

**Header:** Nombre de la canasta + badge estado activa/inactiva + dirección. Tabs: [Configuración | Slots | Incidencias].

### 3.1 Tab: Configuración

Los 7 campos agrupados en 3 `Card`:

**Card 1 — Estado y visibilidad:**
- Toggle "Canasta activa" (auto-save con toast. Al desactivar: warning "Los slots activos no se cancelarán automáticamente.")
- Toggle "Visible en la app" (auto-save)

**Card 2 — Información básica:**
- `Input` "Nombre" (obligatorio, 2–60 chars)
- `Input` "Dirección" (obligatorio, max 120 chars)

**Card 3 — Horario de apertura:**
- `Select` "Apertura" (steps 30 min, no puede ser >= cierre)
- `Select` "Cierre" (steps 30 min, no puede ser <= apertura)
- Info: "El horario define la ventana de slots."

**Card 4 — Configuración de partidos:**
- `Select` "Duración partido" (15, 20, 30, 45, 60, 90, 120 min)
- `Select` "Duración slot" (15, 20, 30, 45, 60, 90, 120 min; debe ser ≤ duración partido)
- Info: "Duración de slot debe ser ≤ duración de partido."

Botones: [Cancelar] [Guardar cambios] (toggles son auto-save; el resto requiere guardar).

### 3.2 Tab: Slots

Vista de timeline vertical por día con navegación `← fecha →`.

**Colores de estado:**
- Disponible: `#7BFF00` 30% opacidad
- Reservado: `#0A84FF` 40% opacidad
- Bloqueado: `#FF453A` 30% opacidad
- Sin slot: fondo neutro `#2C2C2E` 20%

Tabla debajo del timeline con columnas: Hora inicio, Hora fin, Estado, Jugador, Acciones (`MoreHorizontal`).

**Modal "Crear slot":**

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| Fecha | Date picker | Sí | Futura |
| Hora inicio | `Select` steps slot_duration | Sí | Dentro del horario apertura/cierre |
| Hora fin | `Select` | Sí | > hora inicio, dentro del horario |
| Estado | `Select` | Sí | Disponible / Bloqueado |
| Motivo | `Input` text | Solo si Bloqueado | Max 80 chars |

Validación de solapamiento: error inline "Este horario se solapa con un slot existente (10:00–11:00)."

Estado vacío: `EmptyState` icono `Clock`, "Configura el horario en la tab Configuración antes de gestionar slots."

### 3.3 Tab: Incidencias

Filtros: estado + prioridad. Botón "+ Nueva incidencia".

Cada incidencia muestra: badges [Prioridad][Estado] + badge "Hoop notificado" si aplica + título + fecha + creado por.

**Modal "Nueva incidencia":** Reutiliza `CreateTicketModal`. Campo "Canasta" fijo y pre-rellenado.

**Badges de prioridad:** Baja = gray / Media = yellow / Alta = red / Crítica = red + `AlertOctagon`.

Estado vacío: `EmptyState` icono `AlertCircle`, "Sin incidencias", "Esta canasta no tiene incidencias registradas."

---

## 4. Overview / Estadísticas

**Ruta:** `/gym/:gymId/overview`

### 5 KPI Cards

| # | Métrica | Icono | Tendencia positiva |
|---|---|---|---|
| 1 | Reservas hechas | `CalendarCheck` | Sube = verde |
| 2 | Reservas iniciadas | `PlayCircle` | Sube = verde |
| 3 | Reservas canceladas | `CalendarX` | Baja = verde (invertida) |
| 4 | Partidos jugados | `Trophy` | Sube = verde |
| 5 | Partidos cancelados | `XCircle` | Baja = verde (invertida) |

Grid: 3 cards + 2 cards (primera fila: hechas, iniciadas, canceladas; segunda: jugados, cancelados).

Filtro de período: `Select` esquina superior derecha — "Últimos 7 días" (default) / "Últimos 30 días" / "Este mes".

### Gráfica de actividad diaria

Bar chart Recharts. 2 series:
- Reservas hechas (`#7BFF00`)
- Partidos jugados (`#0A84FF`)

Eje X: días abreviados (7d) o fechas cortas (30d). Tooltip hover con valores exactos.

**Nota:** Las cancelaciones son métricas de excepción visibles en los KPI cards. No se incluyen en la gráfica para evitar sobrecarga visual.

Loading state: `Skeleton` de 5 cards + skeleton del chart.

---

## 5. Club Members — Jugadores B2C

**Ruta:** `/gym/:gymId/members`

**Banner informativo (siempre visible):**
Fondo `rgba(10,132,255,0.08)`, borde izq. `2px solid #0A84FF`, icono `Info` 14px.
Texto: "Los jugadores aparecen aquí cuando se unen al club desde la app Hoop Slam. La visualización de emails está sujeta al consentimiento del usuario."

**Buscador:** `Input` con icono `Search`, filtro client-side por nickname.

**Tabla (solo lectura, sin acciones):**
- `#` (índice)
- `Nickname`
- `Email` (si consentimiento confirmado, si no: "—")

Sin paginación para MVP. Contador: "Mostrando N de M miembros."

**Estado vacío:**
Icono `Users` 48px, "Sin miembros todavía", "Los jugadores aparecerán aquí cuando reserven o jueguen en alguna canasta de este club desde la app Hoop Slam."
Sin CTA — el gestor no puede crear jugadores desde el dashboard.

---

## 6. Decisión: Incidencias en sidebar

**Decisión: NO hay item de Incidencias en el sidebar como sección global.**

Las incidencias viven exclusivamente dentro del detalle de cada canasta (tab "Incidencias").

**Justificación:**
1. Volumen bajo esperado (1–5 activas simultáneas) — no justifica sección de primer nivel
2. Una incidencia siempre pertenece a una canasta específica — el contexto es la canasta, no el club
3. Con 3 items en el sidebar (Overview, Canastas, Miembros) la navegación es limpia

**Excepción controlada:** Para incidencias de prioridad Alta o Crítica sin resolver, badge rojo en el icono de campana del TopBar con enlace directo a la canasta afectada.

---

## Resumen de rutas del nuevo scope

| Ruta | Rol | Página |
|---|---|---|
| `/admin/clubs` | Admin | CRUD clubs |
| `/admin/gestores` | Admin | CRUD gestores |
| `/admin/clubs/:clubId/courts` | Admin | Asignación de canastas |
| `/gym/:gymId/overview` | Gestor | 5 KPIs + gráfica actividad |
| `/gym/:gymId/courts` | Gestor | Lista canastas del club |
| `/gym/:gymId/courts/:courtId` | Gestor | Detalle canasta (3 tabs) |
| `/gym/:gymId/members` | Gestor | Jugadores B2C (solo lectura) |
| `/gym/:gymId/reservations` | Gestor + Staff | Gestión de reservas |

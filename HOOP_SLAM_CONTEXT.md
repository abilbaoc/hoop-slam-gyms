# HOOP SLAM — Documento de Contexto Completo

## Para uso con Claude Code: 5 agentes colaborativos en paralelo

---

## 1. VISION GENERAL DEL PRODUCTO

**Hoop Slam** es un ecosistema de baloncesto urbano con tres capas:

### 1.1 Hardware (Canasta Inteligente)
- **Sensor de scoring**: Detecta automaticamente cuando el balon entra en la canasta (acelerometro + giroscopio + IR)
- **Panel LED**: Muestra marcador en tiempo real, animaciones de gol, temporizador de partido
- **Botones fisicos**: Inicio/fin de partido, seleccion de formato (1v1, 2v2, 3v3)
- **Conectividad**: WiFi para sync con cloud, BLE para comunicacion con app movil
- **Firmware**: Actualmente en v2.1.x, escrito en C++ para ESP32. Se actualiza OTA desde el dashboard
- **Heartbeat**: Cada canasta reporta su estado cada 60s (online/warning/error)
- **Alimentacion**: Bateria recargable + panel solar opcional

### 1.2 Firmware (ESP32)
- **Deteccion de partidos**: Algoritmo que detecta inicio/fin basado en actividad del sensor
- **Scoring automatico**: Cuenta canastas por equipo (A vs B), resuelve empates
- **Formatos**: 1v1 (a 11 pts), 2v2 (a 15 pts), 3v3 (a 21 pts) — configurable
- **Sync**: Envia resultados de partido a Firebase/Supabase al finalizar
- **OTA Updates**: Descarga firmware desde URL, aplica y reinicia
- **Diagnostico**: Reporta voltaje bateria, estado sensor, temperatura, RSSI WiFi
- **LED Control**: Protocolo WS2812B, 60 LEDs, animaciones predefinidas + custom

### 1.3 App Movil (Usuarios Finales — B2C)
- **Plataforma**: React Native (iOS + Android)
- **Backend original**: Firebase (Auth, Firestore, Cloud Functions)
- **Funcionalidades**:
  - Registro/login de jugadores
  - Buscar canastas cercanas (geolocalizacion)
  - Reservar franjas horarias
  - Ver marcador en vivo (BLE connection)
  - Historial de partidos personales
  - Rating ELO y rankings
  - Perfil de jugador (stats, nivel, recurrencia)
- **Datos que genera**: Matches, player stats, reservations (se comparten con el dashboard B2B)

### 1.4 Dashboard Web B2B (Este proyecto — Gestores de Gimnasio)
- **Plataforma**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (Auth, PostgreSQL, RLS) con mock data fallback
- **Deploy**: Vercel (hoop-slam-gyms.vercel.app)
- **Repositorio**: github.com/abilbaoc/hoop-slam-gyms
- **Proposito**: Panel de control para gestores de gimnasios con canastas Hoop Slam instaladas

---

## 2. ARQUITECTURA TECNICA DEL DASHBOARD B2B

### 2.1 Stack Tecnologico
```
Frontend:      React 19.2 + TypeScript 5.9
Build:         Vite 8.0
Styling:       Tailwind CSS 4.2 (dark theme, accent #7BFF00)
Charts:        Recharts 3.8
Icons:         Lucide React 0.577
Toasts:        Sonner 2.0
Dates:         date-fns 4.1 (locale es)
Auth:          Supabase Auth (con fallback mock)
Export:        jsPDF 4.2 + jspdf-autotable 5.0
Drag & Drop:   @dnd-kit/core 6.3
Deploy:        Vercel (auto-deploy desde master)
```

### 2.2 Estructura de Carpetas
```
src/
  App.tsx                    # Rutas principales
  main.tsx                   # Entry point
  contexts/
    AuthContext.tsx           # Auth dual-mode (Supabase + mock)
    GymContext.tsx            # Gym context (wrapper de GymLayout)
  hooks/
    usePermissions.ts        # Permisos por rol
  layouts/
    GymLayout.tsx             # Layout principal (/gym/:gymId/*)
    Sidebar.tsx               # Navegacion desktop
    TopBar.tsx                # Header con notificaciones + user
    MobileNav.tsx             # Navegacion movil
    DashboardLayout.tsx       # Legacy (no usado)
  lib/
    supabase.ts              # Cliente Supabase (o null)
  types/
    auth.ts                  # Roles, permisos, AppUser
    gym.ts                   # Gym + GymOpeningHours
    court.ts                 # Court + CourtMapPosition
    match.ts                 # Match + MatchFormat
    player.ts                # Player + RecurrenceLevel
    analytics.ts             # KPIData, DailyMatches, Heatmap, etc.
    revenue.ts               # RevenueData
    config.ts                # Schedule, Pricing, Promo, Reservation
    audit.ts                 # AuditEntry
    notification.ts          # AppNotification
    maintenance.ts           # MaintenanceTicket, MaintenanceLog
    onboarding.ts            # OnboardingData
    index.ts                 # Barrel exports
  data/
    api.ts                   # 50+ funciones async mock API
    schema.ts                # Schema documentacion (TypeScript)
    provider.ts              # DataProvider abstraction
    providers/mock.ts        # Mock implementation
    mock/
      gyms.ts                # 3 gimnasios Barcelona
      courts.ts              # 8 canastas
      matches.ts             # ~500 partidos (30 dias)
      players.ts             # 80 jugadores
      reservations.ts        # 100 reservas
      users.ts               # 8 usuarios
      notifications.ts       # 15 notificaciones
      maintenance.ts         # 10 tickets + 20 logs
      courtPositions.ts      # Posiciones mapa
      pricing.ts             # Reglas de precio + promos
      schedules.ts           # Horarios canastas
      audit.ts               # Audit log en memoria
      generators.ts          # Generadores analytics (KPIs, heatmap)
      seed-random.ts         # RNG con seed para datos consistentes
  components/
    ui/                      # Badge, Button, Card, Input, Modal, Select, Skeleton, Table, Tabs, EmptyState
    shared/                  # CourtStatusBadge, FormatBadge, TrendIndicator, ExportButton, GymSelector
    kpi/                     # KPICard, KPIGrid
  pages/
    Auth/                    # LoginPage, SignupPage
    Onboarding/              # OnboardingPage + 4 StepComponents + StepIndicator
    GymList/                 # GymListPage (selector de gym)
    Overview/                # Dashboard (7 archivos: KPIs, charts, activity)
    Courts/                  # CourtsPage, CourtDetailPage
    Map/                     # GymMapPage, FloorPlan, CourtMarker, CourtDetailPanel
    Matches/                 # MatchesPage
    Players/                 # PlayersPage
    Reservations/            # ReservationsPage
    Settings/                # SettingsPage + 10 sub-componentes (Schedule, Pricing, Promos)
    Reports/                 # ReportsPage (audit, export)
    Maintenance/             # MaintenancePage + TicketDetail + CreateTicketModal
    Notifications/           # NotificationsPage
    Users/                   # UsersPage
    GymProfile/              # GymProfilePage
  utils/
    formatters.ts            # Formateo fechas, numeros, duracion, ELO
    export.ts                # CSV/PDF generation
  theme/
    tokens.ts                # Colores, chart colors, heatmap scale
supabase/
  schema.sql                 # DDL completo: profiles, gyms, courts, matches, reservations, notifications, audit_log + RLS + triggers
```

### 2.3 Rutas
```
/login                         → LoginPage (email/password o mock roles)
/signup                        → SignupPage (solo con Supabase)
/onboarding                    → Wizard 4 pasos (gym + horarios + canasta + listo)
/                              → GymListPage (grid de gyms) o redirect a /login

/gym/:gymId/
  dashboard                    → Overview (KPIs + charts + actividad)
  courts                       → CRUD canastas
  courts/:id                   → Detalle canasta
  map                          → Mapa visual del gimnasio (drag & drop)
  matches                      → Tabla partidos con filtros
  players                      → Rankings ELO + stats
  reservations                 → Calendario + tabla reservas
  reports                      → Audit log + export CSV/PDF
  settings                     → Horarios + precios + promos
  profile                      → Info del gimnasio
  users                        → Gestion usuarios
  maintenance                  → Tickets mantenimiento
  notifications                → Centro notificaciones
```

### 2.4 Sistema de Roles y Permisos
```
Admin:   Todo (todos los gyms, todos los permisos)
Gestor:  Su gym: canchas, precios, analytics, reservas, perfil, mantenimiento
Staff:   Solo reservas de su gym

7 permisos: can_manage_courts, can_manage_pricing, can_manage_users,
            can_view_analytics, can_manage_reservations, can_edit_gym_profile,
            can_manage_maintenance
```

### 2.5 Modo Dual (Supabase + Mock)
- Si `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estan configurados → auth real Supabase
- Si no → mock login con selector de roles (datos demo)
- Toggle automatico via `isSupabaseConfigured` en `src/lib/supabase.ts`
- Profile caching en localStorage para resiliencia

---

## 3. MODELO DE DATOS

### 3.1 Entidades Principales

**Gym** (3 mock):
```typescript
{ id, name, slug, address, city, timezone, phone, email, openingHours: { weekdayOpen, weekdayClose, weekendOpen, weekendClose }, courts: string[], createdAt }
```

**Court** (8 mock, distribuidas entre 3 gyms):
```typescript
{ id, gymId, name, location, status: 'online'|'offline'|'maintenance', installedDate, firmwareVersion?, lastHeartbeat?, sensorStatus: 'ok'|'warning'|'error' }
// + CourtMapPosition: { courtId, x: number, y: number } para mapa visual
```

**Match** (~500 mock, 30 dias):
```typescript
{ id, courtId, format: '1v1'|'2v2'|'3v3', scoreA, scoreB, duration, startedAt, endedAt, playerCount }
// Generados con seed RNG. Peak hours 18-20h, weekend boost 30%
```

**Player** (80 mock):
```typescript
{ id, gymId, name, initials, elo: 1.0-5.0, level, matchesPlayed, wins, losses, preferredFormat, lastPlayedAt, recurrence: 'diario'|'semanal'|'mensual'|'inactivo', joinedAt }
```

**Reservation** (100 mock):
```typescript
{ id, courtId, date, startTime, endTime, playerName, format, status: 'confirmed'|'cancelled'|'blocked', createdAt }
```

**PricingRule**:
```typescript
{ id, gymId, name, type: 'base'|'peak'|'offpeak'|'weekend', priceEur, startHour?, endHour?, daysOfWeek?[] }
```

**MaintenanceTicket** (10 mock):
```typescript
{ id, courtId, gymId, title, description, priority: 'low'|'medium'|'high'|'critical', status: 'open'|'in_progress'|'resolved'|'closed', assignedTo?, createdBy, createdAt, updatedAt, resolvedAt? }
```

**AppNotification** (15 mock):
```typescript
{ id, gymId, type: 'maintenance_alert'|'reservation_confirmation'|'system_alert'|'low_occupancy_warning', title, message, read, createdAt }
```

### 3.2 Supabase Schema (produccion)
```sql
-- Tablas: profiles, gyms, courts, matches, reservations, notifications, audit_log
-- Todas con RLS habilitado
-- Trigger handle_new_user() auto-crea perfil al signup
-- Ver supabase/schema.sql para DDL completo
```

---

## 4. DESIGN SYSTEM

### 4.1 Colores
```
Accent:          #7BFF00 (verde neon — color primario de marca)
Accent Dim:      #5ABF00
Background:      #000000 (negro puro)
Card Background: #1C1C1E
Card Hover:      #2C2C2E
Border:          #2C2C2E
Text Primary:    #FFFFFF
Text Secondary:  #8E8E93
Text Tertiary:   #636366
Success:         #34C759
Warning:         #FF9F0A
Error:           #FF453A
```

### 4.2 Tipografia
- Headers: `font-display` (custom, estilo urbano/deportivo, uppercase)
- Body: `Poppins` (Google Fonts, weights 400/500/600/700)
- Monospace: system

### 4.3 Componentes UI Reutilizables
```
Button:    variants: primary (#7BFF00), secondary (#2C2C2E), ghost
           sizes: sm, md, lg
Card:      bg-[#1C1C1E] rounded-2xl, hover opcional
Modal:     overlay blur, ESC to close, header/body/footer
Input:     bg-[#2C2C2E] rounded-xl, focus ring verde, label + error
Badge:     variants: green, gray, red, yellow, blue; sizes: sm, md
Tabs:      active indicator verde
Table:     thead dark, tbody alternating
Select:    dropdown dark theme
Skeleton:  loading placeholder
EmptyState: icono + mensaje centrado
```

### 4.4 Responsive
- Desktop: Sidebar fijo 260px + main content
- Mobile (<1024px): Bottom nav + TopBar, sidebar oculto

---

## 5. DEFINICION DE LOS 5 AGENTES

### Agente 1: FIRMWARE ENGINEER
**Responsabilidad**: Todo lo relacionado con el firmware ESP32 de las canastas
**Scope**:
- Codigo C++ para ESP32 (deteccion scoring, formatos partido, LED control)
- Protocolo de comunicacion canasta ↔ cloud (heartbeat, match upload, OTA)
- Diagnostico de hardware (bateria, sensor, temperatura, WiFi RSSI)
- Simulador de firmware para testing (generar datos mock realistas)
- Definir protocolo de mensajes (JSON schema para heartbeats, match results, errors)

**Interaccion con otros agentes**:
- → Backend: Define formato de datos que la canasta envia
- → Dashboard: Provee specs de firmware version, sensor status, heartbeat protocol
- ← Dashboard: Recibe comandos OTA, configuracion de formatos/scoring

### Agente 2: BACKEND ENGINEER
**Responsabilidad**: API, base de datos, logica de negocio server-side
**Scope**:
- Supabase schema (tablas, indices, RLS policies, triggers, funciones)
- Edge Functions (cloud functions para logica compleja)
- Integracion Firebase ↔ Supabase (sync datos app movil)
- API endpoints reales que reemplacen los mocks
- Webhooks para recibir datos del firmware
- Caching, rate limiting, pagination
- Migraciones de base de datos

**Interaccion con otros agentes**:
- → Dashboard: Provee API contracts (endpoints, payloads, errors)
- → Firmware: Define endpoints para heartbeat, match upload
- → Mobile: Provee endpoints de reservas, jugadores, rankings
- ← Todos: Recibe requerimientos de datos

### Agente 3: FRONTEND/DASHBOARD ENGINEER
**Responsabilidad**: El dashboard web B2B (este proyecto React)
**Scope**:
- Nuevas paginas y features del dashboard
- Componentes UI reutilizables
- Integracion con API real (reemplazar mocks por Supabase queries)
- Performance, lazy loading, code splitting
- Responsive design, animaciones
- Accesibilidad (a11y)
- Testing (unit + integration)

**Interaccion con otros agentes**:
- ← Backend: Consume API endpoints
- ← UX: Recibe wireframes y flujos de usuario
- → Backend: Reporta necesidades de datos/endpoints nuevos
- → Firmware: Muestra estado de canastas, permite OTA updates

### Agente 4: MOBILE APP ENGINEER
**Responsabilidad**: App movil React Native (B2C para jugadores)
**Scope**:
- App React Native (iOS + Android)
- Firebase Auth → migracion a Supabase Auth
- BLE connection con canastas (ver marcador en vivo)
- Geolocalizacion y busqueda de canastas cercanas
- Sistema de reservas desde movil
- Perfil de jugador, historial de partidos, ELO
- Push notifications
- Deep linking con dashboard B2B

**Interaccion con otros agentes**:
- → Backend: Consume misma API que dashboard
- → Firmware: Comunicacion BLE directa con canastas
- ← Backend: Recibe datos de partidos, reservas, rankings
- ← UX: Recibe disenos y flujos moviles

### Agente 5: UX/PRODUCT DESIGNER
**Responsabilidad**: Experiencia de usuario, diseno, y estrategia de producto
**Scope**:
- Wireframes y mockups para nuevas features
- User journeys (gestor de gym, staff, jugador)
- Design system (mantener consistencia dark theme + verde neon)
- Research competitivo (Mindbody, Stripe, Calendly analogias)
- Definir roadmap de features priorizadas
- A/B testing proposals
- Onboarding flows (B2B y B2C)
- Metricas de exito (KPIs del producto, no del gym)

**Interaccion con otros agentes**:
- → Dashboard: Entrega wireframes y specs de UI
- → Mobile: Entrega disenos moviles
- → Backend: Define requisitos funcionales
- → Firmware: Define UX de la canasta fisica (LEDs, botones, feedback)

---

## 6. ESTADO ACTUAL Y PROXIMOS PASOS

### 6.1 Lo que YA esta construido (Dashboard B2B)
- [x] Auth completo (Supabase + mock fallback)
- [x] Signup + Onboarding wizard (4 pasos)
- [x] Multi-gym con roles (Admin/Gestor/Staff)
- [x] Dashboard con 7 KPIs + 4 charts
- [x] CRUD canastas con status/firmware/sensor
- [x] Mapa visual del gimnasio (drag & drop)
- [x] Reservas (calendario + tabla + bloqueo)
- [x] Horarios + excepciones
- [x] Precios + promociones
- [x] Jugadores (ranking ELO, recurrencia)
- [x] Partidos (filtros por formato, canasta, dias)
- [x] Mantenimiento (tickets con prioridad/status/logs)
- [x] Notificaciones (4 tipos, read/unread)
- [x] Usuarios (por gym, roles)
- [x] Perfil del gimnasio
- [x] Export CSV/PDF
- [x] Audit log
- [x] Deploy en Vercel + Supabase (produccion)

### 6.2 Lo que FALTA (por agente)

**Firmware**:
- [ ] Protocolo de heartbeat documentado (JSON schema)
- [ ] Simulador de canasta (genera datos como si fuera hardware real)
- [ ] OTA update flow end-to-end
- [ ] Protocolo BLE para app movil

**Backend**:
- [ ] Migrar de mock data a Supabase queries reales
- [ ] Edge Functions para logica compleja (scoring validation, analytics aggregation)
- [ ] Webhook endpoint para recibir datos del firmware
- [ ] Sync Firebase (app movil) ↔ Supabase (dashboard)
- [ ] Stripe integration para pagos de reservas

**Dashboard**:
- [ ] Conectar a API real (reemplazar api.ts mock)
- [ ] Real-time subscriptions (Supabase Realtime)
- [ ] OTA firmware update UI
- [ ] Dashboard de revenue detallado
- [ ] Graficas de tendencia (semana vs semana anterior)
- [ ] Modo oscuro/claro toggle
- [ ] i18n (espanol/ingles/catalan)
- [ ] PWA (offline-first)

**Mobile**:
- [ ] Migrar de Firebase a Supabase
- [ ] BLE pairing con canasta
- [ ] Marcador en vivo via BLE
- [ ] Reservas desde app
- [ ] Push notifications (new match, reservation reminder)

**UX/Product**:
- [ ] Landing page publica (marketing)
- [ ] Pricing page (planes SaaS)
- [ ] Flujo de onboarding B2C (jugadores)
- [ ] Gamification (achievements, streaks, tournaments)
- [ ] White-label options para gimnasios grandes

---

## 7. COMO USAR ESTE DOCUMENTO

Cada agente de Claude Code debe:

1. **Leer este documento** al inicio de su sesion
2. **Identificar su scope** segun la seccion 5
3. **Consultar la seccion 3** (modelo de datos) para entender las entidades
4. **Respetar el design system** (seccion 4) para consistencia visual
5. **Coordinar via archivos** — cada agente escribe en su directorio/archivos asignados
6. **No pisar trabajo de otros** — respetar los boundaries definidos
7. **Usar los tipos existentes** en `src/types/` como contrato compartido
8. **Seguir patrones existentes** — mirar el codigo actual antes de crear algo nuevo

### Prompt para inicializar cada agente:
```
Eres el [NOMBRE DEL AGENTE] del proyecto Hoop Slam.
Lee el archivo HOOP_SLAM_CONTEXT.md para entender el proyecto completo.
Tu scope es: [SECCION 5.X]
Los archivos que puedes modificar son: [LISTA]
Coordina con los otros agentes via los tipos compartidos en src/types/.
```

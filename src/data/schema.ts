/**
 * Hoop Slam B2B - Production Database Schema
 * Target: Supabase (PostgreSQL) or Firestore
 *
 * This file documents the production-ready schema.
 * It does not affect runtime — it serves as a reference for backend implementation.
 */

// ═══════════════════════════════════════════════════
// GYMS — Primary entity, one per physical location
// ═══════════════════════════════════════════════════
export interface GymSchema {
  id: string;                    // UUID, primary key
  name: string;                  // "Polideportivo Municipal BCN"
  slug: string;                  // "polideportivo-bcn" (URL-friendly)
  address: string;
  city: string;
  timezone: string;              // "Europe/Madrid"
  phone: string;
  email: string;
  logo_url: string | null;
  opening_hours: {
    weekday_open: string;        // "08:00"
    weekday_close: string;
    weekend_open: string;
    weekend_close: string;
  };
  created_at: string;            // ISO timestamp
  updated_at: string;
}
// Index: slug (unique)
// RLS: Users can only read gyms they belong to via gym_users

// ═══════════════════════════════════════════════════
// COURTS — Basketball hoops within a gym
// ═══════════════════════════════════════════════════
export interface CourtSchema {
  id: string;                    // UUID
  gym_id: string;                // FK → gyms.id
  name: string;                  // "Canasta Norte"
  location: string;              // Physical location description
  status: 'online' | 'offline' | 'maintenance';
  sensor_status: 'ok' | 'warning' | 'error';
  firmware_version: string | null;
  last_heartbeat: string | null; // ISO timestamp
  installed_date: string;        // ISO date
  created_at: string;
}
// Index: gym_id
// RLS: Inherits from gym access

// ═══════════════════════════════════════════════════
// MATCHES — Game records from the hardware
// ═══════════════════════════════════════════════════
export interface MatchSchema {
  id: string;
  court_id: string;              // FK → courts.id
  gym_id: string;                // FK → gyms.id (denormalized for query perf)
  format: '1v1' | '2v2' | '3v3';
  score_a: number;
  score_b: number;
  duration: number;              // minutes
  player_count: number;
  started_at: string;            // ISO timestamp
  ended_at: string;
}
// Index: gym_id + started_at (composite, desc)
// Index: court_id + started_at
// RLS: Read-only for gym members

// ═══════════════════════════════════════════════════
// PLAYERS — End users from the mobile app
// ═══════════════════════════════════════════════════
export interface PlayerSchema {
  id: string;
  name: string;
  initials: string;
  elo: number;
  level: string;                 // "Basico", "Intermedio", etc.
  matches_played: number;
  wins: number;
  losses: number;
  preferred_format: '1v1' | '2v2' | '3v3';
  last_played_at: string;
  recurrence: 'diario' | 'semanal' | 'mensual' | 'inactivo';
  joined_at: string;
}
// Index: elo (desc), last_played_at
// Note: Players are shared across gyms (they play at multiple locations)

// ═══════════════════════════════════════════════════
// RESERVATIONS — Bookings for court time slots
// ═══════════════════════════════════════════════════
export interface ReservationSchema {
  id: string;
  court_id: string;              // FK → courts.id
  gym_id: string;                // FK → gyms.id (denormalized)
  date: string;                  // ISO date "2026-03-19"
  start_time: string;            // "17:00"
  end_time: string;              // "17:30"
  player_name: string;
  format: '1v1' | '2v2' | '3v3';
  status: 'confirmed' | 'cancelled' | 'blocked';
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;   // FK → users.id
}
// Index: gym_id + date + court_id (composite)
// Index: gym_id + status
// RLS: Gym members can read. Gestors can write.

// ═══════════════════════════════════════════════════
// USERS — Dashboard users (B2B staff)
// ═══════════════════════════════════════════════════
export interface UserSchema {
  id: string;                    // UUID, linked to Supabase Auth
  name: string;
  email: string;                 // unique
  avatar_url: string | null;
  created_at: string;
  last_active_at: string;
}
// Index: email (unique)

// ═══════════════════════════════════════════════════
// GYM_USERS — Junction table: user ↔ gym + role
// ═══════════════════════════════════════════════════
export interface GymUserSchema {
  id: string;
  user_id: string;               // FK → users.id
  gym_id: string;                // FK → gyms.id
  role: 'admin' | 'gestor' | 'staff';
  permissions: string[];         // Array of Permission strings
  assigned_at: string;
}
// Index: user_id + gym_id (unique composite)
// Index: gym_id
// RLS: Only admins and gestors of the gym can manage

// ═══════════════════════════════════════════════════
// PRICING_RULES — Price configuration per gym
// ═══════════════════════════════════════════════════
export interface PricingRuleSchema {
  id: string;
  gym_id: string;                // FK → gyms.id
  name: string;
  type: 'base' | 'peak' | 'offpeak' | 'weekend';
  price_eur: number;
  start_hour: number | null;
  end_hour: number | null;
  days_of_week: number[] | null; // 0=Mon..6=Sun
  created_at: string;
}
// Index: gym_id

// ═══════════════════════════════════════════════════
// PROMOS — Promotional offers per gym
// ═══════════════════════════════════════════════════
export interface PromoSchema {
  id: string;
  gym_id: string;                // FK → gyms.id
  name: string;
  type: 'percentage' | 'fixed' | 'free';
  value: number;
  conditions: string;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
}
// Index: gym_id + active

// ═══════════════════════════════════════════════════
// COURT_SCHEDULES — Operating hours per court
// ═══════════════════════════════════════════════════
export interface CourtScheduleSchema {
  court_id: string;              // FK → courts.id, primary key
  gym_id: string;                // FK → gyms.id (denormalized)
  weekday_open: string;
  weekday_close: string;
  weekend_open: string;
  weekend_close: string;
  is_open: boolean;
}
// Index: gym_id

// ═══════════════════════════════════════════════════
// SCHEDULE_EXCEPTIONS — Special hours/closures
// ═══════════════════════════════════════════════════
export interface ScheduleExceptionSchema {
  id: string;
  court_id: string;              // FK → courts.id
  date: string;                  // ISO date
  reason: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  created_at: string;
}
// Index: court_id + date

// ═══════════════════════════════════════════════════
// NOTIFICATIONS — System notifications per gym
// ═══════════════════════════════════════════════════
export interface NotificationSchema {
  id: string;
  gym_id: string;                // FK → gyms.id
  type: 'maintenance_alert' | 'reservation_confirmation' | 'system_alert' | 'low_occupancy_warning';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  read_at: string | null;
}
// Index: gym_id + created_at (desc)
// Index: gym_id + read

// ═══════════════════════════════════════════════════
// AUDIT_LOG — All write operations
// ═══════════════════════════════════════════════════
export interface AuditLogSchema {
  id: string;
  gym_id: string;                // FK → gyms.id
  user_id: string;               // FK → users.id
  action: 'create' | 'update' | 'delete';
  entity: 'court' | 'reservation' | 'schedule' | 'pricing' | 'promo' | 'gym' | 'user';
  entity_id: string;
  description: string;
  timestamp: string;
}
// Index: gym_id + timestamp (desc)
// RLS: Read-only for gym gestors. Write via server-side triggers.

/**
 * SECURITY RULES (Supabase RLS):
 *
 * 1. All tables filtered by gym_id through gym_users junction
 * 2. Admin role: full access to all gyms
 * 3. Gestor role: full CRUD on their assigned gym
 * 4. Staff role: read-only on most tables, can manage reservations
 * 5. Audit log: append-only, no user deletes
 * 6. Players table: read-only from B2B dashboard (written by mobile app)
 * 7. Matches table: read-only (written by firmware/cloud functions)
 */

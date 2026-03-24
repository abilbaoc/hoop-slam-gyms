export type CourtStatus = 'online' | 'offline' | 'maintenance';
export type SensorStatus = 'ok' | 'warning' | 'error';

export interface Court {
  id: string;
  gymId: string;
  name: string;
  location: string;
  status: CourtStatus;
  installedDate: string; // ISO date
  firmwareVersion?: string;
  lastHeartbeat?: string; // ISO datetime
  sensorStatus: SensorStatus;
  // New scope fields
  is_active: boolean;
  address: string;
  opening_time: string;  // "09:00"
  closing_time: string;  // "21:00"
  is_visible: boolean;
  match_duration_minutes: number;
  slot_duration_minutes: number;
}

export interface CourtMapPosition {
  courtId: string;
  x: number;
  y: number;
}

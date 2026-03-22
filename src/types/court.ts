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
}

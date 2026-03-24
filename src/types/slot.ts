export type SlotStatus = 'available' | 'reserved' | 'blocked';

export interface CourtSlot {
  id: string;
  courtId: string;
  date: string;       // "2026-03-24"
  startTime: string;  // "09:00"
  endTime: string;    // "09:30"
  status: SlotStatus;
  createdAt: string;
}

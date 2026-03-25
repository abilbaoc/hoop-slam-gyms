import type { CourtSlot } from '../../types/slot';

// Slots are created at runtime by the gym operator via the dashboard.
// Starts empty — no pre-populated mock data, since court IDs come from Firebase.
export let courtSlots: CourtSlot[] = [];

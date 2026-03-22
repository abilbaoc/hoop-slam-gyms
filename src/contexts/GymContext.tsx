// Re-export from GymLayout for backward compatibility
// Pages use useGym() which now reads from GymLayout context
import { useGymLayout } from '../layouts/GymLayout';
import type { Gym } from '../types/gym';

export function useGym(): { currentGym: Gym | null; gymId: string } {
  try {
    const ctx = useGymLayout();
    return { currentGym: ctx.gym, gymId: ctx.gymId };
  } catch {
    return { currentGym: null, gymId: '' };
  }
}

// Keep GymProvider as a no-op wrapper for backward compat
export function GymProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

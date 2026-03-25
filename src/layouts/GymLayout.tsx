import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import type { Gym } from '../types/gym';
import { getGymById } from '../data/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

interface GymLayoutContextValue {
  gym: Gym;
  gymId: string;
}

const GymLayoutContext = createContext<GymLayoutContextValue | null>(null);

export function useGymLayout() {
  const ctx = useContext(GymLayoutContext);
  if (!ctx) throw new Error('useGymLayout must be used within GymLayout');
  return ctx;
}

export default function GymLayout() {
  const { gymId } = useParams<{ gymId: string }>();
  const { canAccessGym, isAuthenticated, currentUser, updateUserGymIds } = useAuth();
  const [gym, setGym] = useState<Gym | null | undefined>(undefined); // undefined=loading, null=not found

  useEffect(() => {
    if (gymId) {
      getGymById(gymId).then(g => setGym(g ?? null));
    }
  }, [gymId]);

  // Clear stale gymIds when the gym no longer exists in the DB
  useEffect(() => {
    if (gym === null && currentUser?.role !== 'admin' && (currentUser?.gymIds?.length ?? 0) > 0) {
      updateUserGymIds([]);
    }
  }, [gym]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (gym === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gym) {
    if (currentUser?.role === 'admin') return <Navigate to="/admin/clubs" replace />;
    if (currentUser?.role === 'staff') return <Navigate to="/pending" replace />;
    return <Navigate to="/login" replace />;
  }

  return (
    <GymLayoutContext.Provider value={{ gym, gymId: gym.id }}>
      <div className="min-h-screen bg-black">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="lg:ml-[260px] transition-all duration-300">
          <TopBar />
          <main className="p-4 sm:p-6 pb-24 lg:pb-6">
            <Outlet />
          </main>
        </div>
        <MobileNav />
      </div>
    </GymLayoutContext.Provider>
  );
}

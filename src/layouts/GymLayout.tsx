import { Outlet, useParams, Navigate } from 'react-router-dom';
import { createContext, useContext } from 'react';
import type { Gym } from '../types/gym';
import { gyms } from '../data/mock/gyms';
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
  const { canAccessGym, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const gym = gyms.find((g) => g.id === gymId);

  if (!gym) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-white">Gimnasio no encontrado</p>
          <p className="text-[#8E8E93]">El gimnasio con ID &quot;{gymId}&quot; no existe.</p>
          <a href="/" className="text-[#7BFF00] underline text-sm">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (!canAccessGym(gym.id)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-white">Acceso denegado</p>
          <p className="text-[#8E8E93]">No tienes permisos para acceder a este gimnasio.</p>
          <a href="/" className="text-[#7BFF00] underline text-sm">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <GymLayoutContext.Provider value={{ gym, gymId: gym.id }}>
      <div className="min-h-screen bg-black">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="lg:ml-[260px] transition-all duration-300">
          <TopBar />
          <main className="p-4 sm:p-6 pb-24 lg:pb-6">
            <Outlet />
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </GymLayoutContext.Provider>
  );
}

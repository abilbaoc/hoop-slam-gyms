import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useParams, Navigate, Link, useLocation } from 'react-router-dom';
import { Lock, SearchX } from 'lucide-react';
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

function GateScreen({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#2C2C2E] flex items-center justify-center mx-auto">{icon}</div>
        <h1 className="text-2xl text-white">{title}</h1>
        <div className="text-sm text-[#8E8E93] space-y-2">{children}</div>
        <Link to="/" className="inline-block text-sm text-[#7BFF00] hover:underline">Ir a mi inicio</Link>
      </div>
    </div>
  );
}

export default function GymLayout() {
  const { gymId } = useParams<{ gymId: string }>();
  const location = useLocation();
  const { isAuthenticated, currentUser, canAccessGym } = useAuth();
  // Result tagged with the gymId it belongs to: switching clubs reads as "loading" until the new one arrives.
  const [loaded, setLoaded] = useState<{ key: string; gym: Gym | null } | null>(null);
  const gym: Gym | null | undefined = loaded && loaded.key === gymId ? loaded.gym : undefined; // undefined=loading, null=not found

  useEffect(() => {
    if (!gymId || !isAuthenticated) return;
    let cancelled = false;
    getGymById(gymId)
      .then((g) => { if (!cancelled) setLoaded({ key: gymId, gym: g ?? null }); })
      .catch((err) => {
        console.error('[GymLayout] getGymById:', err);
        if (!cancelled) setLoaded({ key: gymId, gym: null });
      });
    return () => { cancelled = true; };
  }, [gymId, isAuthenticated]);

  // Remember the requested page (e.g. /gym/laieta/lab) so login brings the user back to it.
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  if (gym === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gym) {
    if (currentUser?.role === 'admin') return <Navigate to="/admin/clubs" replace />;
    return (
      <GateScreen icon={<SearchX size={26} className="text-[#8E8E93]" />} title="Club no encontrado">
        <p>
          No existe ningún club con el identificador <span className="text-white font-mono">{gymId}</span>, o no se ha
          podido cargar ahora mismo. Revisa el enlace o vuelve a intentarlo en unos minutos.
        </p>
      </GateScreen>
    );
  }

  if (!canAccessGym(gym.id)) {
    return (
      <GateScreen icon={<Lock size={24} className="text-[#8E8E93]" />} title="Sin acceso a este club">
        <p>
          Tu cuenta <span className="text-white">{currentUser?.email}</span> no está asignada a{' '}
          <span className="text-white">{gym.name}</span>.
        </p>
        <p>Pide a un administrador que te asigne a este club desde Admin → Gestores.</p>
      </GateScreen>
    );
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

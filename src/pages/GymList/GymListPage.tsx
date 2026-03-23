import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { gyms } from '../../data/mock/gyms';
import { ROLE_LABELS } from '../../types/auth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function GymListPage() {
  const { currentUser, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  // Filter gyms the user can access
  // If user has no gyms assigned (new Supabase user), show all gyms for demo purposes
  const hasNoGyms = !currentUser?.gymIds || currentUser.gymIds.length === 0;
  const accessibleGyms = currentUser?.role === 'admin' || hasNoGyms
    ? gyms
    : gyms.filter((g) => currentUser?.gymIds.includes(g.id));

  // Auto-redirect if only 1 gym
  useEffect(() => {
    if (isAuthenticated && accessibleGyms.length === 1) {
      navigate(`/gym/${accessibleGyms[0].id}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, accessibleGyms, navigate]);

  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  if (accessibleGyms.length === 1) return null; // redirecting

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-16 bg-black/80 backdrop-blur-md border-b border-[#2C2C2E] flex items-center justify-between px-6">
        <h1 className="font-display text-2xl text-[#7BFF00]">HOOP SLAM</h1>

        <div className="flex items-center gap-3">
          {currentUser && (
            <>
              <div className="w-9 h-9 rounded-full bg-[#7BFF00] flex items-center justify-center">
                <span className="text-black font-bold text-sm">{currentUser.avatarInitials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                <Badge variant="green" size="sm">{ROLE_LABELS[currentUser.role]}</Badge>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Selecciona un gimnasio</h2>
          <p className="text-sm text-[#8E8E93]">Elige el gimnasio que quieres gestionar</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleGyms.map((gym) => (
            <Card
              key={gym.id}
              hover
              onClick={() => navigate(`/gym/${gym.id}/dashboard`)}
              className="space-y-3"
            >
              <h3 className="text-lg font-bold text-white">{gym.name}</h3>
              <div className="flex items-center gap-1.5 text-[#8E8E93] text-sm">
                <MapPin size={14} />
                <span>{gym.city}</span>
              </div>
              <p className="text-xs text-[#636366]">{gym.address}</p>
              <div className="pt-2 border-t border-[#2C2C2E]">
                <Badge variant="green">{gym.courts.length} canchas</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

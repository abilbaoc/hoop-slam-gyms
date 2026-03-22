import { useEffect, useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGymLayout } from './GymLayout';
import { ROLE_LABELS } from '../types/auth';
import { getUnreadNotificationCount } from '../data/api';

export default function TopBar() {
  const { currentUser, signOut } = useAuth();
  const { gym, gymId } = useGymLayout();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getUnreadNotificationCount(gymId).then(setUnreadCount);
  }, [gymId]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-black/80 backdrop-blur-md border-b border-[#2C2C2E] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white lg:hidden leading-none truncate">{gym.name}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          onClick={() => navigate(`/gym/${gymId}/notifications`)}
          className="relative p-2 rounded-xl text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E] transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#7BFF00] rounded-full flex items-center justify-center">
              <span className="text-black text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </span>
          )}
        </button>

        {/* User */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7BFF00] flex items-center justify-center">
              <span className="text-black font-bold text-sm">{currentUser.avatarInitials}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
              <p className="text-xs text-[#8E8E93]">{ROLE_LABELS[currentUser.role]}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="p-2 rounded-xl text-[#636366] hover:text-white hover:bg-[#1C1C1E] transition-colors"
          title="Cerrar sesion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

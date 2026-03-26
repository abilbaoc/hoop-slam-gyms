import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Trophy,
  UserCog,
} from 'lucide-react';
import { useGymLayout } from './GymLayout';

export default function MobileNav() {
  const { gymId } = useGymLayout();
  const prefix = `/gym/${gymId}`;

  const mobileNavItems = [
    { to: `${prefix}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { to: `${prefix}/courts`, icon: MapPin, label: 'Cestas' },
    { to: `${prefix}/matches`, icon: Trophy, label: 'Partidos' },
    { to: `${prefix}/reservations`, icon: Calendar, label: 'Reservas' },
    { to: `${prefix}/users`, icon: UserCog, label: 'Usuarios' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F] border-t border-[#2C2C2E] lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                isActive ? 'text-[#7BFF00]' : 'text-[#8E8E93]'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

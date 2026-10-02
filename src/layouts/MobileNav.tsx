import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Wrench,
  Building2,
} from 'lucide-react';
import { useGymLayout } from './GymLayout';

export default function MobileNav() {
  const { gymId } = useGymLayout();
  const prefix = `/gym/${gymId}`;

  const mobileNavItems = [
    { to: `${prefix}/dashboard`, icon: LayoutDashboard, label: 'Inicio', name: 'Dashboard' },
    { to: `${prefix}/courts`, icon: MapPin, label: 'Cestas', name: 'Cestas' },
    { to: `${prefix}/reservations`, icon: Calendar, label: 'Reservas', name: 'Reservas' },
    { to: `${prefix}/maintenance`, icon: Wrench, label: 'Incid.', name: 'Incidencias' },
    { to: `${prefix}/users`, icon: Users, label: 'Usuarios', name: 'Usuarios' },
    { to: `${prefix}/profile`, icon: Building2, label: 'Club', name: 'Perfil del club' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0F] border-t border-[#2C2C2E] lg:hidden">
      {/* Equal-width columns: six items must fit a 320px phone without overflowing. */}
      <div className="grid grid-cols-6 items-center h-16 px-1">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.name}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-0 px-0.5 py-1.5 rounded-xl text-[10px] transition-colors ${
                isActive ? 'text-[#7BFF00]' : 'text-[#8E8E93]'
              }`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

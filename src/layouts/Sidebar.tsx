import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Map,
  Swords,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  UserCog,
  Bell,
  ArrowLeft,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { useGymLayout } from './GymLayout';
import { usePermissions } from '../hooks/usePermissions';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { gym, gymId } = useGymLayout();
  const { canManageUsers, canViewAnalytics, canManagePricing, canManageMaintenance } = usePermissions();
  const navigate = useNavigate();

  const prefix = `/gym/${gymId}`;

  const navItems = [
    { to: `${prefix}/dashboard`, icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: `${prefix}/courts`, icon: MapPin, label: 'Canchas', show: true },
    { to: `${prefix}/map`, icon: Map, label: 'Mapa', show: true },
    { to: `${prefix}/matches`, icon: Swords, label: 'Partidos', show: canViewAnalytics },
    { to: `${prefix}/players`, icon: Users, label: 'Jugadores', show: canViewAnalytics },
    { to: `${prefix}/reservations`, icon: Calendar, label: 'Reservas', show: true },
    { to: `${prefix}/reports`, icon: FileText, label: 'Reportes', show: canViewAnalytics },
    { to: `${prefix}/settings`, icon: Settings, label: 'Configuracion', show: canManagePricing },
    { to: `${prefix}/profile`, icon: Building2, label: 'Perfil Gym', show: true },
    { to: `${prefix}/users`, icon: UserCog, label: 'Usuarios', show: canManageUsers },
    { to: `${prefix}/maintenance`, icon: Wrench, label: 'Mantenimiento', show: canManageMaintenance },
    { to: `${prefix}/notifications`, icon: Bell, label: 'Notificaciones', show: true },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0A0A0F] border-r border-[#2C2C2E] z-40 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo + Gym name */}
      <div className={`flex items-center h-16 px-4 border-b border-[#2C2C2E] ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo-hoop.png"
            alt="Hoop"
            className={`invert brightness-200 transition-all duration-300 ${collapsed ? 'h-10 w-10 object-contain' : 'h-11'}`}
          />
        </button>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display text-[#7BFF00] text-sm leading-none truncate">{gym.name}</span>
            <span className="text-[#636366] text-[10px] font-['Poppins']">B2B Panel</span>
          </div>
        )}
      </div>

      {/* Back to gym list */}
      {!collapsed && (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mx-2 mt-2 px-3 py-2 rounded-xl text-xs text-[#636366] hover:text-white hover:bg-[#1C1C1E] transition-colors"
        >
          <ArrowLeft size={14} />
          Cambiar gimnasio
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.filter(i => i.show).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#7BFF00]/10 text-[#7BFF00] shadow-[inset_3px_0_0_#7BFF00]'
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E]'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="font-display-upright text-base leading-none">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-[#2C2C2E] text-[#8E8E93] hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}

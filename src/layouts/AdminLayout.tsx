import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, UserCog, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ROLE_LABELS } from '../types/auth';
import Badge from '../components/ui/Badge';

export default function AdminLayout() {
  const { currentUser, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/clubs', icon: LayoutGrid, label: 'Clubs' },
    { to: '/admin/gestores', icon: UserCog, label: 'Gestores' },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#0A0A0F] border-r border-[#2C2C2E] z-40 flex flex-col hidden lg:flex">
        {/* Logo */}
        <div className="flex items-center h-16 px-5 border-b border-[#2C2C2E] gap-2">
          <img src="/logo-hoop.png" alt="Hoop" className="h-10 invert brightness-200" />
          <div className="flex flex-col">
            <span className="font-display text-[#7BFF00] text-sm leading-none">HOOP SLAM</span>
            <span className="text-[#636366] text-[10px] font-['Poppins']">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7BFF00]/10 text-[#7BFF00] shadow-[inset_3px_0_0_#7BFF00]'
                    : 'text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E]'
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="font-display-upright text-base leading-none">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:ml-[220px]">
        {/* TopBar */}
        <header className="sticky top-0 z-30 h-16 bg-black/80 backdrop-blur-md border-b border-[#2C2C2E] flex items-center justify-between px-6">
          <span className="text-[#636366] text-sm hidden lg:block">Panel de administración</span>
          {/* Mobile logo */}
          <span className="font-display text-[#7BFF00] text-lg lg:hidden">HOOP SLAM</span>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E] transition-colors"
              title={theme === 'dark' ? 'Modo día' : 'Modo noche'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#7BFF00] flex items-center justify-center">
                  <span className="text-black font-bold text-sm">{currentUser.avatarInitials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                  <Badge variant="green" size="sm">{ROLE_LABELS[currentUser.role]}</Badge>
                </div>
              </div>
            )}

            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="p-2 rounded-xl text-[#636366] hover:text-white hover:bg-[#1C1C1E] transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

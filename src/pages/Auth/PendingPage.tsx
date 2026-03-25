import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PendingPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <h1 className="font-display text-3xl text-[#7BFF00]">HOOP SLAM</h1>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#2C2C2E] flex items-center justify-center">
            <Clock size={36} className="text-[#7BFF00]" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Cuenta creada</h2>
          {currentUser?.name && (
            <p className="text-[#8E8E93]">Hola, <span className="text-white">{currentUser.name}</span></p>
          )}
          <p className="text-[#8E8E93] text-sm leading-relaxed">
            Tu cuenta está lista. Para acceder al panel necesitas que el responsable de tu club
            te asigne desde su panel de administración.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-5 text-left space-y-4">
          <p className="text-xs text-[#636366] uppercase font-medium">Próximos pasos</p>
          {[
            { n: 1, text: 'Comunica tu email al responsable de tu club' },
            { n: 2, text: 'El responsable te asignará al panel desde Admin → Gestores' },
            { n: 3, text: 'Recibirás acceso automáticamente al iniciar sesión' },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#7BFF00]/10 border border-[#7BFF00]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#7BFF00] text-xs font-bold">{n}</span>
              </div>
              <p className="text-sm text-[#8E8E93]">{text}</p>
            </div>
          ))}
        </div>

        {/* Email shown */}
        {currentUser?.email && (
          <p className="text-xs text-[#636366]">
            Tu email: <span className="text-white">{currentUser.email}</span>
          </p>
        )}

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 mx-auto text-sm text-[#636366] hover:text-white transition-colors"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

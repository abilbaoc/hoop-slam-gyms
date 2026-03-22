import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Building2, UserCircle, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { UserRole } from '../../types/auth';
import { gyms } from '../../data/mock/gyms';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { toast } from 'sonner';

// ── Mock Login (redesigned: 1-click per role) ──

const roles: { role: UserRole; icon: typeof Shield; label: string; features: string[] }[] = [
  { role: 'admin', icon: Shield, label: 'Administrador', features: ['Todos los gimnasios', 'Usuarios y permisos', 'Configuracion completa', 'Reportes y analitica'] },
  { role: 'gestor', icon: Building2, label: 'Gestor', features: ['Tu gimnasio', 'Canchas y precios', 'Reservas', 'Reportes'] },
  { role: 'staff', icon: UserCircle, label: 'Staff', features: ['Reservas', 'Vista general'] },
];

function MockLogin() {
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null);
  const { loginMock } = useAuth();
  const navigate = useNavigate();

  const handleRoleClick = (role: UserRole) => {
    if (role === 'admin') {
      loginMock?.(role);
      navigate('/');
      return;
    }
    setExpandedRole(expandedRole === role ? null : role);
  };

  const handleGymSelect = (role: UserRole, gymId: string) => {
    if (!loginMock) return;
    loginMock(role, gymId);
    navigate('/');
  };

  return (
    <>
      {/* Demo banner */}
      <div className="bg-[#7BFF00]/10 border border-[#7BFF00]/20 rounded-xl px-4 py-3 text-center">
        <p className="text-sm text-[#7BFF00] font-semibold">Modo Demo</p>
        <p className="text-xs text-[#8E8E93]">Explora el panel con datos de ejemplo — selecciona un rol</p>
      </div>

      {/* Role cards */}
      <div className="space-y-3">
        {roles.map(({ role, icon: Icon, label, features }) => (
          <div key={role}>
            <Card
              hover
              onClick={() => handleRoleClick(role)}
              className={`transition-all duration-200 ${
                expandedRole === role
                  ? 'border border-[#7BFF00] shadow-[0_0_20px_rgba(123,255,0,0.15)]'
                  : 'border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  expandedRole === role ? 'bg-[#7BFF00]/20' : 'bg-[#2C2C2E]'
                }`}>
                  <Icon size={20} className={expandedRole === role ? 'text-[#7BFF00]' : 'text-[#8E8E93]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${expandedRole === role ? 'text-white' : 'text-[#8E8E93]'}`}>
                    {role === 'admin' ? `Probar como ${label}` : label}
                  </p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                    {features.map((f) => (
                      <span key={f} className="text-[10px] text-[#636366]">{f}</span>
                    ))}
                  </div>
                </div>
                {role !== 'admin' && (
                  <ChevronDown
                    size={16}
                    className={`text-[#636366] transition-transform ${expandedRole === role ? 'rotate-180' : ''}`}
                  />
                )}
                {role === 'admin' && (
                  <span className="text-xs text-[#7BFF00] font-medium">Entrar →</span>
                )}
              </div>
            </Card>

            {/* Gym selector (expands for gestor/staff) */}
            {expandedRole === role && role !== 'admin' && (
              <div className="mt-2 ml-4 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <p className="text-xs text-[#8E8E93] mb-2">Selecciona un gimnasio:</p>
                {gyms.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGymSelect(role, g.id)}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#2C2C2E] hover:border-[#7BFF00]/30 transition-all text-sm text-white flex items-center justify-between group"
                  >
                    <span>{g.name}</span>
                    <span className="text-xs text-[#636366] group-hover:text-[#7BFF00]">{g.courts.length} canchas →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Real Login (Supabase configured) ──

function SupabaseLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Completa todos los campos'); return; }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) { setError(result.error); } else { navigate('/'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="space-y-4 p-6">
        <Input label="Email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <div className="space-y-1.5">
          <Input label="Contrasena" type="password" placeholder="Tu contrasena" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button type="button" onClick={() => toast.info('Funcionalidad disponible pronto')} className="text-xs text-[#7BFF00] hover:underline">
            Olvidaste tu contrasena?
          </button>
        </div>
        {error && <p className="text-sm text-[#FF453A] bg-[#FF453A]/10 rounded-lg px-3 py-2">{error}</p>}
        <Button variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Iniciar sesion'}
        </Button>
      </Card>
      <p className="text-center text-sm text-[#8E8E93]">
        No tienes cuenta?{' '}
        <Link to="/signup" className="text-[#7BFF00] hover:underline">Registrate</Link>
      </p>
    </form>
  );
}

// ── Login Page Shell ──

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl text-[#7BFF00]">HOOP SLAM</h1>
          <p className="text-[#8E8E93] text-sm">Panel de Gestion B2B</p>
        </div>
        {isSupabaseConfigured ? <SupabaseLogin /> : <MockLogin />}
      </div>
    </div>
  );
}

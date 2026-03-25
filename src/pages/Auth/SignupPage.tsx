import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Loader2, Building2, UserCog, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Card from '../../components/ui/Card';

type AccountType = 'responsable' | 'gestor';

const ACCOUNT_TYPES = [
  {
    type: 'responsable' as AccountType,
    icon: Building2,
    title: 'Responsable de club',
    description: 'Crea y gestiona tu propio club. Configurarás las pistas, horarios y el equipo.',
    badge: 'Nuevo club',
  },
  {
    type: 'gestor' as AccountType,
    icon: UserCog,
    title: 'Gestor de club',
    description: 'Trabajas en un club existente. El responsable te asignará acceso a su panel.',
    badge: 'Ya existe el club',
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  if (!isSupabaseConfigured) return <Navigate to="/login" replace />;

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep(2);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio';
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email no válido';
    if (!password) e.password = 'La contraseña es obligatoria';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate() || !accountType) return;

    setLoading(true);
    // responsable → role gestor (crea club), gestor → role staff (espera asignación)
    const role = accountType === 'responsable' ? 'gestor' : 'staff';
    const result = await signUp(email, password, name, role);
    setLoading(false);

    if (result.error) {
      setGlobalError(result.error);
    } else if (accountType === 'responsable') {
      navigate('/onboarding');
    } else {
      navigate('/pending');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl text-[#7BFF00]">HOOP SLAM</h1>
          <p className="text-[#8E8E93] text-sm">
            {step === 1 ? '¿Cuál es tu rol en el club?' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-[#7BFF00]' : s < step ? 'w-4 bg-[#7BFF00]/40' : 'w-4 bg-[#2C2C2E]'}`} />
          ))}
        </div>

        {/* Step 1 — Selector de tipo */}
        {step === 1 && (
          <div className="space-y-3">
            {ACCOUNT_TYPES.map(({ type, icon: Icon, title, description, badge }) => (
              <Card
                key={type}
                hover
                onClick={() => handleTypeSelect(type)}
                className="flex items-start gap-4 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#2C2C2E] group-hover:bg-[#7BFF00]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon size={22} className="text-[#8E8E93] group-hover:text-[#7BFF00] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2C2C2E] text-[#636366]">{badge}</span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed">{description}</p>
                </div>
                <ArrowRight size={16} className="text-[#636366] group-hover:text-[#7BFF00] flex-shrink-0 mt-1 transition-colors" />
              </Card>
            ))}

            <p className="text-center text-sm text-[#8E8E93] pt-2">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#7BFF00] hover:underline">Inicia sesión</Link>
            </p>
          </div>
        )}

        {/* Step 2 — Formulario */}
        {step === 2 && accountType && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tipo seleccionado */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-sm text-[#8E8E93] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              {accountType === 'responsable' ? 'Responsable de club' : 'Gestor de club'}
            </button>

            <Card className="space-y-4 p-6">
              <Input
                label="Nombre completo"
                placeholder="Joan García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              {globalError && (
                <p className="text-sm text-[#FF453A] bg-[#FF453A]/10 rounded-lg px-3 py-2">{globalError}</p>
              )}

              <Button variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : accountType === 'responsable' ? (
                  'Crear cuenta y configurar club'
                ) : (
                  'Crear cuenta'
                )}
              </Button>
            </Card>

            <p className="text-center text-sm text-[#8E8E93]">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#7BFF00] hover:underline">Inicia sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

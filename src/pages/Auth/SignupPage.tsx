import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Signup only available with Supabase
  if (!isSupabaseConfigured) return <Navigate to="/login" replace />;

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = 'El nombre es obligatorio';
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email no valido';
    if (!password) e.password = 'La contrasena es obligatoria';
    else if (password.length < 6) e.password = 'Minimo 6 caracteres';
    if (password !== confirmPassword) e.confirmPassword = 'Las contrasenas no coinciden';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;

    setLoading(true);
    const result = await signUp(email, password, name);
    setLoading(false);

    if (result.error) {
      setGlobalError(result.error);
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl text-[#7BFF00]">HOOP SLAM</h1>
          <p className="text-[#8E8E93] text-sm">Crea tu cuenta de gestor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="space-y-4 p-6">
            <Input
              label="Nombre completo"
              placeholder="Juan Garcia"
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
              label="Contrasena"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirmar contrasena"
              type="password"
              placeholder="Repite la contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            {globalError && (
              <p className="text-sm text-[#FF453A] bg-[#FF453A]/10 rounded-lg px-3 py-2">{globalError}</p>
            )}

            <Button variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Crear cuenta'}
            </Button>
          </Card>

          <p className="text-center text-sm text-[#8E8E93]">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#7BFF00] hover:underline">Inicia sesion</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

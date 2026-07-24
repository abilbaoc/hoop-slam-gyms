import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Card from '../../components/ui/Card';

/**
 * Landing page for Supabase auth links:
 * - Gestor email invitations (type=invite)
 * - Password recovery (type=recovery) → shows a set-new-password form
 * Exchanges the token for a session and redirects based on the profile.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'loading' | 'recovery'>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handle = async () => {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'invite' | 'recovery' | 'signup' | 'email',
        });
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=callback', { replace: true });
          return;
        }
      } else {
        // PKCE flow (code param)
        const code = params.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Auth callback error:', error);
            navigate('/login?error=callback', { replace: true });
            return;
          }
        }
      }

      // Password recovery: keep the user here to set a new password
      if (type === 'recovery') {
        setMode('recovery');
        return;
      }

      // At this point the session is set — RootRedirect decides the destination
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? '/' : '/login', { replace: true });
    };

    handle();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (newPassword.length < 6) {
      toast.error('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contrasenas no coinciden');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error('No se pudo actualizar la contrasena');
      return;
    }
    toast.success('Contrasena actualizada');
    navigate('/', { replace: true });
  };

  if (mode === 'recovery') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl text-[#7BFF00]">HOOP SLAM</h1>
            <p className="text-[#8E8E93] text-sm">Establece tu nueva contrasena</p>
          </div>
          <form onSubmit={handleSetPassword}>
            <Card className="space-y-4 p-6">
              <Input
                label="Nueva contrasena"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="Repite la contrasena"
                type="password"
                placeholder="Repite la contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Button variant="primary" size="lg" className="w-full" disabled={saving}>
                {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Guardar contrasena'}
              </Button>
            </Card>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#8E8E93] text-sm">Activando cuenta...</p>
      </div>
    </div>
  );
}

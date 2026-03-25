import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Landing page for Supabase invite links (gestor email invitations).
 * Supabase redirects here after the user clicks the invite link with
 * the token_hash + type=invite query params. We exchange the token for
 * a session and then redirect to the correct page based on their profile.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      if (!supabase) {
        navigate('/login', { replace: true });
        return;
      }

      // Supabase v2: exchangeCodeForSession handles the ?code= param (PKCE flow)
      // For invite links with token_hash, verifyOtp handles it
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

      // At this point the session is set. Read profile to decide where to go.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, gym_ids')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        navigate('/admin/clubs', { replace: true });
      } else if (profile?.gym_ids?.length) {
        navigate(`/gym/${profile.gym_ids[0]}/dashboard`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    };

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#8E8E93] text-sm">Activando cuenta...</p>
      </div>
    </div>
  );
}

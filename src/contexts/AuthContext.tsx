import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppUser, UserRole, Permission } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { users as mockUsers } from '../data/mock/users';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; needsOnboarding?: boolean; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
  canAccessGym: (gymId: string) => boolean;
  updateUserGymIds: (gymIds: string[]) => void;
  // Mock-only (available when Supabase not configured)
  loginMock?: (role: UserRole, gymId?: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => ({ error: 'Not initialized' }),
  signUp: async () => ({ error: 'Not initialized' }),
  signOut: async () => {},
  hasPermission: () => false,
  canAccessGym: () => false,
  updateUserGymIds: () => {},
});

const STORAGE_KEY = 'hoop-auth-user';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Initialize ──
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Supabase mode: check existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email ?? '').then((user) => {
            setCurrentUser(user);
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email ?? '').then(setCurrentUser);
        } else {
          setCurrentUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Mock mode: restore from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    }
  }, []);

  // ── Supabase: fetch profile from profiles table ──
  async function fetchProfile(userId: string, email: string): Promise<AppUser> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      const role = (profile.role as UserRole) || 'gestor';
      return {
        id: userId,
        name: profile.name || email.split('@')[0],
        email,
        role,
        gymIds: profile.gym_ids || [],
        permissions: ROLE_PERMISSIONS[role],
        lastActiveAt: new Date().toISOString(),
        avatarInitials: getInitials(profile.name || email),
      };
    }

    // No profile yet (new user) — return default gestor with no gyms
    return {
      id: userId,
      name: email.split('@')[0],
      email,
      role: 'gestor',
      gymIds: [],
      permissions: ROLE_PERMISSIONS.gestor,
      lastActiveAt: new Date().toISOString(),
      avatarInitials: getInitials(email),
    };
  }

  // ── Sign In (Supabase) ──
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase no configurado' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) return { error: 'Credenciales invalidas' };
      if (error.message.includes('Email not confirmed')) return { error: 'Confirma tu email antes de iniciar sesion' };
      return { error: 'Error de conexion. Intenta de nuevo.' };
    }
    return {};
  }, []);

  // ── Sign Up (Supabase) ──
  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ error?: string; needsOnboarding?: boolean; needsEmailConfirmation?: boolean }> => {
    if (!supabase) return { error: 'Supabase no configurado' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (error.message.includes('already registered')) return { error: 'Este email ya esta registrado' };
      if (error.message.includes('Signups not allowed')) return { error: 'El registro esta deshabilitado en Supabase. Activa "Enable Sign Up" en Authentication > Settings.' };
      return { error: `Error: ${error.message}` };
    }

    // Create profile explicitly (don't rely on trigger)
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          role: 'gestor',
          gym_ids: [],
        });
      } catch {
        // Profile creation may fail due to RLS, the trigger will create it
      }
    }

    return { needsOnboarding: true, needsEmailConfirmation: !data.session };
  }, []);

  // ── Sign Out ──
  const handleSignOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Mock Login ──
  const loginMock = useCallback((role: UserRole, gymId?: string) => {
    let user: AppUser | undefined;
    if (role === 'admin') {
      user = mockUsers.find((u) => u.role === 'admin');
    } else if (gymId) {
      user = mockUsers.find((u) => u.role === role && u.gymIds.includes(gymId));
    }
    if (!user) user = mockUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, []);

  // ── Update user gym IDs (for onboarding) ──
  const updateUserGymIds = useCallback((gymIds: string[]) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, gymIds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Permission checks ──
  const hasPermission = useCallback(
    (p: Permission): boolean => currentUser?.permissions.includes(p) ?? false,
    [currentUser],
  );

  const canAccessGym = useCallback(
    (gymId: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      return currentUser.gymIds.includes(gymId);
    },
    [currentUser],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl text-[#7BFF00] animate-pulse">HOOP SLAM</h1>
          <p className="text-[#636366] text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        signIn,
        signUp,
        signOut: handleSignOut,
        hasPermission,
        canAccessGym,
        updateUserGymIds,
        loginMock: isSupabaseConfigured ? undefined : loginMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

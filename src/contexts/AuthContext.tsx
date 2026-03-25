import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { AppUser, UserRole, Permission } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { users as mockUsers } from '../data/mock/users';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role?: 'gestor' | 'staff') => Promise<{ error?: string; needsOnboarding?: boolean; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
  canAccessGym: (gymId: string) => boolean;
  updateUserGymIds: (gymIds: string[]) => void;
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
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSigningOut = useRef(false);
  const profileCache = useRef<Map<string, AppUser>>(new Map());

  // ── Supabase: fetch profile with caching and error resilience ──
  async function fetchProfile(userId: string, email: string): Promise<AppUser | null> {
    if (!supabase) return null;

    const cached = profileCache.current.get(userId);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && profile) {
        const role = (profile.role as UserRole) || 'gestor';
        const user: AppUser = {
          id: userId,
          name: profile.name || email.split('@')[0],
          email,
          role,
          gymIds: profile.gym_ids || [],
          permissions: ROLE_PERMISSIONS[role],
          lastActiveAt: new Date().toISOString(),
          avatarInitials: getInitials(profile.name || email),
        };
        profileCache.current.set(userId, user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      }

      // Direct table read failed (likely missing RLS policy) — try SECURITY DEFINER RPCs
      console.warn('[Auth] Direct profile read failed, trying RPC fallback:', error?.message);
      const [roleRes, gymIdsRes] = await Promise.all([
        supabase.rpc('current_user_role'),
        supabase.rpc('current_user_gym_ids'),
      ]);

      if (!roleRes.error && roleRes.data) {
        const role = roleRes.data as UserRole;
        // Get name from auth metadata or cache
        const name = cached?.name || email.split('@')[0];
        const gymIds: string[] = Array.isArray(gymIdsRes.data) ? gymIdsRes.data : [];
        const user: AppUser = {
          id: userId,
          name,
          email,
          role,
          gymIds,
          permissions: ROLE_PERMISSIONS[role],
          lastActiveAt: new Date().toISOString(),
          avatarInitials: getInitials(name),
        };
        profileCache.current.set(userId, user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      }

      console.warn('[Auth] RPC fallback also failed:', roleRes.error?.message);
      if (cached) return cached;
      // Nothing worked — sign out to force clean re-login
      await supabase.auth.signOut();
      return null;
    } catch (err) {
      console.warn('[Auth] Profile fetch exception:', err);
      if (cached) return cached;
      await supabase.auth.signOut();
      return null;
    }
  }

  function buildDefaultUser(userId: string, email: string): AppUser {
    const user: AppUser = {
      id: userId,
      name: email.split('@')[0],
      email,
      role: 'gestor',
      gymIds: [],
      permissions: ROLE_PERMISSIONS.gestor,
      lastActiveAt: new Date().toISOString(),
      avatarInitials: getInitials(email),
    };
    profileCache.current.set(userId, user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  // ── Initialize ──
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Try to restore from localStorage first for instant UI
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          profileCache.current.set(parsed.id, parsed);
        }
      } catch { /* ignore */ }

      // Then verify with Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email ?? '').then((user) => {
            if (user) {
              setCurrentUser(user);
            } else {
              // fetchProfile returned null → signed out, clear state
              setCurrentUser(null);
              localStorage.removeItem(STORAGE_KEY);
              profileCache.current.clear();
            }
            setIsLoading(false);
          });
        } else {
          // No active session — clear cached user
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEY);
          profileCache.current.clear();
          setIsLoading(false);
        }
      });

      // Listen for auth changes — but be careful about what we clear
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Auth] State change:', event);

        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem(STORAGE_KEY);
          profileCache.current.clear();
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            fetchProfile(session.user.id, session.user.email ?? '').then((user) => {
              if (user) setCurrentUser(user);
            });
          }
          return;
        }

        // For other events (INITIAL_SESSION, USER_UPDATED, etc.)
        // only update if we have a session, never clear
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email ?? '').then((user) => {
            if (user) setCurrentUser(user);
          });
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

  // ── Sign In ──
  // Only whitelisted emails can access the dashboard
  const ALLOWED_EMAILS = ['laieta@hoopslam.net', 'alejandro.bilbao@hoopslam.net'];

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) return { error: 'Supabase no configurado' };

    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      return { error: 'Acceso no autorizado' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) return { error: 'Credenciales invalidas' };
      if (error.message.includes('Email not confirmed')) return { error: 'Confirma tu email antes de iniciar sesion' };
      return { error: 'Error de conexion. Intenta de nuevo.' };
    }
    return {};
  }, []);

  // ── Sign Up ──
  const signUp = useCallback(async (email: string, password: string, name: string, role: 'gestor' | 'staff' = 'gestor'): Promise<{ error?: string; needsOnboarding?: boolean; needsEmailConfirmation?: boolean }> => {
    if (!supabase) return { error: 'Supabase no configurado' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      if (error.message.includes('already registered')) return { error: 'Este email ya esta registrado' };
      if (error.message.includes('Signups not allowed')) return { error: 'El registro esta deshabilitado. Activa "Enable Sign Up" en Supabase.' };
      return { error: `Error: ${error.message}` };
    }

    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          role,
          gym_ids: [],
        });
      } catch {
        // Trigger will handle it
      }

      const user = buildDefaultUser(data.user.id, email);
      user.name = name;
      user.role = role;
      user.avatarInitials = getInitials(name);
      user.permissions = ROLE_PERMISSIONS[role];
      setCurrentUser(user);
    }

    return { needsOnboarding: role === 'gestor', needsEmailConfirmation: !data.session };
  }, []);

  // ── Sign Out ──
  const handleSignOut = useCallback(async () => {
    isSigningOut.current = true;
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    profileCache.current.clear();
    isSigningOut.current = false;
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

  // ── Update gym IDs (onboarding) ──
  const updateUserGymIds = useCallback((gymIds: string[]) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, gymIds };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      profileCache.current.set(updated.id, updated);

      // Also update in Supabase if configured
      if (supabase && isSupabaseConfigured) {
        supabase.from('profiles').update({ gym_ids: gymIds }).eq('id', updated.id).then(({ error }) => {
          if (error) console.warn('[Auth] Failed to update gym_ids in Supabase:', error.message);
        });
      }

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
      // If no gymIds assigned, allow access (pre-club-segmentation phase)
      if (!currentUser.gymIds || currentUser.gymIds.length === 0) return true;
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

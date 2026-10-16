import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';
import { supabase, isSupabaseConfigured } from './supabase';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.projectId);

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _authReady: Promise<void> | null = null;
let _lastFailureAt = 0;
let _lastAuthErrorCode: string | null = null;
const AUTH_RETRY_AFTER_MS = 15_000;

/** Human-readable reason when Firebase sign-in failed, for error screens. */
export function describeFirebaseAuthProblem(): string | null {
  switch (_lastAuthErrorCode) {
    case null:
      return null;
    case 'auth/too-many-requests':
      return 'Firebase ha bloqueado temporalmente el acceso por demasiados intentos. Espera unos minutos y reintenta.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Las credenciales de Firebase del servidor no son válidas (revisar FIREBASE_AUTH_* en Vercel).';
    case 'auth/network-request-failed':
      return 'No se pudo contactar con Firebase. Comprueba tu conexión.';
    default:
      return `No se pudo iniciar sesión en Firebase (${_lastAuthErrorCode}).`;
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new Error('Firebase no está configurado. Revisa las variables VITE_FIREBASE_* en .env');
  if (!_app) {
    _app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

/**
 * Signs in to Firebase through /api/firebase-token (authenticated with the
 * caller's Supabase JWT), so no Firebase credential ships in the client bundle.
 * The endpoint answers with a custom token, or with the shared dashboard
 * credentials while no service account is configured. Falls back to
 * .env.local credentials only in local dev.
 */
export function ensureFirebaseAuth(): Promise<void> {
  if (_authReady) return _authReady;
  // After a failure, wait before signing in again: every query calls this, and
  // retrying on each one makes Firebase lock the shared account
  // (auth/too-many-requests) for every user of the dashboard.
  if (Date.now() - _lastFailureAt < AUTH_RETRY_AFTER_MS) return Promise.resolve();
  const auth = getAuth(getFirebaseApp());
  _authReady = (async () => {
    // Restore the session persisted in the browser before deciding to sign in.
    await auth.authStateReady();
    if (auth.currentUser) return;
    await signInViaServer(auth);
  })()
    .then(() => {
      _lastAuthErrorCode = null;
    })
    .catch(async (err: Error & { code?: string }) => {
      console.error('[Firebase] Server-brokered auth failed:', err.message);
      _lastAuthErrorCode = err.code ?? 'unknown';
      if (import.meta.env.DEV) {
        await devPasswordFallback(auth);
        if (auth.currentUser) {
          _lastAuthErrorCode = null;
          return;
        }
      }
      // Not cached forever: a later call (e.g. after logging in) retries, after the backoff.
      _lastFailureAt = Date.now();
      _authReady = null;
    });
  return _authReady;
}

async function signInViaServer(auth: Auth): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase session unavailable');
  }
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('No active Supabase session');

  const res = await fetch('/api/firebase-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `firebase-token respondio ${res.status}`);
  }
  const body = (await res.json()) as { token?: string; email?: string; password?: string };
  if (body.token) {
    await signInWithCustomToken(auth, body.token);
  } else if (body.email && body.password) {
    await signInWithEmailAndPassword(auth, body.email, body.password);
  } else {
    throw new Error('firebase-token devolvio una respuesta inesperada');
  }
}

/** DEV-only fallback: shared credentials from .env.local (never bundled in prod). */
async function devPasswordFallback(auth: Auth): Promise<void> {
  const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
  const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
  if (!email || !password) {
    console.warn('[Firebase] No dev credentials (VITE_FIREBASE_AUTH_*) configured');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('[Firebase] Dev auth failed:', (err as Error).message);
  }
}

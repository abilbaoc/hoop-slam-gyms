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
let _auth: Auth | null = null;
let _authReady: Promise<void> | null = null;

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
 * Signs in to Firebase via a custom token minted by /api/firebase-token
 * (authenticated with the caller's Supabase JWT), so no Firebase credential
 * ships in the client bundle. Falls back to email/password only in local dev.
 */
export function ensureFirebaseAuth(): Promise<void> {
  if (_authReady) return _authReady;
  _auth = getAuth(getFirebaseApp());
  if (_auth.currentUser) {
    _authReady = Promise.resolve();
    return _authReady;
  }
  _authReady = signInWithCustomTokenFlow(_auth).catch(async (err: Error) => {
    console.error('[Firebase] Custom token auth failed:', err.message);
    if (import.meta.env.DEV) await devPasswordFallback(_auth!);
  });
  return _authReady;
}

async function signInWithCustomTokenFlow(auth: Auth): Promise<void> {
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
  const { token } = await res.json();
  await signInWithCustomToken(auth, token);
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

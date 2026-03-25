import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, type Auth } from 'firebase/auth';

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

/** Sign in with dedicated dashboard credentials and cache the promise. */
export function ensureFirebaseAuth(): Promise<void> {
  if (_authReady) return _authReady;
  _auth = getAuth(getFirebaseApp());
  if (_auth.currentUser) {
    _authReady = Promise.resolve();
    return _authReady;
  }
  const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
  const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
  if (!email || !password) {
    console.warn('[Firebase] Missing VITE_FIREBASE_AUTH_EMAIL or VITE_FIREBASE_AUTH_PASSWORD');
    _authReady = Promise.resolve();
    return _authReady;
  }
  _authReady = signInWithEmailAndPassword(_auth, email, password)
    .then(() => { /* signed in */ })
    .catch((err: Error) => {
      console.error('[Firebase] Auth failed:', err.message);
    });
  return _authReady;
}

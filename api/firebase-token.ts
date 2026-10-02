import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, isAuthFailure } from './_auth.js';

/**
 * Gives an authenticated dashboard user a way to sign in to Firestore without
 * shipping credentials in the public client bundle.
 *
 * - With FIREBASE_SERVICE_ACCOUNT (full service account JSON): returns a
 *   per-user custom token → `{ token }`.
 * - Otherwise, with FIREBASE_AUTH_EMAIL + FIREBASE_AUTH_PASSWORD (server-only
 *   env vars, no VITE_ prefix): returns the shared dashboard credentials →
 *   `{ email, password }`. Interim mode until a service account is available:
 *   the credentials only reach users with a valid Supabase session
 *   (invitation-only), never anonymous visitors.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const sharedEmail = process.env.FIREBASE_AUTH_EMAIL;
  const sharedPassword = process.env.FIREBASE_AUTH_PASSWORD;

  if (!serviceAccountJson && !(sharedEmail && sharedPassword)) {
    return res.status(500).json({ error: 'Firebase auth not configured on the server' });
  }

  const caller = await requireUser(req);
  if (isAuthFailure(caller)) {
    return res.status(caller.status).json({ error: caller.error });
  }

  if (!serviceAccountJson) {
    return res.status(200).json({ email: sharedEmail, password: sharedPassword });
  }

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    const app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });

    const token = await getAuth(app).createCustomToken(`dashboard-${caller.userId}`, {
      dashboardRole: caller.role,
    });

    return res.status(200).json({ token });
  } catch (err) {
    console.error('firebase-token error:', err);
    return res.status(500).json({ error: 'Error generando token de Firebase' });
  }
}

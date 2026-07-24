import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser, isAuthFailure } from './_auth.js';

/**
 * Issues a Firebase custom token for any authenticated dashboard user, so the
 * browser can sign in to Firestore without shipping shared credentials in the
 * client bundle. Requires the FIREBASE_SERVICE_ACCOUNT env var (full service
 * account JSON).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT not configured' });
  }

  const caller = await requireUser(req);
  if (isAuthFailure(caller)) {
    return res.status(caller.status).json({ error: caller.error });
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

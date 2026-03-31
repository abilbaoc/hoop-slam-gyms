import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://afhxzrnylpvjgtlewflq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });
  }

  const { userId } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId es obligatorio' });

  try {
    // 1. Delete profile row
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    // 2. Delete from Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!authRes.ok && authRes.status !== 404) {
      const err = await authRes.json();
      return res.status(authRes.status).json({ error: err.msg ?? 'Error al eliminar usuario' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete-gestor error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

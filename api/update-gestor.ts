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

  const { userId, role, gymIds } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId es obligatorio' });

  const patch: Record<string, unknown> = {};
  if (role !== undefined) patch.role = role;
  if (gymIds !== undefined) patch.gym_ids = gymIds;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Nada que actualizar' });
  }

  try {
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patch),
    });

    if (!profileRes.ok) {
      const err = await profileRes.json();
      return res.status(profileRes.status).json({ error: err.message ?? 'Error al actualizar usuario' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('update-gestor error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

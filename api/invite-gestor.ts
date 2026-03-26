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

  const { email, name, password, role, gymIds } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // 1. Create user in Supabase Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      }),
    });

    const authData = await authRes.json();

    if (!authRes.ok) {
      // User might already exist
      if (authData.msg?.includes('already been registered')) {
        return res.status(409).json({ error: 'Este email ya está registrado' });
      }
      return res.status(authRes.status).json({ error: authData.msg ?? 'Error al crear usuario' });
    }

    const userId = authData.id;

    // 2. Upsert profile
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: userId,
        name: name ?? email.split('@')[0],
        email,
        role: role === 'viewer' ? 'staff' : (role ?? 'gestor'),
        gym_ids: gymIds ?? [],
      }),
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.json();
      console.error('Profile upsert failed:', profileErr);
      // User was created but profile failed — not fatal
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: userId,
        email,
        name: name ?? email.split('@')[0],
        role: role ?? 'gestor',
        gymIds: gymIds ?? [],
      },
    });
  } catch (err) {
    console.error('invite-gestor error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

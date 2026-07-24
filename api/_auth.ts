import type { VercelRequest } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://afhxzrnylpvjgtlewflq.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export interface AuthCaller {
  userId: string;
  role: string;
}

export interface AuthFailure {
  status: number;
  error: string;
}

export function isAuthFailure(result: AuthCaller | AuthFailure): result is AuthFailure {
  return 'status' in result;
}

/** Verifies the Bearer JWT against Supabase Auth and returns the caller's profile role. */
export async function requireUser(req: VercelRequest): Promise<AuthCaller | AuthFailure> {
  if (!ANON_KEY || !SERVICE_ROLE_KEY) {
    return { status: 500, error: 'Supabase keys not configured' };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { status: 401, error: 'No autorizado' };
  }
  const token = authHeader.slice('Bearer '.length);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return { status: 401, error: 'No autorizado' };

  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return { status: 401, error: 'No autorizado' };

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!profileRes.ok) return { status: 401, error: 'No autorizado' };

  const rows = (await profileRes.json()) as Array<{ role?: string }>;
  const role = rows[0]?.role;
  if (!role) return { status: 401, error: 'No autorizado' };

  return { userId: user.id, role };
}

/** Like requireUser, but additionally requires the caller's role to be admin. */
export async function requireAdmin(req: VercelRequest): Promise<AuthCaller | AuthFailure> {
  const result = await requireUser(req);
  if (isAuthFailure(result)) return result;
  if (result.role !== 'admin') {
    return { status: 403, error: 'Solo los administradores pueden realizar esta accion' };
  }
  return result;
}

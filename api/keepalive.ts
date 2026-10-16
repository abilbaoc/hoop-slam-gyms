import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://afhxzrnylpvjgtlewflq.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Daily ping (Vercel cron, see vercel.json) so the Supabase free-tier project
 * isn't paused after 7 days without traffic — a paused project takes the
 * dashboard login down. Only performs a trivial anonymous read.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron calls when that env var exists.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (!ANON_KEY) {
    return res.status(500).json({ error: 'Supabase anon key not configured' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/gyms?select=id&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, supabaseStatus: r.status, at: new Date().toISOString() });
  } catch (err) {
    console.error('keepalive error:', err);
    return res.status(502).json({ ok: false, error: 'Supabase no responde' });
  }
}

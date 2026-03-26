/**
 * invite-gestor — Supabase Edge Function
 *
 * POST /functions/v1/invite-gestor
 * Body: { email: string; name: string; role: 'admin' | 'gestor' | 'viewer'; gymIds: string[]; password: string }
 *
 * - Caller must be an authenticated admin (verified via anon key + JWT).
 * - Uses service_role to create the auth user with createUser (email_confirm: true).
 * - Inserts/upserts the corresponding profiles row.
 * - Returns the created user data.
 *
 * Error responses:
 *   400  missing fields / invalid email / user already exists
 *   401  no Authorization header
 *   403  caller is not admin
 *   500  unexpected server error
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── 1. Verify the caller is an authenticated admin ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return json({ error: 'No autorizado' }, 401);

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile) return json({ error: 'No autorizado' }, 401);
    if (callerProfile.role !== 'admin') {
      return json({ error: 'Solo los administradores pueden invitar gestores' }, 403);
    }

    // ── 2. Parse and validate body ──────────────────────────────────────────
    let body: { email?: string; name?: string; role?: string; gymIds?: string[]; password?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Body JSON invalido' }, 400);
    }

    const { email, name, role, gymIds, password } = body;

    if (!email || typeof email !== 'string') return json({ error: 'El email es obligatorio' }, 400);
    if (!name || typeof name !== 'string') return json({ error: 'El nombre es obligatorio' }, 400);
    if (!password || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'La contrasena debe tener al menos 6 caracteres' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) return json({ error: 'Formato de email invalido' }, 400);

    const assignedRole = role && ['admin', 'gestor', 'viewer'].includes(role) ? role : 'gestor';
    const assignedGymIds: string[] = Array.isArray(gymIds) ? gymIds : [];

    // ── 3. Create user with service_role ────────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role: assignedRole },
    });

    // Handle user-already-exists gracefully: update their profile instead
    if (createError) {
      if (
        createError.message.toLowerCase().includes('already') ||
        createError.message.toLowerCase().includes('registered') ||
        createError.message.toLowerCase().includes('exists')
      ) {
        // Find existing user by email
        const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const existing = list?.users.find((u) => u.email?.toLowerCase() === normalizedEmail);

        if (existing) {
          const { error: upsertError } = await adminClient.from('profiles').upsert({
            id: existing.id,
            name,
            role: assignedRole,
            gym_ids: assignedGymIds,
            email: normalizedEmail,
            updated_at: new Date().toISOString(),
          });

          if (upsertError) {
            console.error('[invite-gestor] profile upsert on existing user:', upsertError.message);
            return json({ error: 'Error actualizando perfil del usuario existente' }, 500);
          }

          return json({
            ok: true,
            message: 'Usuario existente actualizado con nuevo rol y accesos',
            user: {
              id: existing.id,
              email: normalizedEmail,
              name,
              role: assignedRole,
              gymIds: assignedGymIds,
            },
          });
        }
      }

      console.error('[invite-gestor] createUser error:', createError.message);
      return json({ error: createError.message }, 400);
    }

    if (!created?.user) {
      return json({ error: 'No se pudo crear el usuario' }, 500);
    }

    // ── 4. Upsert profile ────────────────────────────────────────────────────
    const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
      id: created.user.id,
      name,
      role: assignedRole,
      gym_ids: assignedGymIds,
      email: normalizedEmail,
      updated_at: new Date().toISOString(),
    });

    if (profileUpsertError) {
      console.error('[invite-gestor] profile upsert:', profileUpsertError.message);
      // Non-fatal: the trigger may have already created a minimal profile row
    }

    return json({
      ok: true,
      message: `Gestor creado correctamente`,
      user: {
        id: created.user.id,
        email: normalizedEmail,
        name,
        role: assignedRole,
        gymIds: assignedGymIds,
      },
    });
  } catch (err) {
    console.error('[invite-gestor] unexpected error:', err);
    return json({ error: 'Error interno del servidor' }, 500);
  }
});

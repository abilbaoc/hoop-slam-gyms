import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return json({ error: 'No autorizado' }, 401);

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role, gym_ids')
      .eq('id', caller.id)
      .single();

    if (!callerProfile) return json({ error: 'No autorizado' }, 401);

    const { name, email, gymId, role: requestedRole } = await req.json();
    if (!name || !email) return json({ error: 'Nombre y email son obligatorios' }, 400);

    // Authorization
    let assignedRole: string;
    if (callerProfile.role === 'admin') {
      assignedRole = requestedRole ?? 'staff';
    } else if (callerProfile.role === 'gestor') {
      if (!gymId || !callerProfile.gym_ids?.includes(gymId)) {
        return json({ error: 'Solo puedes invitar a tu propio club' }, 403);
      }
      assignedRole = 'staff';
    } else {
      return json({ error: 'Sin permisos para invitar usuarios' }, 403);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, role: assignedRole, gym_ids: gymId ? [gymId] : [] },
      redirectTo: `${req.headers.get('origin') ?? 'https://hoop-slam-gyms.vercel.app'}/auth/callback`,
    });

    if (inviteError) {
      if (inviteError.message.includes('already been registered')) {
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existing = existingUsers?.users.find(u => u.email === email);
        if (existing) {
          const { data: existingProfile } = await admin.from('profiles').select('gym_ids').eq('id', existing.id).single();
          const newGymIds = gymId
            ? [...new Set([...(existingProfile?.gym_ids ?? []), gymId])]
            : (existingProfile?.gym_ids ?? []);
          await admin.from('profiles').upsert({
            id: existing.id, name, role: assignedRole, gym_ids: newGymIds, email,
          });
          return json({ ok: true, message: 'Usuario existente asignado al club' });
        }
      }
      return json({ error: inviteError.message }, 400);
    }

    if (invited.user) {
      await admin.from('profiles').upsert({
        id: invited.user.id, name, role: assignedRole,
        gym_ids: gymId ? [gymId] : [], email,
      });
    }

    return json({ ok: true, message: `Invitación enviada a ${email}` });
  } catch (err) {
    console.error(err);
    return json({ error: 'Error interno del servidor' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

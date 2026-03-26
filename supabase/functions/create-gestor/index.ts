import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return json({ error: 'No autorizado' }, 401);

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profile?.role !== 'admin') return json({ error: 'Solo los administradores pueden crear gestores' }, 403);

    // Parse body
    const { name, email, gymId, role = 'gestor' } = await req.json();
    if (!name || !email) return json({ error: 'Nombre y email son obligatorios' }, 400);

    // Use service role to create the user
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Send invite email (user sets their own password via the link)
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, role, gym_ids: gymId ? [gymId] : [] },
      redirectTo: `${req.headers.get('origin') ?? 'https://hoop-slam-gyms.vercel.app'}/auth/callback`,
    });

    if (inviteError) {
      // If already registered, just update their profile
      if (inviteError.message.includes('already been registered')) {
        const { data: existingUser } = await admin.auth.admin.listUsers();
        const existing = existingUser?.users.find(u => u.email === email);
        if (existing) {
          await admin.from('profiles').upsert({
            id: existing.id,
            name,
            role,
            gym_ids: gymId ? [gymId] : [],
            email,
          });
          return json({ ok: true, message: 'Perfil actualizado para usuario existente' });
        }
      }
      return json({ error: inviteError.message }, 400);
    }

    // Create profile entry
    if (invited.user) {
      await admin.from('profiles').upsert({
        id: invited.user.id,
        name,
        role,
        gym_ids: gymId ? [gymId] : [],
        email,
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

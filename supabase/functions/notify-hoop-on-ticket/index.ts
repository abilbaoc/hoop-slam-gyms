import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketRow {
  id: string;
  court_id: string;
  gym_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  gyms: { name: string } | null;
  courts: { name: string } | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = await req.json();
    const { ticket_id } = body as { ticket_id: string };

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'ticket_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: ticket, error: fetchError } = await supabase
      .from('maintenance_tickets')
      .select(`
        id, court_id, gym_id, title, description, priority, status, created_at,
        gyms ( name ),
        courts ( name )
      `)
      .eq('id', ticket_id)
      .single<TicketRow>();

    if (fetchError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found', detail: fetchError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Solo notificar para prioridad high o critical
    if (ticket.priority !== 'high' && ticket.priority !== 'critical') {
      return new Response(
        JSON.stringify({ success: true, notified: false, reason: 'priority_not_urgent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const gymName = ticket.gyms?.name ?? ticket.gym_id;
    const courtName = ticket.courts?.name ?? ticket.court_id;
    const webhookUrl = Deno.env.get('HOOP_WEBHOOK_URL');
    const notifiedAt = new Date().toISOString();
    let notified = false;

    if (webhookUrl) {
      try {
        const payload = {
          ticket_id: ticket.id,
          gym_name: gymName,
          court_name: courtName,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          created_at: ticket.created_at,
          dashboard_url: `${Deno.env.get('DASHBOARD_URL') ?? 'https://hoop-slam-gyms.vercel.app'}/maintenance/${ticket.id}`,
        };

        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (webhookRes.ok) {
          notified = true;
        } else {
          console.warn(`[notify-hoop-on-ticket] Webhook respondio con ${webhookRes.status}`);
        }
      } catch (webhookError) {
        // Graceful degradation: loggear el error pero no bloquear la creacion del ticket
        console.error('[notify-hoop-on-ticket] Error enviando webhook:', webhookError);
      }
    } else {
      console.log(
        `[notify-hoop-on-ticket] HOOP_WEBHOOK_URL no configurada. Ticket ${ticket_id} (${ticket.priority}) no notificado externamente.`,
      );
    }

    // Actualizar notified_at y hoop_status aunque el webhook haya fallado
    await supabase
      .from('maintenance_tickets')
      .update({ notified_at: notifiedAt, hoop_status: 'pending' })
      .eq('id', ticket_id);

    return new Response(
      JSON.stringify({ success: true, notified }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[notify-hoop-on-ticket] Error inesperado:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

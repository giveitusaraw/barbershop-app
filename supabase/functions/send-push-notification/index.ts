import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// VAPID keys - IMPORTANTE: Estas devem ser geradas com `npx web-push generate-vapid-keys`
// e guardadas como secrets do Supabase
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYjEB8RvTYwShJVcNa0V4mY6C5Y9WBpEV8e-p8cV7bF1R5qXv6_SE';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'UUxhkms8SnZQRU_0Zn9sJJqUJziFNXa7iWjYd9MxXP8';
const VAPID_SUBJECT = 'mailto:admin@example.com';

interface WebPushPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    vibrate?: number[];
  };
}

// Função para enviar web push usando a Web Push Protocol
async function sendWebPush(payload: WebPushPayload): Promise<boolean> {
  try {
    // Usar web-push protocol com fetch API
    const webpush = await import('npm:web-push@3.6.7');

    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const pushSubscription = {
      endpoint: payload.endpoint,
      keys: payload.keys
    };

    const notificationPayload = JSON.stringify(payload.notification);

    await webpush.sendNotification(pushSubscription, notificationPayload);

    console.log('[Push] Notificação enviada com sucesso para:', payload.endpoint);
    return true;
  } catch (error) {
    console.error('[Push] Erro ao enviar notificação:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse o payload do webhook
    const payload = await req.json();
    console.log('[Push] Webhook recebido:', payload.type);

    // Verificar se é uma nova reserva
    if (payload.type === 'INSERT' && payload.table === 'appointments') {
      const appointment = payload.record;
      console.log('[Push] Nova reserva detectada:', appointment.id);

      // Buscar detalhes da reserva
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', appointment.service_id)
        .maybeSingle();

      const { data: barber } = await supabase
        .from('barbers')
        .select('name')
        .eq('id', appointment.barber_id)
        .maybeSingle();

      const serviceName = service?.name || 'Serviço';
      const barberName = barber?.name || 'Funcionário';
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('pt-PT');
      const appointmentTime = appointment.appointment_time.substring(0, 5);

      const notificationBody = `${appointment.customer_name}\n${serviceName} - ${barberName}\n${appointmentDate} às ${appointmentTime}`;

      // Buscar todas as contas que devem receber notificação
      const { data: accounts } = await supabase
        .from('admin_accounts')
        .select('id, role, barber_ids');

      if (!accounts || accounts.length === 0) {
        console.log('[Push] Nenhuma conta encontrada');
        return new Response(JSON.stringify({ success: false, message: 'Sem contas para notificar' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      // Filtrar contas que devem receber notificação
      const targetAccounts = accounts.filter(account => {
        if (account.role === 'admin') {
          return true;
        }
        if (account.role === 'staff' && account.barber_ids) {
          return account.barber_ids.includes(appointment.barber_id);
        }
        return false;
      });

      console.log('[Push] Contas alvo:', targetAccounts.length);

      // Buscar subscrições push ativas dessas contas
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', targetAccounts.map(a => a.id))
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        console.log('[Push] Nenhuma subscrição push ativa encontrada');
        return new Response(JSON.stringify({ success: true, message: 'Sem subscrições ativas' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }

      console.log('[Push] Enviando para', subscriptions.length, 'subscrições');

      // Enviar push para cada subscrição
      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          sendWebPush({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            },
            notification: {
              title: 'Nova Reserva',
              body: notificationBody,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `appointment-${appointment.id}`,
              vibrate: [200, 100, 200, 100, 200]
            }
          })
        )
      );

      // Contar sucessos e falhas
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failureCount = results.length - successCount;

      console.log('[Push] Resultados:', { success: successCount, failed: failureCount });

      // Atualizar last_used_at das subscrições bem-sucedidas
      const successfulEndpoints = subscriptions
        .filter((_, index) => results[index].status === 'fulfilled' && (results[index] as any).value)
        .map(sub => sub.endpoint);

      if (successfulEndpoints.length > 0) {
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .in('endpoint', successfulEndpoints);
      }

      // Desativar subscrições que falharam (endpoint pode estar expirado)
      const failedEndpoints = subscriptions
        .filter((_, index) => results[index].status === 'rejected' || !(results[index] as any).value)
        .map(sub => sub.endpoint);

      if (failedEndpoints.length > 0) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .in('endpoint', failedEndpoints);
      }

      return new Response(
        JSON.stringify({
          success: true,
          sent: successCount,
          failed: failureCount
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Evento não suportado' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Push] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

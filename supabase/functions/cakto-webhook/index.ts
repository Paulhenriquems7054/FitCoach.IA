/**
 * Edge Function para processar webhooks da Cakto
 * Atualiza assinaturas e recargas quando pagamentos são confirmados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaktoWebhookEvent {
  type: string;
  data: {
    id: string;
    status: string;
    subscription_id?: string;
    transaction_id?: string;
    checkout_id?: string;
    user_id?: string;
    product_id?: string;
    amount?: number;
    currency?: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação do webhook (ajustar conforme API da Cakto)
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: CaktoWebhookEvent = await req.json();

    console.log('Webhook recebido:', event.type, event.data);

    switch (event.type) {
      case 'subscription.paid':
      case 'subscription.renewed':
        // Atualizar assinatura como ativa
        if (event.data.subscription_id) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
            })
            .eq('cakto_subscription_id', event.data.subscription_id);

          if (error) {
            console.error('Erro ao atualizar assinatura:', error);
          }
        }
        break;

      case 'subscription.canceled':
        // Atualizar assinatura como cancelada
        if (event.data.subscription_id) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('cakto_subscription_id', event.data.subscription_id);

          if (error) {
            console.error('Erro ao cancelar assinatura:', error);
          }
        }
        break;

      case 'payment.paid':
      case 'recharge.paid':
        // Processar recarga paga
        if (event.data.transaction_id) {
          // Buscar recarga pelo transaction_id
          const { data: recharge, error: findError } = await supabaseClient
            .from('recharges')
            .select('*')
            .eq('cakto_transaction_id', event.data.transaction_id)
            .single();

          if (findError || !recharge) {
            console.error('Recarga não encontrada:', findError);
            break;
          }

          // Atualizar status da recarga
          await supabaseClient
            .from('recharges')
            .update({
              payment_status: 'paid',
            })
            .eq('id', recharge.id);

          // Aplicar recarga
          const { processPendingRecharges } = await import('../../services/rechargeService.ts');
          await processPendingRecharges(recharge.user_id);
        }
        break;

      case 'payment.failed':
        // Marcar pagamento como falhado
        if (event.data.subscription_id) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('cakto_subscription_id', event.data.subscription_id);
        }
        break;

      default:
        console.log('Tipo de evento não tratado:', event.type);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

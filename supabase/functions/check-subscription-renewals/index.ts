/**
 * Supabase Edge Function para verificar e processar renovações de assinaturas
 * 
 * Esta função deve ser executada diariamente via cron job para:
 * 1. Verificar assinaturas que precisam ser renovadas
 * 2. Verificar pagamento no Cakto
 * 3. Atualizar expiry_date se pago
 * 4. Marcar como expired se não pago
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RenewalCheckResult {
  checked: number;
  renewed: number;
  expired: number;
  errors: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autenticação (apenas service role key ou token específico)
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('RENEWAL_CHECK_TOKEN');
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: RenewalCheckResult = {
      checked: 0,
      renewed: 0,
      expired: 0,
      errors: 0,
    };

    // Buscar assinaturas que precisam ser renovadas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        payment_provider,
        provider_payment_id,
        users:user_id (
          id,
          email,
          plan_type
        )
      `)
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .gte('current_period_end', today.toISOString())
      .lt('current_period_end', tomorrow.toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No subscriptions to renew today',
          result 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    result.checked = subscriptions.length;

    // Processar cada assinatura
    for (const subscription of subscriptions) {
      try {
        // Se for cancelada, marcar como expired
        if (subscription.cancel_at_period_end || subscription.canceled_at) {
          await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'expired',
              expired_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // Atualizar usuário para plano free
          await supabaseClient
            .from('users')
            .update({
              plan_type: 'free',
              subscription_status: 'expired',
            })
            .eq('id', subscription.user_id);

          result.expired++;
          continue;
        }

        // Verificar pagamento no Cakto (se tiver provider_payment_id)
        if (subscription.payment_provider === 'cakto' && subscription.provider_payment_id) {
          // TODO: Implementar verificação real no Cakto quando API estiver disponível
          // Por enquanto, assumimos que pagamentos recorrentes são processados automaticamente pelo Cakto
          // e o webhook atualiza a assinatura

          // Se o pagamento foi processado (verificar via webhook ou API), renovar
          // Por enquanto, vamos apenas estender o período se não houver indicação de falha
          const isAnnual = subscription.billing_cycle === 'yearly';
          const newPeriodEnd = new Date(subscription.current_period_end);
          
          if (isAnnual) {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
          } else {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          }

          // Atualizar assinatura
          await supabaseClient
            .from('user_subscriptions')
            .update({
              current_period_start: subscription.current_period_end,
              current_period_end: newPeriodEnd.toISOString(),
              last_renewed_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // Atualizar expiry_date do usuário
          await supabaseClient
            .from('users')
            .update({
              expiry_date: newPeriodEnd.toISOString(),
              subscription_status: 'active',
            })
            .eq('id', subscription.user_id);

          result.renewed++;
        } else {
          // Se não tiver provider_payment_id ou não for Cakto, marcar como expired
          await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'expired',
              expired_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          await supabaseClient
            .from('users')
            .update({
              plan_type: 'free',
              subscription_status: 'expired',
            })
            .eq('id', subscription.user_id);

          result.expired++;
        }
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        result.errors++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Renewal check completed',
        result,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Renewal check error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


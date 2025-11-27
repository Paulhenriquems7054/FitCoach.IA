/**
 * Supabase Edge Function: Webhook do Stripe
 * Processa eventos do Stripe e cria/atualiza assinaturas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    
    // Verificar assinatura do webhook (usando crypto do Deno)
    // Nota: Em produção, use a biblioteca oficial do Stripe para verificar
    
    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const planName = session.metadata?.plan_name;
        const billingCycle = session.metadata?.billing_cycle || 'monthly';

        if (!userId || !planId) {
          return new Response(
            JSON.stringify({ error: 'Missing metadata' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Buscar plano
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (!plan) {
          return new Response(
            JSON.stringify({ error: 'Plan not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Calcular datas de expiração
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Criar assinatura
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            billing_cycle: billingCycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            payment_provider: 'stripe',
            payment_method_id: session.payment_intent,
          })
          .select()
          .single();

        if (subError) {
          console.error('Erro ao criar assinatura:', subError);
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Atualizar usuário com plano
        await supabase
          .from('users')
          .update({
            plan_type: planName,
            subscription_status: 'active',
            expiry_date: periodEnd.toISOString(),
          })
          .eq('id', userId);

        // Criar registro de pagamento
        await supabase
          .from('payments')
          .insert({
            user_id: userId,
            subscription_id: subscription.id,
            amount: session.amount_total ? session.amount_total / 100 : plan.price_monthly,
            currency: 'brl',
            status: 'succeeded',
            payment_method: 'card',
            payment_provider: 'stripe',
            provider_payment_id: session.payment_intent,
            paid_at: now.toISOString(),
          });

        return new Response(
          JSON.stringify({ received: true, subscriptionId: subscription.id }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Atualizar status da assinatura
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('payment_method_id', subscription.id)
          .single();

        if (subData) {
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'canceled' ? 'canceled' : 'expired';
          
          await supabase
            .from('user_subscriptions')
            .update({ status })
            .eq('user_id', subData.user_id);

          await supabase
            .from('users')
            .update({ subscription_status: status })
            .eq('id', subData.user_id);
        }

        return new Response(
          JSON.stringify({ received: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ received: true, message: 'Event not handled' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


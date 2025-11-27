/**
 * Supabase Edge Function: Criar Sessão de Checkout Stripe
 * Cria uma sessão de checkout do Stripe e retorna a URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_API_URL = 'https://api.stripe.com/v1';

interface RequestBody {
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  userEmail?: string;
  userName: string;
}

serve(async (req) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { planId, planName, price, billingCycle, userId, userEmail, userName } = body;

    // Buscar informações do plano no Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calcular preço em centavos (Stripe usa centavos)
    const amountInCents = Math.round(price * 100);

    // Criar sessão de checkout no Stripe
    const stripeResponse = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'brl',
        'line_items[0][price_data][product_data][name]': plan.display_name,
        'line_items[0][price_data][product_data][description]': plan.description || '',
        'line_items[0][price_data][recurring][interval]': billingCycle === 'yearly' ? 'year' : 'month',
        'line_items[0][price_data][unit_amount]': amountInCents.toString(),
        'line_items[0][quantity]': '1',
        'customer_email': userEmail || undefined,
        'success_url': `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/#/premium?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/#/premium?canceled=true`,
        'metadata[plan_id]': planId,
        'metadata[plan_name]': planName,
        'metadata[user_id]': userId,
        'metadata[billing_cycle]': billingCycle,
      }),
    });

    const sessionData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return new Response(
        JSON.stringify({ error: sessionData.error?.message || 'Erro ao criar sessão' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        sessionId: sessionData.id,
        url: sessionData.url,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


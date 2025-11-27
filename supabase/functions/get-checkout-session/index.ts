/**
 * Supabase Edge Function: Verificar Status de Sessão de Checkout
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_API_URL = 'https://api.stripe.com/v1';

serve(async (req) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar sessão no Stripe
    const response = await fetch(`${STRIPE_API_URL}/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    const session = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Erro ao buscar sessão' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: session.payment_status === 'paid' ? 'complete' : session.status,
        subscriptionId: session.subscription,
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


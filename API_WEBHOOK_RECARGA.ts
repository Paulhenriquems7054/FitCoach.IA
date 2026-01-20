/**
 * API/Webhook para Processar Recargas Pagas
 * 
 * Este endpoint deve ser chamado pelo webhook de pagamento (Cakto/Stripe)
 * quando uma recarga FitVoice for confirmada
 */

import { processarRecargaPaga } from './services/recargaService';
import { logger } from './utils/logger';

/**
 * Endpoint para webhook de pagamento (Cakto)
 * 
 * Exemplo de evento recebido:
 * {
 *   "type": "payment.succeeded",
 *   "transaction_id": "txn_123456",
 *   "metadata": {
 *     "recarga_id": "uuid-da-recarga"
 *   }
 * }
 */
export async function handleRecargaWebhook(event: {
  type: string;
  transaction_id: string;
  metadata?: {
    recarga_id?: string;
  };
  data?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar tipo de evento
    if (event.type !== 'payment.succeeded') {
      return { success: false, error: 'Evento não é de pagamento confirmado' };
    }

    // Buscar recarga_id do metadata ou do checkout_id
    const recargaId = event.metadata?.recarga_id;
    const transactionId = event.transaction_id;

    if (!recargaId) {
      // Tentar buscar recarga pelo transaction_id se recarga_id não estiver no metadata
      logger.warn('recarga_id não encontrado no metadata, tentando buscar por transaction_id', 'webhook', event);
      
      // TODO: Buscar recarga pelo cakto_checkout_id ou cakto_transaction_id
      // Por enquanto, retornar erro
      return { success: false, error: 'recarga_id não encontrado no evento' };
    }

    // Processar recarga paga
    const resultado = await processarRecargaPaga(recargaId, transactionId);

    if (!resultado.success) {
      logger.error('Erro ao processar recarga paga', 'webhook', resultado.error);
      return { success: false, error: resultado.error };
    }

    logger.info(`Recarga ${recargaId} processada com sucesso`, 'webhook', { transactionId });
    return { success: true };
  } catch (error) {
    logger.error('Erro fatal ao processar webhook de recarga', 'webhook', error);
    return { success: false, error: 'Erro ao processar recarga' };
  }
}

/**
 * Exemplo de integração com Cakto (Edge Function Supabase)
 * 
 * Criar arquivo: supabase/functions/recarga-webhook/index.ts
 */

/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const event = await req.json();
    
    // Verificar assinatura do webhook (recomendado)
    const signature = req.headers.get('x-cakto-signature');
    // TODO: Validar assinatura
    
    // Processar evento
    const resultado = await handleRecargaWebhook(event);
    
    return new Response(
      JSON.stringify(resultado),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
*/

/**
 * Exemplo de integração com Stripe (Edge Function Supabase)
 */

/*
import Stripe from 'https://esm.sh/stripe@14.21.0';

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    const signature = req.headers.get('stripe-signature')!;
    
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const recargaId = paymentIntent.metadata?.recarga_id;
      
      if (recargaId) {
        await processarRecargaPaga(recargaId, paymentIntent.id);
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
*/

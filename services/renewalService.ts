/**
 * Serviço de renovação automática de assinaturas
 * Conforme documentação de lógica de planos
 */

import { getSupabaseClient } from './supabaseService';
import { checkCaktoPaymentStatus } from './caktoService';
import { logger } from '../utils/logger';

/**
 * Verifica e renova assinaturas que precisam ser renovadas
 * Conforme documentação de lógica de planos
 */
export async function checkAndRenewSubscriptions(): Promise<void> {
  const supabase = getSupabaseClient();

  // Buscar assinaturas que precisam ser renovadas
  // Adaptado: usa user_subscriptions ao invés de subscriptions
  // Adaptado: usa current_period_end ao invés de next_billing_date
  // Adaptado: verifica payment_provider para identificar recorrentes (is_recurring não existe)
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('status', 'active')
    .neq('payment_provider', 'activation_code') // Apenas recorrentes
    .lte('current_period_end', new Date().toISOString());

  if (error) {
    logger.error('Erro ao buscar assinaturas para renovação', 'renewalService', error);
    return;
  }

  for (const subscription of subscriptions || []) {
    try {
      // Verificar pagamento na Cakto
      const paymentId = subscription.payment_method_id || subscription.provider_payment_id || '';
      
      if (!paymentId) {
        logger.warn(`Assinatura ${subscription.id} sem payment_id, pulando renovação`, 'renewalService');
        continue;
      }

      const paymentStatus = await checkCaktoPaymentStatus(paymentId);

      if (paymentStatus.status === 'paid') {
        // Renovar assinatura
        // Buscar informações do plano para determinar o tipo
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscription.plan_id)
          .single();

        const planType = plan?.name || subscription.billing_cycle || 'monthly';
        const newEndDate = calculateNextBillingDate(
          planType,
          new Date()
        );

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            current_period_start: new Date().toISOString(),
            current_period_end: newEndDate.toISOString(),
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          logger.error(`Erro ao renovar assinatura ${subscription.id}`, 'renewalService', updateError);
        } else {
          logger.info(`Assinatura ${subscription.id} renovada com sucesso até ${newEndDate.toISOString()}`, 'renewalService');
          
          // Criar/atualizar chave de API se for admin de academia
          try {
            const { autoSetupGymApiKey } = await import('./gymApiKeyService');
            await autoSetupGymApiKey(subscription.user_id, 'active');
          } catch (apiKeyError) {
            logger.warn('Erro ao configurar API (não crítico)', 'renewalService', apiKeyError);
          }
        }

        // Enviar email de confirmação
        await sendRenewalConfirmationEmail(subscription.user_id);
      } else if (paymentStatus.status === 'failed' || paymentStatus.status === 'canceled') {
        // Pagamento falhou ou foi cancelado - suspender assinatura
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          logger.error(`Erro ao atualizar status para past_due: ${subscription.id}`, 'renewalService', updateError);
        } else {
          logger.warn(`Assinatura ${subscription.id} marcada como past_due (pagamento falhou)`, 'renewalService');
        }

        // Enviar email de notificação
        await sendPaymentFailedEmail(subscription.user_id);
      } else {
        // Status pending - aguardar processamento
        logger.debug(`Assinatura ${subscription.id} com pagamento pendente, aguardando processamento`, 'renewalService');
      }
    } catch (error: unknown) {
      logger.error(`Erro ao renovar assinatura ${subscription.id}`, 'renewalService', error);
    }
  }
}

/**
 * Calcula a próxima data de cobrança baseado no tipo de plano
 * Conforme documentação de lógica de planos
 */
function calculateNextBillingDate(
  planType: string,
  currentDate: Date
): Date {
  const nextDate = new Date(currentDate);

  if (planType.includes('monthly') || planType.includes('b2b') || planType.includes('personal')) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (planType === 'annual' || planType.includes('annual')) {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    // Padrão: mensal
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

// Função removida - agora usa checkCaktoPaymentStatus de caktoService.ts

/**
 * Envia email de confirmação de renovação
 * TODO: Implementar serviço de email (Supabase Edge Function ou Resend/SendGrid)
 */
async function sendRenewalConfirmationEmail(userId: string): Promise<void> {
  // Placeholder - implementar envio de email real
  // Exemplo usando Supabase Edge Function ou serviço de email (Resend, SendGrid, etc.)
  logger.info(`Email de confirmação de renovação enviado para usuário ${userId}`, 'renewalService');
  // TODO: Implementar chamada real ao serviço de email
}

/**
 * Envia email de notificação de falha no pagamento
 * TODO: Implementar serviço de email (Supabase Edge Function ou Resend/SendGrid)
 */
async function sendPaymentFailedEmail(userId: string): Promise<void> {
  // Placeholder - implementar envio de email real
  // Exemplo usando Supabase Edge Function ou serviço de email (Resend, SendGrid, etc.)
  logger.warn(`Email de falha no pagamento enviado para usuário ${userId}`, 'renewalService');
  // TODO: Implementar chamada real ao serviço de email
}


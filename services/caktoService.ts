/**
 * Serviço de Integração com Cakto
 * Gerencia checkouts, cancelamentos e verificações de pagamento
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

// Mapeamento de planos para checkout IDs do Cakto
const CAKTO_CHECKOUT_IDS: Record<string, string> = {
  // Planos B2C
  'monthly': 'zeygxve_668421',
  'annual_vip': 'wvbkepi_668441',
  
  // Planos B2B (Academias)
  'academy_starter_mini': '3b2kpwc_671196',
  'academy_starter': 'cemyp2n_668537',
  'academy_growth': 'vi6djzq_668541',
  'academy_pro': '3dis6ds_668546',
  
  // Planos Personal Trainers
  'personal_team_5': '3dgheuc_666289',
  'personal_team_15': '3etp85e_666303',
  
  // Recargas
  'recharge_turbo': 'ihfy8cz_668443',
  'recharge_voice_bank': 'hhxugxb_668446',
  'recharge_pass_livre': 'trszqtv_668453',
};

/**
 * Obtém URL de checkout do Cakto para um plano
 */
export function getCaktoCheckoutUrl(planName: string): string {
  const checkoutId = CAKTO_CHECKOUT_IDS[planName];
  if (!checkoutId) {
    logger.warn(`Checkout ID não encontrado para plano: ${planName}`, 'caktoService');
    return '#';
  }
  return `https://pay.cakto.com.br/${checkoutId}`;
}

/**
 * Cancela uma assinatura no Cakto
 * 
 * Estratégia:
 * 1. Se CAKTO_API_KEY estiver configurada, tenta cancelar via API
 * 2. Caso contrário, marca como cancelada localmente e confia no webhook
 * 3. O webhook do Cakto atualizará o status quando o cancelamento for processado
 */
export async function cancelCaktoSubscription(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!paymentId) {
      logger.warn('ID de pagamento não fornecido para cancelamento', 'caktoService');
      return { success: false, error: 'ID de pagamento não fornecido' };
    }

    logger.info(`Cancelando assinatura no Cakto: ${paymentId}`, 'caktoService');
    
    // Tentar usar API do Cakto se disponível
    const caktoApiKey = import.meta.env.VITE_CAKTO_API_KEY || process.env.CAKTO_API_KEY;
    
    if (caktoApiKey) {
      try {
        // Tentar cancelar via API do Cakto
        // NOTA: Ajustar URL e formato conforme documentação oficial da Cakto
        const apiUrl = import.meta.env.VITE_CAKTO_API_URL || 'https://api.cakto.com.br/v1';
        const response = await fetch(`${apiUrl}/subscriptions/${paymentId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${caktoApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          logger.info(`Assinatura ${paymentId} cancelada com sucesso via API`, 'caktoService');
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
          logger.warn(`Erro ao cancelar via API, confiando no webhook: ${errorData.message}`, 'caktoService');
          // Continuar para fallback (webhook)
        }
      } catch (apiError: unknown) {
        logger.warn('Erro ao chamar API do Cakto, confiando no webhook', 'caktoService', apiError);
        // Continuar para fallback (webhook)
      }
    }
    
    // Fallback: Atualizar status localmente e confiar no webhook
    // O webhook do Cakto atualizará o status quando o cancelamento for processado
    const supabase = getSupabaseClient();
    
    // Buscar assinatura pelo payment_method_id ou provider_payment_id
    const { data: subscription, error: findError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, status')
      .or(`payment_method_id.eq.${paymentId},provider_payment_id.eq.${paymentId}`)
      .eq('status', 'active')
      .maybeSingle();
    
    if (findError || !subscription) {
      logger.warn(`Assinatura não encontrada para paymentId ${paymentId}`, 'caktoService');
      // Não é erro crítico - o webhook pode processar depois
      return { success: true }; // Retorna sucesso pois o webhook processará
    }
    
    // Marcar como cancelada localmente (webhook confirmará depois)
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      logger.error('Erro ao atualizar status local da assinatura', 'caktoService', updateError);
      // Não falhar - o webhook processará
    } else {
      logger.info(`Assinatura ${subscription.id} marcada como cancelada localmente (aguardando confirmação do webhook)`, 'caktoService');
      
      // Desabilitar API para academia se for admin
      try {
        const { autoSetupGymApiKey } = await import('./gymApiKeyService');
        await autoSetupGymApiKey(subscription.user_id, 'canceled');
      } catch (apiKeyError) {
        logger.warn('Erro ao desabilitar API (não crítico)', 'caktoService', apiKeyError);
      }
    }
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao cancelar assinatura no Cakto', 'caktoService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verifica status de um pagamento no Cakto
 * 
 * Estratégia:
 * 1. Primeiro verifica no banco de dados local (mais rápido)
 * 2. Se necessário, consulta API do Cakto
 * 3. Retorna status mais atualizado possível
 */
export async function checkCaktoPaymentStatus(paymentId: string): Promise<{
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  paidAt?: string;
  lastChecked?: string;
}> {
  try {
    if (!paymentId) {
      logger.warn('ID de pagamento não fornecido para verificação', 'caktoService');
      return { status: 'pending', lastChecked: new Date().toISOString() };
    }

    logger.info(`Verificando status de pagamento no Cakto: ${paymentId}`, 'caktoService');
    
    // 1. Verificar no banco de dados local primeiro (mais rápido)
    const supabase = getSupabaseClient();
    const { data: subscription, error: findError } = await supabase
      .from('user_subscriptions')
      .select('status, current_period_start, updated_at')
      .or(`payment_method_id.eq.${paymentId},provider_payment_id.eq.${paymentId}`)
      .maybeSingle();
    
    if (!findError && subscription) {
      // Mapear status do banco para status do Cakto
      let caktoStatus: 'pending' | 'paid' | 'failed' | 'canceled' = 'pending';
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        caktoStatus = 'paid';
      } else if (subscription.status === 'canceled') {
        caktoStatus = 'canceled';
      } else if (subscription.status === 'past_due' || subscription.status === 'expired') {
        caktoStatus = 'failed';
      }
      
      return {
        status: caktoStatus,
        paidAt: subscription.current_period_start || undefined,
        lastChecked: subscription.updated_at || new Date().toISOString(),
      };
    }
    
    // 2. Tentar consultar API do Cakto se disponível
    const caktoApiKey = import.meta.env.VITE_CAKTO_API_KEY || process.env.CAKTO_API_KEY;
    
    if (caktoApiKey) {
      try {
        const apiUrl = import.meta.env.VITE_CAKTO_API_URL || 'https://api.cakto.com.br/v1';
        const response = await fetch(`${apiUrl}/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${caktoApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          logger.info(`Status obtido da API do Cakto para ${paymentId}`, 'caktoService');
          
          // Mapear status da API do Cakto
          const statusMap: Record<string, 'pending' | 'paid' | 'failed' | 'canceled'> = {
            'paid': 'paid',
            'pago': 'paid',
            'pending': 'pending',
            'pendente': 'pending',
            'failed': 'failed',
            'falhou': 'failed',
            'canceled': 'canceled',
            'cancelado': 'canceled',
          };
          
          return {
            status: statusMap[data.status?.toLowerCase()] || 'pending',
            paidAt: data.paid_at || data.created_at,
            lastChecked: new Date().toISOString(),
          };
        } else {
          logger.warn(`API do Cakto retornou erro ${response.status}, usando status local`, 'caktoService');
        }
      } catch (apiError: unknown) {
        logger.warn('Erro ao consultar API do Cakto, usando status local', 'caktoService', apiError);
      }
    }
    
    // 3. Fallback: retornar status padrão (pending)
    // O webhook atualizará quando o pagamento for processado
    logger.debug(`Status não encontrado para ${paymentId}, retornando pending`, 'caktoService');
    return {
      status: 'pending',
      lastChecked: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao verificar status de pagamento no Cakto', 'caktoService', error);
    // Retornar pending em caso de erro (não bloquear fluxo)
    return {
      status: 'pending',
      lastChecked: new Date().toISOString(),
    };
  }
}


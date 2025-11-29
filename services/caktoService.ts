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
 * NOTA: Esta função assume que o Cakto tem uma API para cancelar assinaturas.
 * Ajuste conforme a documentação real da API do Cakto.
 */
export async function cancelCaktoSubscription(paymentId: string): Promise<void> {
  try {
    // TODO: Implementar chamada real à API do Cakto quando disponível
    // Por enquanto, apenas logamos a ação
    
    logger.info(`Cancelando assinatura no Cakto: ${paymentId}`, 'caktoService');
    
    // Exemplo de implementação (ajustar conforme API real):
    /*
    const CAKTO_API_KEY = Deno.env.get('CAKTO_API_KEY') || '';
    const response = await fetch('https://api.cakto.com/v1/subscriptions/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAKTO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_id: paymentId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cancelar assinatura no Cakto');
    }
    */
    
    // Por enquanto, apenas retornamos sucesso
    // O webhook do Cakto deve atualizar o status quando o cancelamento for processado
    return;
  } catch (error: any) {
    logger.error('Erro ao cancelar assinatura no Cakto', 'caktoService', error);
    throw new Error(`Erro ao cancelar assinatura no Cakto: ${error.message}`);
  }
}

/**
 * Verifica status de um pagamento no Cakto
 * 
 * NOTA: Esta função assume que o Cakto tem uma API para verificar status.
 * Ajuste conforme a documentação real da API do Cakto.
 */
export async function checkCaktoPaymentStatus(paymentId: string): Promise<{
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  paidAt?: string;
}> {
  try {
    // TODO: Implementar chamada real à API do Cakto quando disponível
    logger.info(`Verificando status de pagamento no Cakto: ${paymentId}`, 'caktoService');
    
    // Por enquanto, retornamos um status padrão
    // Em produção, fazer chamada real à API
    return {
      status: 'paid',
      paidAt: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Erro ao verificar status de pagamento no Cakto', 'caktoService', error);
    throw new Error(`Erro ao verificar status de pagamento: ${error.message}`);
  }
}


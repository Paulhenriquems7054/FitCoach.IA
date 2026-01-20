/**
 * Serviço helper para rastrear uso de billing nas operações de IA
 * Integra com useSpendingTracker via chamadas diretas ao Supabase
 */

import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

interface TrackOperationParams {
  operationType: 'text_analysis' | 'image_analysis' | 'voice_analysis';
  tokensUsed?: number;
  estimatedCost?: number;
}

/**
 * Rastreia uma operação de uso de IA
 * Usa a mesma lógica do hook useSpendingTracker.trackOperation
 */
export async function trackBillingOperation({
  operationType,
  tokensUsed = 0,
  estimatedCost = 0
}: TrackOperationParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.warn('Tentativa de rastrear operação sem usuário autenticado', 'billingTrackerService');
      return;
    }

    // 1. Inserir log de gasto
    const { error: logError } = await supabase
      .from('spending_logs')
      .insert({
        user_id: user.id,
        operation_type: operationType,
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost,
        features_used: {}
      });

    if (logError) {
      logger.error('Erro ao inserir log de gasto', 'billingTrackerService', logError);
      // Não lançar erro, apenas loggar - não queremos bloquear a operação
      return;
    }

    // 2. Atualizar contador de uso
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Buscar ou criar registro de uso
    const { data: existing, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.warn('Erro ao buscar uso existente', 'billingTrackerService', fetchError);
    }

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('usage_tracking')
        .update({
          api_calls_total: (existing.api_calls_total || 0) + 1,
          gemini_input_tokens: (existing.gemini_input_tokens || 0) + tokensUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('Erro ao atualizar uso', 'billingTrackerService', updateError);
      }
    } else {
      // Criar novo registro
      // Primeiro, buscar subscription_id se existir
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const { error: insertError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          subscription_id: subscription?.id || null,
          period_start: periodStart,
          period_end: periodEnd,
          api_calls_total: 1,
          gemini_input_tokens: tokensUsed
        });

      if (insertError) {
        logger.error('Erro ao criar registro de uso', 'billingTrackerService', insertError);
      }
    }

    logger.debug(`Operação rastreada: ${operationType} (${tokensUsed} tokens, R$ ${estimatedCost})`, 'billingTrackerService');
  } catch (err) {
    // Não lançar erro - apenas loggar
    logger.error('Erro ao rastrear operação de billing', 'billingTrackerService', err);
  }
}

/**
 * Estima o custo de uma operação baseado no tipo e tokens
 */
export function estimateOperationCost(
  operationType: 'text_analysis' | 'image_analysis' | 'voice_analysis',
  tokensUsed: number
): number {
  // Preços aproximados do Gemini (ajustar conforme necessário)
  const COST_PER_1K_INPUT_TOKENS = {
    text_analysis: 0.0001,      // $0.10 por 1M tokens (input)
    image_analysis: 0.000125,   // $0.125 por 1M tokens (input)
    voice_analysis: 0.0002,     // Estimativa para voz
  };

  const costPerToken = COST_PER_1K_INPUT_TOKENS[operationType] / 1000;
  return tokensUsed * costPerToken;
}

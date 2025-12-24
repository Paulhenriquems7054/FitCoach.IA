/**
 * Voice Access Service - Gerencia acesso à funcionalidade de voz
 * 
 * Este serviço é um wrapper para usageLimitService.ts para manter
 * compatibilidade com a estrutura documentada.
 * 
 * Funcionalidades:
 * - checkVoiceAccess(): verifica saldos disponíveis
 * - consumeVoiceTime(): consome tempo de uso
 * - Chama Edge Function do Supabase para validação
 * - Sistema de prioridades (VIP, Gratuito, Boost, Reserva)
 */

import {
  checkVoiceUsage,
  consumeVoiceSeconds,
  type VoiceUsageStatus,
} from './usageLimitService';
import { logger } from '../utils/logger';

/**
 * Verifica se o usuário pode usar voz e retorna status
 * Wrapper para checkVoiceUsage do usageLimitService
 */
export async function checkVoiceAccess(): Promise<VoiceUsageStatus> {
  try {
    return await checkVoiceUsage();
  } catch (error) {
    logger.error('Erro ao verificar acesso de voz', 'voiceAccessService', error);
    return {
      canUse: false,
      remainingDaily: 0,
      remainingBoost: 0,
      remainingReserve: 0,
      totalRemaining: 0,
      error: 'Erro ao verificar limites de uso',
    };
  }
}

/**
 * Consome tempo de voz (primeiro do limite diário, depois do upsell)
 * Wrapper para consumeVoiceSeconds do usageLimitService
 */
export async function consumeVoiceTime(seconds: number): Promise<{ success: boolean; error?: string }> {
  try {
    return await consumeVoiceSeconds(seconds);
  } catch (error) {
    logger.error('Erro ao consumir tempo de voz', 'voiceAccessService', error);
    return {
      success: false,
      error: 'Erro ao processar consumo de tempo',
    };
  }
}

// Re-exportar tipos para compatibilidade
export type { VoiceUsageStatus } from './usageLimitService';


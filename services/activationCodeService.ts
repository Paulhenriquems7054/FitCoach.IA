/**
 * Serviço de Ativação de Códigos de Academia
 * Valida e ativa códigos de ativação fornecidos por academias
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface ActivationResult {
  success: boolean;
  error?: string;
  subscription?: any;
}

/**
 * Valida e ativa um código de ativação de academia
 */
export async function validateAndActivateCode(
  userId: string,
  code: string
): Promise<ActivationResult> {
  const supabase = getSupabaseClient();

  try {
    // 1. Buscar academia pelo código
    const { data: academy, error: academyError } = await supabase
      .from('academy_subscriptions')
      .select('*, app_plans(*)')
      .eq('activation_code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (academyError || !academy) {
      return { success: false, error: 'Código inválido ou expirado' };
    }

    // 2. Verificar se ainda há licenças disponíveis
    if (academy.licenses_used >= academy.max_licenses) {
      return { 
        success: false, 
        error: 'Código esgotado. Todas as licenças foram usadas.' 
      };
    }

    // 3. Verificar se usuário já está vinculado a alguma academia
    const { data: existingLink } = await supabase
      .from('student_academy_links')
      .select('*')
      .eq('student_user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingLink) {
      return { 
        success: false, 
        error: 'Você já está vinculado a uma academia.' 
      };
    }

    // 4. Criar vínculo
    const { error: linkError } = await supabase
      .from('student_academy_links')
      .insert({
        student_user_id: userId,
        academy_subscription_id: academy.id,
        activation_code: code.toUpperCase(),
        status: 'active',
      });

    if (linkError) {
      logger.error('Erro ao criar vínculo com academia', 'activationCodeService', linkError);
      return { 
        success: false, 
        error: 'Erro ao ativar código. Tente novamente.' 
      };
    }

    // 5. Incrementar contador de licenças usadas
    const { error: updateError } = await supabase
      .from('academy_subscriptions')
      .update({ licenses_used: academy.licenses_used + 1 })
      .eq('id', academy.id);

    if (updateError) {
      logger.error('Erro ao atualizar contador de licenças', 'activationCodeService', updateError);
      // Não falhar a ativação se apenas o contador falhar
    }

    logger.info(`Código ativado com sucesso para usuário ${userId}`, 'activationCodeService');

    return { success: true, subscription: academy };
  } catch (error) {
    logger.error('Erro inesperado ao ativar código', 'activationCodeService', error);
    return { 
      success: false, 
      error: 'Erro inesperado. Tente novamente.' 
    };
  }
}

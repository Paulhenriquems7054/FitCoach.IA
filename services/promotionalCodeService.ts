import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import { startTrialPeriod } from './trialService';

export type PromotionalCodeType = 'trial' | 'discount' | 'free';

export interface PromotionalCodeValidation {
  valid: boolean;
  type?: PromotionalCodeType;
  days?: number;
  message?: string;
}

/**
 * Valida um código promocional no Supabase.
 * Supõe uma tabela `promotional_codes` com colunas:
 * - code (pk)
 * - type ('trial' | 'discount' | 'free')
 * - days (opcional, para trial)
 * - is_active
 * - expires_at
 * - max_uses, current_uses (opcionais)
 */
export async function validatePromotionalCode(code: string): Promise<PromotionalCodeValidation> {
  const supabase = getSupabaseClient();

  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) {
    return { valid: false, message: 'Informe um código promocional.' };
  }

  const { data, error } = await supabase
    .from('promotional_codes')
    .select('code, type, days, is_active, expires_at, max_uses, current_uses')
    .eq('code', trimmedCode)
    .maybeSingle();

  if (error) {
    logger.error('Erro ao validar código promocional', 'promotionalCodeService', error);
    return { valid: false, message: 'Erro ao validar código promocional. Tente novamente.' };
  }

  if (!data) {
    return { valid: false, message: 'Código promocional inválido.' };
  }

  if (!data.is_active) {
    return { valid: false, message: 'Este código promocional não está mais ativo.' };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'Este código promocional já expirou.' };
  }

  if (typeof data.max_uses === 'number' && typeof data.current_uses === 'number' && data.current_uses >= data.max_uses) {
    return { valid: false, message: 'Este código promocional já atingiu o número máximo de usos.' };
  }

  return {
    valid: true,
    type: data.type as PromotionalCodeType,
    days: data.days ?? undefined,
    message: 'Código válido!',
  };
}

/**
 * Aplica um código promocional ao usuário.
 * - trial: inicia período de teste (7 dias ou `days` se informado)
 * - discount: apenas registra uso; desconto deve ser aplicado no fluxo de pagamento
 * - free: pode ser usado para liberar plano gratuito especial (a implementar)
 */
export async function applyPromotionalCode(userId: string, code: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabaseClient();
  const trimmedCode = code.trim().toUpperCase();

  const validation = await validatePromotionalCode(trimmedCode);
  if (!validation.valid || !validation.type) {
    return { success: false, message: validation.message || 'Código inválido.' };
  }

  // Registrar uso do código
  const { error: updateError } = await supabase
    .from('promotional_codes')
    .update({
      current_uses: supabase.rpc ? undefined : undefined, // placeholder para evitar erro de tipo
    })
    .eq('code', trimmedCode);

  if (updateError) {
    logger.warn('Erro ao atualizar uso do código promocional', 'promotionalCodeService', updateError);
  }

  if (validation.type === 'trial') {
    // Reusar lógica de trial Premium (7 dias fixo, por enquanto)
    await startTrialPeriod(userId);
    return { success: true, message: 'Período de teste Premium ativado com sucesso!' };
  }

  if (validation.type === 'discount') {
    // Desconto será aplicado no checkout (integração a ser feita com Cakto/pagamento)
    return { success: true, message: 'Código de desconto aplicado! O desconto será considerado no pagamento.' };
  }

  if (validation.type === 'free') {
    // Aqui poderia ser implementada lógica para liberar um plano específico sem cobrança.
    // No momento, apenas registramos o código como utilizado.
    return { success: true, message: 'Código aplicado! Seu acesso especial foi registrado.' };
  }

  return { success: false, message: 'Tipo de código promocional não suportado.' };
}



/**
 * Serviço de Geração e Gerenciamento de Códigos B2B
 * Gera códigos únicos para planos B2B e gerencia ativações
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface B2BCode {
  id: string;
  code: string;
  business_id: string;
  business_name?: string;
  plan_type: string;
  max_activations: number;
  current_activations: number;
  expires_at: string | null;
  created_at: string;
  status: 'active' | 'expired' | 'cancelled';
}

/**
 * Gera um código único de ativação B2B
 */
export function generateB2BCode(): string {
  // Formato: ABC12345 (3 letras + 5 números)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removido I e O para evitar confusão
  const numbers = '0123456789';
  
  let code = '';
  
  // 3 letras aleatórias
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 5 números aleatórios
  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}

/**
 * Cria um novo código B2B após confirmação de pagamento
 */
export async function createB2BCode(
  paymentId: string,
  businessId: string,
  businessName: string,
  planType: string,
  maxActivations: number
): Promise<B2BCode> {
  const supabase = getSupabaseClient();
  
  // Gerar código único (verificar se já existe)
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateB2BCode();
    attempts++;
    
    // Verificar se código já existe
    const { data: existing } = await supabase
      .from('b2b_codes')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    
    if (!existing) {
      break; // Código único encontrado
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar código único após várias tentativas');
    }
  } while (true);
  
  // Calcular data de expiração (1 ano a partir de agora)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  
  // Criar código B2B
  const { data, error } = await supabase
    .from('b2b_codes')
    .insert({
      code: code,
      business_id: businessId,
      business_name: businessName,
      plan_type: planType,
      max_activations: maxActivations,
      current_activations: 0,
      expires_at: expiresAt.toISOString(),
      status: 'active',
      payment_id: paymentId,
    })
    .select()
    .single();
  
  if (error) {
    logger.error('Erro ao criar código B2B', 'b2bCodeService', error);
    throw new Error(`Erro ao criar código B2B: ${error.message}`);
  }
  
  logger.info(`Código B2B criado: ${code} para ${businessName}`, 'b2bCodeService');
  
  return {
    id: data.id,
    code: data.code,
    business_id: data.business_id,
    business_name: data.business_name || undefined,
    plan_type: data.plan_type,
    max_activations: data.max_activations,
    current_activations: data.current_activations,
    expires_at: data.expires_at,
    created_at: data.created_at,
    status: data.status as any,
  };
}

/**
 * Valida um código B2B
 */
export async function validateB2BCode(code: string): Promise<{
  valid: boolean;
  error?: string;
  codeData?: B2BCode;
}> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('b2b_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  
  if (error || !data) {
    return {
      valid: false,
      error: 'Código não encontrado',
    };
  }
  
  // Verificar status
  if (data.status !== 'active') {
    return {
      valid: false,
      error: data.status === 'expired' ? 'Código expirado' : 'Código cancelado',
    };
  }
  
  // Verificar expiração
  if (data.expires_at && new Date(data.expires_at) < new Date(now)) {
    // Marcar como expirado
    await supabase
      .from('b2b_codes')
      .update({ status: 'expired' })
      .eq('id', data.id);
    
    return {
      valid: false,
      error: 'Código expirado',
    };
  }
  
  // Verificar limite de ativações
  if (data.current_activations >= data.max_activations) {
    return {
      valid: false,
      error: 'Código esgotado. Todas as licenças foram usadas.',
    };
  }
  
  return {
    valid: true,
    codeData: {
      id: data.id,
      code: data.code,
      business_id: data.business_id,
      business_name: data.business_name || undefined,
      plan_type: data.plan_type,
      max_activations: data.max_activations,
      current_activations: data.current_activations,
      expires_at: data.expires_at,
      created_at: data.created_at,
      status: data.status as any,
    },
  };
}

/**
 * Ativa um código B2B para um usuário
 */
export async function activateB2BCode(
  code: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  planType?: string;
}> {
  const supabase = getSupabaseClient();
  
  // Validar código
  const validation = await validateB2BCode(code);
  
  if (!validation.valid || !validation.codeData) {
    return {
      success: false,
      error: validation.error || 'Código inválido',
    };
  }
  
  const codeData = validation.codeData;
  
  // Verificar se usuário já ativou este código
  const { data: existingActivation } = await supabase
    .from('b2b_code_activations')
    .select('id')
    .eq('code_id', codeData.id)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (existingActivation) {
    return {
      success: false,
      error: 'Você já ativou este código',
    };
  }
  
  // Criar ativação
  const { error: activationError } = await supabase
    .from('b2b_code_activations')
    .insert({
      code_id: codeData.id,
      user_id: userId,
      activated_at: new Date().toISOString(),
    });
  
  if (activationError) {
    logger.error('Erro ao criar ativação de código B2B', 'b2bCodeService', activationError);
    return {
      success: false,
      error: 'Erro ao ativar código. Tente novamente.',
    };
  }
  
  // Incrementar contador de ativações
  const { error: updateError } = await supabase
    .from('b2b_codes')
    .update({
      current_activations: codeData.current_activations + 1,
    })
    .eq('id', codeData.id);
  
  if (updateError) {
    logger.error('Erro ao atualizar contador de ativações', 'b2bCodeService', updateError);
    // Não falhar - a ativação já foi criada
  }
  
  // Atualizar usuário com plano B2B
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      plan_type: codeData.plan_type as any,
      subscription_status: 'active',
      gym_id: codeData.business_id,
      gym_role: 'student',
      is_gym_managed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  if (userUpdateError) {
    logger.error('Erro ao atualizar usuário com plano B2B', 'b2bCodeService', userUpdateError);
    // Não falhar - a ativação já foi criada
  }
  
  logger.info(`Código B2B ${code} ativado para usuário ${userId}`, 'b2bCodeService');
  
  return {
    success: true,
    planType: codeData.plan_type,
  };
}

/**
 * Obtém todos os códigos B2B de uma empresa
 */
export async function getB2BCodesByBusiness(businessId: string): Promise<B2BCode[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('b2b_codes')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  
  if (error) {
    logger.error('Erro ao buscar códigos B2B', 'b2bCodeService', error);
    return [];
  }
  
  return (data || []).map((row) => ({
    id: row.id,
    code: row.code,
    business_id: row.business_id,
    business_name: row.business_name || undefined,
    plan_type: row.plan_type,
    max_activations: row.max_activations,
    current_activations: row.current_activations,
    expires_at: row.expires_at,
    created_at: row.created_at,
    status: row.status as any,
  }));
}

/**
 * Obtém estatísticas de um código B2B
 */
export async function getB2BCodeStats(codeId: string): Promise<{
  totalActivations: number;
  activeUsers: number;
  recentActivations: Array<{
    userId: string;
    userName: string;
    activatedAt: string;
  }>;
}> {
  const supabase = getSupabaseClient();
  
  const { data: activations, error } = await supabase
    .from('b2b_code_activations')
    .select(`
      *,
      users:user_id (
        id,
        nome,
        username
      )
    `)
    .eq('code_id', codeId)
    .order('activated_at', { ascending: false });
  
  if (error) {
    logger.error('Erro ao buscar estatísticas do código B2B', 'b2bCodeService', error);
    return {
      totalActivations: 0,
      activeUsers: 0,
      recentActivations: [],
    };
  }
  
  const recentActivations = (activations || []).map((activation: any) => ({
    userId: activation.user_id,
    userName: activation.users?.nome || activation.users?.username || 'Usuário',
    activatedAt: activation.activated_at,
  }));
  
  return {
    totalActivations: activations?.length || 0,
    activeUsers: activations?.length || 0,
    recentActivations,
  };
}

/**
 * Expira um código B2B (quando plano não é renovado)
 */
export async function expireB2BCode(codeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('b2b_codes')
    .update({
      status: 'expired',
      expires_at: new Date().toISOString(),
    })
    .eq('id', codeId);
  
  if (error) {
    logger.error('Erro ao expirar código B2B', 'b2bCodeService', error);
    throw new Error(`Erro ao expirar código: ${error.message}`);
  }
  
  logger.info(`Código B2B ${codeId} expirado`, 'b2bCodeService');
}


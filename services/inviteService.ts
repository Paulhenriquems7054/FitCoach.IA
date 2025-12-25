import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export type InviteRole = 'student' | 'personal';

export interface InviteValidationResult {
  valid: boolean;
  code: string;
  academyId?: string;
  invitedRole?: InviteRole;
  error?: string;
}

export interface InviteUsageHistory {
  userId: string;
  userName: string;
  userEmail?: string;
  role: InviteRole;
  usedAt: string;
  ipAddress?: string;
}

/**
 * Obtém o IP do usuário (opcional - não bloqueia se falhar)
 * Retorna 'N/A' se offline ou se a API falhar
 */
const getUserIP = async (): Promise<string> => {
  // Verificar se está online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'N/A';
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout de 2s
    
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'N/A';
    }
    return 'N/A';
  } catch {
    // Silenciosamente retorna 'N/A' se falhar (app funciona sem IP)
    return 'N/A';
  }
};

/**
 * Gera um código de convite para uma academia (B2B2C)
 */
export async function createInvite(
  academyId: string,
  createdByUserId: string,
  invitedRole: InviteRole,
  expiresInDays: number = 7
): Promise<{ code: string }> {
  const supabase = getSupabaseClient();

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { error } = await supabase
    .from('invites')
    .insert({
      academy_id: academyId,
      created_by_user_id: createdByUserId,
      invited_role: invitedRole,
      code,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    });

  if (error) {
    logger.error('Erro ao criar convite', 'inviteService', error);
    throw new Error('Não foi possível gerar o convite. Tente novamente.');
  }

  return { code };
}

/**
 * Valida um código de convite
 */
export async function validateInvite(code: string): Promise<InviteValidationResult> {
  const supabase = getSupabaseClient();

  const trimmedCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('invites')
    .select('id, academy_id, invited_role, status, expires_at')
    .eq('code', trimmedCode)
    .maybeSingle();

  if (error) {
    logger.error('Erro ao validar convite', 'inviteService', error);
    return { valid: false, code: trimmedCode, error: 'Erro ao validar convite.' };
  }

  if (!data) {
    return { valid: false, code: trimmedCode, error: 'Convite não encontrado ou inválido.' };
  }

  const now = new Date();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;

  if (data.status !== 'pending') {
    return { valid: false, code: trimmedCode, error: 'Este convite já foi utilizado ou expirou.' };
  }

  if (expiresAt && expiresAt <= now) {
    return { valid: false, code: trimmedCode, error: 'Este convite já expirou.' };
  }

  return {
    valid: true,
    code: trimmedCode,
    academyId: data.academy_id,
    invitedRole: data.invited_role as InviteRole,
  };
}

/**
 * Aceita um convite: vincula usuário à academia e inicia trial de IA se for aluno
 * MODELO B2B2C: Alunos sempre recebem trial de 7 dias ao aceitar convite
 * 🔒 SEGURANÇA: Valida se usuário já está vinculado a outra academia
 */
export async function acceptInvite(code: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const validation = await validateInvite(code);
  if (!validation.valid || !validation.academyId || !validation.invitedRole) {
    throw new Error(validation.error || 'Convite inválido.');
  }

  const { academyId, invitedRole } = validation;

  // 🔒 SEGURANÇA: Verificar se usuário já está vinculado a outra academia
  const { data: existingUser, error: userFetchError } = await supabase
    .from('users')
    .select('id, academy_id, tenant_role')
    .eq('id', userId)
    .maybeSingle();

  if (userFetchError) {
    logger.error('Erro ao verificar vínculo do usuário', 'inviteService', userFetchError);
    throw new Error('Erro ao validar usuário. Tente novamente.');
  }

  // Se já está vinculado a uma academia diferente, bloquear
  if (existingUser?.academy_id && existingUser.academy_id !== academyId) {
    logger.warn(
      `Tentativa de vincular usuário ${userId} a academia ${academyId}, mas já está vinculado a ${existingUser.academy_id}`,
      'inviteService'
    );
    throw new Error(
      'Você já está vinculado a outra academia. ' +
      'Entre em contato com o suporte se precisar alterar sua vinculação.'
    );
  }

  // Se já está vinculado à mesma academia, permitir (pode estar revalidando ou atualizando)
  if (existingUser?.academy_id === academyId) {
    logger.info(`Usuário ${userId} já está vinculado à academia ${academyId}`, 'inviteService');
    // Continuar para atualizar dados do trial se necessário
  }

  // Se for aluno, ativar trial de IA automaticamente (7 dias)
  const now = new Date();
  const trialExpiresAt = invitedRole === 'student' 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    : null;

  // Atualizar usuário com academy_id, tenant_role e trial de IA (campos simplificados e legado)
  const updateData: any = {
    academy_id: academyId,
    tenant_role: invitedRole,
  };

  if (invitedRole === 'student') {
    // Campos simplificados (novos)
    updateData.trial_active = true;
    updateData.trial_expires_at = trialExpiresAt;
    // Campos legado (manter compatibilidade)
    updateData.ai_subscription_status = 'trial';
    updateData.ai_trial_start_at = now.toISOString();
    updateData.ai_trial_end_at = trialExpiresAt;
    // Limites de uso: trial tem 5 minutos de voz por dia
    updateData.voice_daily_limit_seconds = 300; // 5 minutos
  } else {
    // Personal trainers não recebem trial de IA
    updateData.trial_active = false;
    updateData.trial_expires_at = null;
    updateData.ai_subscription_status = 'none';
    updateData.ai_trial_start_at = null;
    updateData.ai_trial_end_at = null;
  }

  const { error: userError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  // Registrar evento de trial iniciado (métricas)
  if (invitedRole === 'student') {
    try {
      const { trackTrialStarted } = await import('./aiMetricsService');
      await trackTrialStarted(userId, academyId);
    } catch (error) {
      logger.warn('Erro ao registrar trial iniciado (métricas)', 'inviteService', error);
    }
  }

  if (userError) {
    logger.error('Erro ao aceitar convite (atualizar usuário)', 'inviteService', userError);
    throw new Error('Não foi possível vincular o convite ao usuário.');
  }

  // Marcar convite como aceito
  const { error: inviteError } = await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('code', code.trim().toUpperCase());

  if (inviteError) {
    logger.warn('Erro ao marcar convite como aceito', 'inviteService', inviteError);
  }

  // 🔒 AUDITORIA: Registrar uso do convite
  try {
    await logInviteUsage(code, userId, academyId, invitedRole);
  } catch (error) {
    // Não falhar o processo se o log falhar
    logger.warn('Erro ao registrar uso de convite (auditoria)', 'inviteService', error);
  }
}

/**
 * Registra o uso de um convite para auditoria e segurança
 */
async function logInviteUsage(
  code: string, 
  userId: string, 
  academyId: string,
  role: InviteRole
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const ip = await getUserIP();

    // Inserir registro de uso na tabela invite_usages
    const { error } = await supabase
      .from('invite_usages')
      .insert({
        invite_code: code.trim().toUpperCase(),
        user_id: userId,
        academy_id: academyId,
        role,
        used_at: new Date().toISOString(),
        ip_address: ip !== 'N/A' ? ip : null,
      });

    if (error) {
      // Se a tabela não existir ainda, apenas logar e não falhar
      if (error.code === '42P01') {
        logger.warn('Tabela invite_usages não existe ainda. Execute a migration SQL primeiro.', 'inviteService');
      } else {
        logger.warn('Erro ao registrar uso de convite', 'inviteService', error);
      }
      // Não falhar o processo por causa do log
    }
  } catch (error) {
    logger.warn('Erro ao obter IP para log de convite', 'inviteService', error);
  }
}

/**
 * Lista quem usou os códigos de convite de uma academia (auditoria)
 */
export async function getInviteUsageHistory(
  academyId: string,
  inviteCode?: string
): Promise<InviteUsageHistory[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('invite_usages')
    .select(`
      user_id,
      role,
      used_at,
      ip_address,
      users:user_id (
        id,
        nome,
        email
      )
    `)
    .eq('academy_id', academyId)
    .order('used_at', { ascending: false })
    .limit(100); // Limitar a 100 registros mais recentes

  if (inviteCode) {
    query = query.eq('invite_code', inviteCode.trim().toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    // Se a tabela não existir, retornar array vazio
    if (error.code === '42P01') {
      logger.warn('Tabela invite_usages não existe ainda. Execute a migration SQL primeiro.', 'inviteService');
      return [];
    }
    logger.error('Erro ao buscar histórico de convites', 'inviteService', error);
    throw new Error('Não foi possível carregar histórico de convites.');
  }

  return (data || []).map((usage: any) => ({
    userId: usage.user_id,
    userName: usage.users?.nome || 'Usuário desconhecido',
    userEmail: usage.users?.email,
    role: usage.role as InviteRole,
    usedAt: usage.used_at,
    ipAddress: usage.ip_address,
  }));
}

/**
 * Verifica se há uso suspeito de um código (muitos usos em pouco tempo)
 * Retorna true se suspeito, false caso contrário
 */
export async function checkSuspiciousUsage(
  code: string,
  academyId: string,
  threshold: number = 10
): Promise<{ suspicious: boolean; count: number }> {
  const supabase = getSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('invite_usages')
    .select('*', { count: 'exact', head: true })
    .eq('invite_code', code.trim().toUpperCase())
    .eq('academy_id', academyId)
    .gte('used_at', oneHourAgo);

  if (error) {
    // Se a tabela não existir, retornar não suspeito
    if (error.code === '42P01') {
      return { suspicious: false, count: 0 };
    }
    logger.warn('Erro ao verificar uso suspeito', 'inviteService', error);
    return { suspicious: false, count: 0 }; // Em caso de erro, permitir
  }

  const usageCount = count || 0;
  return {
    suspicious: usageCount > threshold,
    count: usageCount,
  };
}



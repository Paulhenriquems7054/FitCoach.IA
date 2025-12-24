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
 */
export async function acceptInvite(code: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const validation = await validateInvite(code);
  if (!validation.valid || !validation.academyId || !validation.invitedRole) {
    throw new Error(validation.error || 'Convite inválido.');
  }

  const { academyId, invitedRole } = validation;

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
}



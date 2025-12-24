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
 */
export async function acceptInvite(code: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const validation = await validateInvite(code);
  if (!validation.valid || !validation.academyId || !validation.invitedRole) {
    throw new Error(validation.error || 'Convite inválido.');
  }

  const { academyId, invitedRole } = validation;

  // Atualizar usuário com academy_id e tenant_role
  const { error: userError } = await supabase
    .from('users')
    .update({
      academy_id: academyId,
      tenant_role: invitedRole,
      // Iniciar trial de IA para alunos
      ai_subscription_status: invitedRole === 'student' ? 'trial' : 'none',
      ai_trial_start_at: invitedRole === 'student' ? new Date().toISOString() : null,
      ai_trial_end_at:
        invitedRole === 'student'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null,
    })
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



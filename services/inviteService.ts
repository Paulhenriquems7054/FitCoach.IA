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
 * Aceita um convite: vincula usuário à academia e inicia trial de IA de 3 dias para alunos
 * ESTRATÉGIA: Alunos recebem 3 dias grátis de IA, depois precisam assinar plano individual
 * Academia paga apenas pela plataforma, aluno paga pela IA
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
    // Continuar para atualizar dados se necessário
  }

  // NOVO MODELO: Alunos vinculados à academia usam limites do plano da academia
  // Não recebem trial/demo - os limites vêm do plano contratado pela academia
  const updateData: any = {
    academy_id: academyId,
    tenant_role: invitedRole,
    // Vincular aluno à academia (tabela companies)
    academias_id: academyId, // Campo para novo modelo
  };

  if (invitedRole === 'student') {
    // Alunos vinculados à academia não recebem trial/demo
    // Os limites são controlados pelo plano da academia (limite_texto, limite_imagem, limite_voz)
    // Resetar contadores de uso se necessário
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    updateData.periodo_uso_mes = currentMonth;
    updateData.uso_texto = 0;
    updateData.uso_imagem = 0;
    updateData.uso_voz_minutos = 0;
    updateData.modo_demo = false; // Alunos não usam modo demo
    updateData.interacoes_demo_usadas = 0;
    
    logger.info(`Aluno ${userId} vinculado à academia ${academyId} - usando limites do plano da academia`, 'inviteService');
  } else if (invitedRole === 'personal') {
    // Personal trainers não têm limites de uso (podem usar livremente se vinculados à academia)
    updateData.modo_demo = false;
    updateData.interacoes_demo_usadas = 0;
  }

  const { error: userError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (userError) {
    logger.error('Erro ao aceitar convite (atualizar usuário)', 'inviteService', userError);
    throw new Error('Não foi possível vincular o convite ao usuário.');
  }

  // Registrar evento de trial iniciado (métricas) para alunos
  if (invitedRole === 'student') {
    try {
      const { trackTrialStarted } = await import('./aiMetricsService');
      await trackTrialStarted(userId, academyId);
    } catch (error) {
      logger.warn('Erro ao registrar trial iniciado (métricas)', 'inviteService', error);
    }
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



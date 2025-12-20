/**
 * Serviço de Monitoramento
 * 
 * Coleta métricas e estatísticas do sistema
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface SystemMetrics {
  totalUsers: number;
  totalGyms: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalWeightEntries: number;
  totalChatMessages: number;
  gymsByPlan: Record<string, number>;
  usersByRole: Record<string, number>;
}

/**
 * Coleta métricas gerais do sistema
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const supabase = getSupabaseClient();

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total de academias
    const { count: totalGyms } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // Assinaturas ativas
    const { count: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Assinaturas expiradas
    const { count: expiredSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    // Total de registros de peso
    const { count: totalWeightEntries } = await supabase
      .from('weight_history')
      .select('*', { count: 'exact', head: true });

    // Total de mensagens
    const { count: totalChatMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    // Academias por plano
    const { data: gymsByPlanData } = await supabase
      .from('companies')
      .select('plan_type');

    const gymsByPlan: Record<string, number> = {};
    if (gymsByPlanData) {
      gymsByPlanData.forEach(gym => {
        const plan = gym.plan_type || 'unknown';
        gymsByPlan[plan] = (gymsByPlan[plan] || 0) + 1;
      });
    }

    // Usuários por role
    const { data: usersByRoleData } = await supabase
      .from('users')
      .select('gym_role');

    const usersByRole: Record<string, number> = {};
    if (usersByRoleData) {
      usersByRoleData.forEach(user => {
        const role = user.gym_role || 'none';
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });
    }

    return {
      totalUsers: totalUsers || 0,
      totalGyms: totalGyms || 0,
      activeSubscriptions: activeSubscriptions || 0,
      expiredSubscriptions: expiredSubscriptions || 0,
      totalWeightEntries: totalWeightEntries || 0,
      totalChatMessages: totalChatMessages || 0,
      gymsByPlan,
      usersByRole,
    };
  } catch (error) {
    logger.error('Erro ao coletar métricas', 'monitoringService', error);
    throw error;
  }
}

/**
 * Coleta métricas de uma academia específica
 */
export async function getGymMetrics(gymId: string): Promise<{
  totalStudents: number;
  totalTrainers: number;
  activeLicenses: number;
  totalWeightEntries: number;
  totalChatMessages: number;
}> {
  try {
    const supabase = getSupabaseClient();

    // Alunos
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('gym_role', 'student');

    // Treinadores
    const { count: totalTrainers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('gym_role', 'trainer');

    // Licenças ativas
    const { count: activeLicenses } = await supabase
      .from('company_licenses')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', gymId)
      .eq('status', 'active');

    // Dados de peso
    const { count: totalWeightEntries } = await supabase
      .from('weight_history')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    // Mensagens
    const { count: totalChatMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId);

    return {
      totalStudents: totalStudents || 0,
      totalTrainers: totalTrainers || 0,
      activeLicenses: activeLicenses || 0,
      totalWeightEntries: totalWeightEntries || 0,
      totalChatMessages: totalChatMessages || 0,
    };
  } catch (error) {
    logger.error('Erro ao coletar métricas da academia', 'monitoringService', error);
    throw error;
  }
}

/**
 * Verifica saúde do sistema
 */
export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    const supabase = getSupabaseClient();

    // Verificar conexão com Supabase
    const { error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (connectionError) {
      issues.push(`Erro de conexão: ${connectionError.message}`);
    }

    // Verificar se há assinaturas expiradas que não foram revogadas
    const { data: expiredNotRevoked } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())
      .limit(1);

    if (expiredNotRevoked && expiredNotRevoked.length > 0) {
      issues.push('Há assinaturas expiradas que não foram revogadas');
    }

    // Verificar se há academias canceladas com alunos ativos
    const { data: cancelledGymsWithActiveStudents } = await supabase
      .from('users')
      .select('id')
      .eq('access_blocked', false)
      .not('gym_id', 'is', null)
      .in('gym_id', 
        supabase
          .from('companies')
          .select('id')
          .eq('status', 'cancelled')
      )
      .limit(1);

    if (cancelledGymsWithActiveStudents && cancelledGymsWithActiveStudents.length > 0) {
      issues.push('Há academias canceladas com alunos ainda ativos');
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  } catch (error: any) {
    issues.push(`Erro ao verificar saúde: ${error.message}`);
    return {
      healthy: false,
      issues,
    };
  }
}


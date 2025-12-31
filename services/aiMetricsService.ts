/**
 * Serviço de Métricas de IA (B2B2C)
 * Tracking de conversão trial → pago, uso médio, etc.
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface TrialConversionMetrics {
  totalTrials: number;
  convertedTrials: number;
  conversionRate: number; // porcentagem
  averageTrialDays: number;
}

export interface StudentAiUsageMetrics {
  studentId: string;
  studentName: string;
  academyId?: string;
  academyName?: string;
  totalChatMessages: number;
  totalVoiceMinutes: number;
  totalVisionScans: number;
  totalPlansGenerated: number;
  subscriptionStatus: string;
  trialEndDate?: string;
}

export interface AcademyConversionMetrics {
  academyId: string;
  academyName: string;
  totalStudents: number;
  studentsOnTrial: number;
  studentsWithActiveSubscription: number;
  conversionRate: number;
}

/**
 * Registra evento de trial iniciado
 */
export async function trackTrialStarted(userId: string, academyId?: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('ai_events').insert({
      event_type: 'trial_started',
      user_id: userId,
      academy_id: academyId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      logger.error('Erro ao registrar trial iniciado', 'aiMetricsService', error);
    }
  } catch (error) {
    logger.error('Erro fatal ao registrar trial iniciado', 'aiMetricsService', error);
  }
}

/**
 * Registra evento de trial expirado
 */
export async function trackTrialExpired(userId: string, academyId?: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('ai_events').insert({
      event_type: 'trial_expired',
      user_id: userId,
      academy_id: academyId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      logger.error('Erro ao registrar trial expirado', 'aiMetricsService', error);
    }
  } catch (error) {
    logger.error('Erro fatal ao registrar trial expirado', 'aiMetricsService', error);
  }
}

/**
 * Registra evento de conversão (trial → pago)
 */
export async function trackConversion(userId: string, planId: string, academyId?: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('ai_events').insert({
      event_type: 'conversion',
      user_id: userId,
      academy_id: academyId,
      metadata: {
        plan_id: planId,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      logger.error('Erro ao registrar conversão', 'aiMetricsService', error);
    }
  } catch (error) {
    logger.error('Erro fatal ao registrar conversão', 'aiMetricsService', error);
  }
}

/**
 * Registra uso de IA (chat, voz, visão, planos)
 * 
 * IMPORTANTE: Esta função é totalmente desacoplada do fluxo principal.
 * Falhas no tracking NÃO devem quebrar o sistema de IA.
 */
export async function trackAiUsage(
  userId: string,
  feature: 'chat' | 'voice' | 'vision' | 'plan',
  amount: number,
  academyId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error, status } = await supabase.from('ai_usage').insert({
      user_id: userId,
      academy_id: academyId,
      feature,
      amount,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    if (error) {
      // Tratar especificamente erro 404 (tabela não existe)
      const errorStatus = (error as any)?.status || (error as any)?.code;
      if (errorStatus === 404 || errorStatus === 'PGRST116' || error?.message?.includes('404')) {
        // Tabela não existe - apenas log de warning em dev, não gerar erro
        if (import.meta.env.DEV) {
          console.warn('[AI_USAGE] Endpoint /ai_usage não configurado (404). Tracking desabilitado.');
        }
        return; // Silenciosamente retornar sem propagar erro
      }
      
      // Outros erros: log de warning sem quebrar o sistema
      if (import.meta.env.DEV) {
        console.warn('[AI_USAGE] Falha ao registrar uso de IA:', error);
      }
      logger.warn('Erro ao registrar uso de IA', 'aiMetricsService', error);
    }
  } catch (error: any) {
    // Tratar especificamente erro 404 em exceptions
    const errorStatus = error?.status || error?.code || error?.response?.status;
    if (errorStatus === 404 || error?.message?.includes('404')) {
      if (import.meta.env.DEV) {
        console.warn('[AI_USAGE] Endpoint /ai_usage não configurado (404). Tracking desabilitado.');
      }
      return; // Silenciosamente retornar sem propagar erro
    }
    
    // Outros erros: log de warning sem quebrar o sistema
    if (import.meta.env.DEV) {
      console.warn('[AI_USAGE] Erro ao registrar uso de IA:', error);
    }
    logger.warn('Erro ao registrar uso de IA', 'aiMetricsService', error);
    // NÃO propagar erro - tracking é opcional
  }
}

/**
 * Obtém métricas de conversão trial → pago
 */
export async function getTrialConversionMetrics(): Promise<TrialConversionMetrics> {
  try {
    const supabase = getSupabaseClient();
    
    // Contar trials iniciados
    const { data: trials, error: trialsError } = await supabase
      .from('ai_events')
      .select('*')
      .eq('event_type', 'trial_started');

    if (trialsError) {
      throw trialsError;
    }

    // Contar conversões
    const { data: conversions, error: conversionsError } = await supabase
      .from('ai_events')
      .select('*')
      .eq('event_type', 'conversion');

    if (conversionsError) {
      throw conversionsError;
    }

    const totalTrials = trials?.length || 0;
    const convertedTrials = conversions?.length || 0;
    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

    // Calcular média de dias de trial (simplificado)
    const averageTrialDays = 7; // Padrão, pode ser calculado com mais precisão

    return {
      totalTrials,
      convertedTrials,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageTrialDays,
    };
  } catch (error) {
    logger.error('Erro ao obter métricas de conversão', 'aiMetricsService', error);
    return {
      totalTrials: 0,
      convertedTrials: 0,
      conversionRate: 0,
      averageTrialDays: 0,
    };
  }
}

/**
 * Obtém uso médio de IA por aluno
 */
export async function getStudentAiUsageMetrics(studentId: string): Promise<StudentAiUsageMetrics | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar dados do aluno
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nome, academy_id, ai_subscription_status, ai_trial_end_at')
      .eq('id', studentId)
      .maybeSingle();

    if (userError || !user) {
      throw userError || new Error('Aluno não encontrado');
    }

    // Buscar uso de IA (tabela opcional - pode não existir)
    const { data: usage, error: usageError } = await supabase
      .from('ai_usage')
      .select('feature, amount')
      .eq('user_id', studentId);

    // Tratar erro 404 ou PGRST116 (tabela não existe) silenciosamente
    if (usageError) {
      const errorCode = (usageError as any)?.code;
      const errorStatus = (usageError as any)?.status;
      if (errorCode === 'PGRST116' || errorStatus === 404 || usageError.message?.includes('404')) {
        // Tabela não existe - continuar com dados vazios
        if (import.meta.env.DEV) {
          console.warn('[AI_USAGE] Tabela ai_usage não existe. Retornando métricas vazias.');
        }
      } else {
        // Outros erros: logar mas continuar
        if (import.meta.env.DEV) {
          console.warn('[AI_USAGE] Erro ao buscar uso de IA:', usageError);
        }
      }
      // Continuar com usage = [] (dados vazios)
    }

    const metrics: StudentAiUsageMetrics = {
      studentId: user.id,
      studentName: user.nome,
      academyId: user.academy_id,
      totalChatMessages: 0,
      totalVoiceMinutes: 0,
      totalVisionScans: 0,
      totalPlansGenerated: 0,
      subscriptionStatus: user.ai_subscription_status || 'none',
      trialEndDate: user.ai_trial_end_at,
    };

    // Agregar uso por feature
    usage?.forEach((item) => {
      switch (item.feature) {
        case 'chat':
          metrics.totalChatMessages += item.amount;
          break;
        case 'voice':
          metrics.totalVoiceMinutes += item.amount;
          break;
        case 'vision':
          metrics.totalVisionScans += item.amount;
          break;
        case 'plan':
          metrics.totalPlansGenerated += item.amount;
          break;
      }
    });

    return metrics;
  } catch (error) {
    logger.error('Erro ao obter métricas de uso do aluno', 'aiMetricsService', error);
    return null;
  }
}

/**
 * Obtém métricas de conversão por academia
 */
export async function getAcademyConversionMetrics(): Promise<AcademyConversionMetrics[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar todas as academias
    const { data: academies, error: academiesError } = await supabase
      .from('academies')
      .select('id, name');

    if (academiesError) {
      throw academiesError;
    }

    const metrics: AcademyConversionMetrics[] = [];

    for (const academy of academies || []) {
      // Contar alunos da academia
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('id, ai_subscription_status, ai_trial_end_at')
        .eq('academy_id', academy.id)
        .eq('tenant_role', 'student');

      if (studentsError) {
        logger.warn(`Erro ao buscar alunos da academia ${academy.id}`, 'aiMetricsService', studentsError);
        continue;
      }

      const totalStudents = students?.length || 0;
      const studentsOnTrial = students?.filter(
        (s) => s.ai_subscription_status === 'trial' && 
        (!s.ai_trial_end_at || new Date(s.ai_trial_end_at) > new Date())
      ).length || 0;
      const studentsWithActiveSubscription = students?.filter(
        (s) => s.ai_subscription_status === 'active'
      ).length || 0;

      const conversionRate = totalStudents > 0 
        ? (studentsWithActiveSubscription / totalStudents) * 100 
        : 0;

      metrics.push({
        academyId: academy.id,
        academyName: academy.name,
        totalStudents,
        studentsOnTrial,
        studentsWithActiveSubscription,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });
    }

    // Ordenar por taxa de conversão (maior primeiro)
    return metrics.sort((a, b) => b.conversionRate - a.conversionRate);
  } catch (error) {
    logger.error('Erro ao obter métricas de conversão por academia', 'aiMetricsService', error);
    return [];
  }
}


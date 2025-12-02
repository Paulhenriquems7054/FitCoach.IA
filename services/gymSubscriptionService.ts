/**
 * Serviço para gerenciar assinaturas das academias
 * Permite que o desenvolvedor veja e controle as assinaturas de cada academia
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface GymSubscriptionInfo {
  gymId: string;
  gymName: string;
  adminUserId: string | null;
  adminUsername: string | null;
  adminEmail: string | null;
  subscriptionId: string | null;
  planId: string | null;
  planName: string | null;
  planDisplayName: string | null;
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing' | 'none';
  billingCycle: 'monthly' | 'yearly' | 'trial' | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentProvider: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Busca informações de assinatura de todas as academias
 */
export async function getAllGymsWithSubscriptions(): Promise<GymSubscriptionInfo[]> {
  const supabase = getSupabaseClient();
  
  try {
    // Buscar todas as academias
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id, name')
      .order('name');
    
    if (gymsError) {
      logger.error('Erro ao buscar academias', 'gymSubscriptionService', gymsError);
      return [];
    }
    
    if (!gyms || gyms.length === 0) {
      return [];
    }
    
    // Para cada academia, buscar o admin e sua assinatura
    const gymsWithSubscriptions: GymSubscriptionInfo[] = [];
    
    for (const gym of gyms) {
      try {
        // Buscar usuário admin da academia
        const { data: adminUsers, error: adminError } = await supabase
          .from('users')
          .select('id, username')
          .eq('gym_id', gym.id)
          .eq('gym_role', 'admin')
          .limit(1)
          .maybeSingle();
        
        if (adminError) {
          logger.warn(`Erro ao buscar admin da academia ${gym.name}`, 'gymSubscriptionService', adminError);
        }
        
        const adminUserId = adminUsers?.id || null;
        const adminUsername = adminUsers?.username || null;
        
        // Buscar email do admin (está em auth.users, mas não temos acesso direto no cliente)
        // Por enquanto, deixar null - pode ser adicionado via Edge Function se necessário
        const adminEmail: string | null = null;
        
        // Buscar assinatura do admin
        let subscriptionInfo: GymSubscriptionInfo = {
          gymId: gym.id,
          gymName: gym.name,
          adminUserId,
          adminUsername,
          adminEmail,
          subscriptionId: null,
          planId: null,
          planName: null,
          planDisplayName: null,
          status: 'none',
          billingCycle: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          paymentProvider: null,
          createdAt: null,
          updatedAt: null,
        };
        
        if (adminUserId) {
          // Buscar assinatura do admin (buscar a mais recente, independente do status)
          const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select(`
              id,
              plan_id,
              status,
              billing_cycle,
              current_period_start,
              current_period_end,
              cancel_at_period_end,
              canceled_at,
              payment_provider,
              created_at,
              updated_at
            `)
            .eq('user_id', adminUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (subError) {
            logger.warn(`Erro ao buscar assinatura do admin da academia ${gym.name}`, 'gymSubscriptionService', subError);
          } else if (subscription) {
            // Se encontrou assinatura, buscar informações do plano
            let planName: string | null = null;
            let planDisplayName: string | null = null;
            if (subscription.plan_id) {
              const { data: plan } = await supabase
                .from('subscription_plans')
                .select('name, display_name')
                .eq('id', subscription.plan_id)
                .maybeSingle();
              
              if (plan) {
                planName = plan.name;
                planDisplayName = plan.display_name;
              }
            }
            
            // Atualizar informações da assinatura
            subscriptionInfo = {
              gymId: gym.id,
              gymName: gym.name,
              adminUserId,
              adminUsername,
              adminEmail,
              subscriptionId: subscription.id,
              planId: subscription.plan_id,
              planName,
              planDisplayName,
              status: subscription.status as any,
              billingCycle: subscription.billing_cycle as any,
              currentPeriodStart: subscription.current_period_start,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              canceledAt: subscription.canceled_at,
              paymentProvider: subscription.payment_provider,
              createdAt: subscription.created_at,
              updatedAt: subscription.updated_at,
            };
          }
        }
        
        gymsWithSubscriptions.push(subscriptionInfo);
      } catch (error) {
        logger.error(`Erro ao processar academia ${gym.name}`, 'gymSubscriptionService', error);
        // Adicionar academia sem dados de assinatura
        gymsWithSubscriptions.push({
          gymId: gym.id,
          gymName: gym.name,
          adminUserId: null,
          adminUsername: null,
          adminEmail: null,
          subscriptionId: null,
          planId: null,
          planName: null,
          planDisplayName: null,
          status: 'none',
          billingCycle: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          paymentProvider: null,
          createdAt: null,
          updatedAt: null,
        });
      }
    }
    
    return gymsWithSubscriptions;
  } catch (error) {
    logger.error('Erro ao buscar assinaturas das academias', 'gymSubscriptionService', error);
    return [];
  }
}

/**
 * Atualiza o status de uma assinatura
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);
    
    if (error) {
      logger.error('Erro ao atualizar status da assinatura', 'gymSubscriptionService', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao atualizar status da assinatura', 'gymSubscriptionService', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Interface para estatísticas de assinaturas
 */
export interface SubscriptionStats {
  totalGyms: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  expiredSubscriptions: number;
  pastDueSubscriptions: number;
  trialingSubscriptions: number;
  noSubscription: number;
}

/**
 * Interface para dados históricos de assinaturas
 */
export interface SubscriptionHistoryData {
  date: string;
  active: number;
  trialing: number;
  canceled: number;
  expired: number;
  total: number;
}

// Cache para estatísticas (30 segundos)
let statsCache: SubscriptionStats | null = null;
let statsCacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 1000; // 30 segundos

/**
 * Busca estatísticas agregadas de assinaturas diretamente do Supabase
 * Retorna contagens otimizadas usando queries SQL
 * Implementa cache de 30 segundos para reduzir chamadas
 */
export async function getSubscriptionStats(forceRefresh: boolean = false): Promise<SubscriptionStats> {
  // Verificar cache
  const now = Date.now();
  if (!forceRefresh && statsCache && (now - statsCacheTimestamp) < CACHE_DURATION) {
    logger.debug('Retornando estatísticas do cache', 'gymSubscriptionService');
    return statsCache;
  }
  const supabase = getSupabaseClient();
  
  try {
    // 1. Total de academias
    const { count: totalGyms, error: gymsCountError } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true });
    
    if (gymsCountError) {
      logger.error('Erro ao contar academias', 'gymSubscriptionService', gymsCountError);
      throw gymsCountError;
    }
    
    // 2. Buscar todos os admins de academias
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, gym_id')
      .eq('gym_role', 'admin')
      .not('gym_id', 'is', null);
    
    if (adminError) {
      logger.error('Erro ao buscar admins', 'gymSubscriptionService', adminError);
      throw adminError;
    }
    
    const adminUserIds = (adminUsers || []).map(u => u.id);
    
    if (adminUserIds.length === 0) {
      // Se não há admins, todas as academias estão sem assinatura
      return {
        totalGyms: totalGyms || 0,
        activeSubscriptions: 0,
        canceledSubscriptions: 0,
        expiredSubscriptions: 0,
        pastDueSubscriptions: 0,
        trialingSubscriptions: 0,
        noSubscription: totalGyms || 0,
      };
    }
    
    // 3. Buscar assinaturas dos admins (apenas as mais recentes de cada admin)
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, status')
      .in('user_id', adminUserIds)
      .order('created_at', { ascending: false });
    
    if (subError) {
      logger.error('Erro ao buscar assinaturas', 'gymSubscriptionService', subError);
      throw subError;
    }
    
    // 4. Agrupar por admin (pegar apenas a assinatura mais recente de cada admin)
    const latestSubscriptionsByAdmin = new Map<string, string>();
    (subscriptions || []).forEach(sub => {
      if (!latestSubscriptionsByAdmin.has(sub.user_id)) {
        latestSubscriptionsByAdmin.set(sub.user_id, sub.status);
      }
    });
    
    // 5. Contar por status
    const statusCounts = {
      active: 0,
      trialing: 0,
      canceled: 0,
      expired: 0,
      past_due: 0,
    };
    
    latestSubscriptionsByAdmin.forEach(status => {
      if (status === 'active') statusCounts.active++;
      else if (status === 'trialing') statusCounts.trialing++;
      else if (status === 'canceled') statusCounts.canceled++;
      else if (status === 'expired') statusCounts.expired++;
      else if (status === 'past_due') statusCounts.past_due++;
    });
    
    // 6. Calcular academias sem assinatura
    const academiasComAssinatura = latestSubscriptionsByAdmin.size;
    const noSubscription = (totalGyms || 0) - academiasComAssinatura;
    
    const stats: SubscriptionStats = {
      totalGyms: totalGyms || 0,
      activeSubscriptions: statusCounts.active,
      canceledSubscriptions: statusCounts.canceled,
      expiredSubscriptions: statusCounts.expired,
      pastDueSubscriptions: statusCounts.past_due,
      trialingSubscriptions: statusCounts.trialing,
      noSubscription: Math.max(0, noSubscription), // Garantir que não seja negativo
    };
    
    // Atualizar cache
    statsCache = stats;
    statsCacheTimestamp = now;
    
    return stats;
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de assinaturas', 'gymSubscriptionService', error);
    
    // Se houver cache válido, retornar cache mesmo em caso de erro
    if (statsCache) {
      logger.warn('Retornando cache devido a erro na busca', 'gymSubscriptionService');
      return statsCache;
    }
    
    // Retornar valores padrão em caso de erro e sem cache
    return {
      totalGyms: 0,
      activeSubscriptions: 0,
      canceledSubscriptions: 0,
      expiredSubscriptions: 0,
      pastDueSubscriptions: 0,
      trialingSubscriptions: 0,
      noSubscription: 0,
    };
  }
}

/**
 * Busca histórico de assinaturas dos últimos 30 dias
 * Útil para gráficos de evolução
 * Simplificado: mostra apenas os dados atuais e cria uma série temporal baseada nas datas de criação
 */
export async function getSubscriptionHistory(days: number = 30): Promise<SubscriptionHistoryData[]> {
  const supabase = getSupabaseClient();
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Buscar todos os admins
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, gym_id, created_at')
      .eq('gym_role', 'admin')
      .not('gym_id', 'is', null);
    
    if (adminError) {
      logger.error('Erro ao buscar admins para histórico', 'gymSubscriptionService', adminError);
      return [];
    }
    
    const adminUserIds = (adminUsers || []).map(u => u.id);
    
    if (adminUserIds.length === 0) {
      return [];
    }
    
    // Buscar todas as assinaturas dos admins
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, status, created_at, updated_at, current_period_end')
      .in('user_id', adminUserIds)
      .order('created_at', { ascending: true });
    
    if (subError) {
      logger.error('Erro ao buscar assinaturas para histórico', 'gymSubscriptionService', subError);
      return [];
    }
    
    // Criar mapa de datas (uma entrada por dia)
    const historyMap = new Map<string, {
      active: number;
      trialing: number;
      canceled: number;
      expired: number;
      total: number;
    }>();
    
    // Inicializar todas as datas do período
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];
      historyMap.set(dateKey, {
        active: 0,
        trialing: 0,
        canceled: 0,
        expired: 0,
        total: 0,
      });
    }
    
    // Para cada data, calcular status das assinaturas
    historyMap.forEach((counts, dateKey) => {
      const currentDate = new Date(dateKey);
      currentDate.setHours(23, 59, 59, 999);
      
      // Para cada admin, verificar qual era o status naquela data
      adminUserIds.forEach(adminId => {
        // Buscar assinatura mais recente antes ou na data atual
        const relevantSubs = (subscriptions || []).filter(sub => {
          const subDate = new Date(sub.created_at);
          return sub.user_id === adminId && subDate <= currentDate;
        });
        
        if (relevantSubs.length > 0) {
          // Pegar a mais recente
          const latestSub = relevantSubs.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          // Verificar se estava ativa naquela data
          const subEndDate = latestSub.current_period_end 
            ? new Date(latestSub.current_period_end)
            : null;
          
          const isActiveOnDate = !subEndDate || subEndDate >= currentDate;
          
          if (isActiveOnDate) {
            if (latestSub.status === 'active') counts.active++;
            else if (latestSub.status === 'trialing') counts.trialing++;
            else if (latestSub.status === 'canceled') counts.canceled++;
            else if (latestSub.status === 'expired') counts.expired++;
          } else {
            counts.expired++;
          }
          
          counts.total++;
        }
      });
    });
    
    // Converter para array ordenado
    const historyData: SubscriptionHistoryData[] = Array.from(historyMap.entries())
      .map(([date, counts]) => ({
        date,
        active: counts.active,
        trialing: counts.trialing,
        canceled: counts.canceled,
        expired: counts.expired,
        total: counts.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return historyData;
  } catch (error) {
    logger.error('Erro ao buscar histórico de assinaturas', 'gymSubscriptionService', error);
    return [];
  }
}


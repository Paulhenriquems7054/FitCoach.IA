/**
 * Serviço para gerenciar clientes de Personal Trainers
 * Busca clientes vinculados via activation_codes
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import type { User } from '../types';

export interface PersonalTrainerClient {
  userId: string;
  nome: string;
  username?: string;
  email?: string;
  photoUrl?: string;
  peso: number;
  altura: number;
  objetivo: string;
  activatedAt: string;
  subscriptionId?: string;
  weightHistory: { date: string; weight: number }[];
  lastActivity?: string;
}

/**
 * Busca todos os clientes de um personal trainer
 * Baseado em activation_codes onde personal_trainer_id = userId
 */
export async function getPersonalTrainerClients(
  personalTrainerId: string
): Promise<PersonalTrainerClient[]> {
  try {
    const supabase = getSupabaseClient();

    // 1. Buscar código de ativação do personal trainer
    const { data: activationCode, error: codeError } = await supabase
      .from('activation_codes')
      .select('id, code')
      .eq('personal_trainer_id', personalTrainerId)
      .eq('type', 'personal')
      .eq('is_active', true)
      .maybeSingle();

    if (codeError || !activationCode) {
      logger.warn(`Nenhum código de ativação encontrado para personal trainer ${personalTrainerId}`, 'personalTrainerService');
      return [];
    }

    // 2. Buscar usuários que têm plan_type de personal trainer
    // NOTA: Esta é uma aproximação. Idealmente, deveria haver uma tabela de relacionamento
    // que vincule clientes ao personal trainer. Por enquanto, buscamos usuários com plan_type
    // personal que foram criados após a criação do código de ativação.
    // TODO: Implementar tabela de relacionamento personal_trainer_clients
    const { data: usersWithPersonalPlan, error: usersError } = await supabase
      .from('users')
      .select('id, plan_type, created_at')
      .in('plan_type', ['personal_team_5', 'personal_team_15'])
      .gte('created_at', activationCode.created_at || '2020-01-01') // Apenas usuários criados após o código
      .neq('id', personalTrainerId) // Excluir o próprio personal trainer
      .order('created_at', { ascending: false });

    if (usersError) {
      logger.error('Erro ao buscar usuários com plano personal', 'personalTrainerService', usersError);
      return [];
    }

    if (!usersWithPersonalPlan || usersWithPersonalPlan.length === 0) {
      return [];
    }

    // 3. Buscar assinaturas desses usuários para obter data de ativação
    const userIds = usersWithPersonalPlan.map(u => u.id);
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('user_id, id, created_at')
      .in('user_id', userIds)
      .eq('payment_provider', 'activation_code')
      .order('created_at', { ascending: false });

    const subscriptionMap = new Map<string, { id: string; createdAt: string }>();
    (subscriptions || []).forEach(sub => {
      subscriptionMap.set(sub.user_id, { id: sub.id, createdAt: sub.created_at });
    });

    const clientUserIds = userIds;

    if (clientUserIds.length === 0) {
      return [];
    }

    // 4. Buscar dados completos dos clientes
    const { data: clients, error: clientsError } = await supabase
      .from('users')
      .select('id, nome, username, email, photo_url, peso, altura, objetivo, weight_history, updated_at')
      .in('id', clientUserIds);

    if (clientsError || !clients) {
      logger.error('Erro ao buscar dados dos clientes', 'personalTrainerService', clientsError);
      return [];
    }

    // 5. Mapear para formato PersonalTrainerClient
    return clients.map(client => {
      const subscription = subscriptionMap.get(client.id);
      return {
        userId: client.id,
        nome: client.nome,
        username: client.username,
        email: client.email,
        photoUrl: client.photo_url,
        peso: client.peso || 0,
        altura: client.altura || 0,
        objetivo: client.objetivo || '',
        activatedAt: subscription?.createdAt || client.updated_at || new Date().toISOString(),
        subscriptionId: subscription?.id,
        weightHistory: (client.weight_history as any) || [],
        lastActivity: client.updated_at,
      };
    });
  } catch (error) {
    logger.error('Erro ao buscar clientes do personal trainer', 'personalTrainerService', error);
    return [];
  }
}

/**
 * Busca estatísticas de clientes de um personal trainer
 */
export async function getPersonalTrainerStats(
  personalTrainerId: string
): Promise<{
  totalClients: number;
  activeClients: number;
  totalWeightLoss: number;
  averageWeightLoss: number;
  clientsWithProgress: number;
}> {
  try {
    const clients = await getPersonalTrainerClients(personalTrainerId);

    const activeClients = clients.filter(c => c.subscriptionId).length;
    const clientsWithProgress = clients.filter(c => c.weightHistory && c.weightHistory.length > 1).length;

    // Calcular perda de peso total e média
    let totalWeightLoss = 0;
    let clientsWithWeightChange = 0;

    clients.forEach(client => {
      if (client.weightHistory && client.weightHistory.length > 1) {
        const sorted = [...client.weightHistory].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const firstWeight = sorted[0].weight;
        const lastWeight = sorted[sorted.length - 1].weight;
        const weightChange = firstWeight - lastWeight;
        
        if (weightChange > 0) {
          totalWeightLoss += weightChange;
          clientsWithWeightChange++;
        }
      }
    });

    const averageWeightLoss = clientsWithWeightChange > 0 
      ? totalWeightLoss / clientsWithWeightChange 
      : 0;

    return {
      totalClients: clients.length,
      activeClients,
      totalWeightLoss: Math.round(totalWeightLoss * 10) / 10,
      averageWeightLoss: Math.round(averageWeightLoss * 10) / 10,
      clientsWithProgress,
    };
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do personal trainer', 'personalTrainerService', error);
    return {
      totalClients: 0,
      activeClients: 0,
      totalWeightLoss: 0,
      averageWeightLoss: 0,
      clientsWithProgress: 0,
    };
  }
}

/**
 * Busca o código de ativação de um personal trainer
 */
export async function getPersonalTrainerActivationCode(
  personalTrainerId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: activationCode, error } = await supabase
      .from('activation_codes')
      .select('code')
      .eq('personal_trainer_id', personalTrainerId)
      .eq('type', 'personal')
      .eq('is_active', true)
      .maybeSingle();

    if (error || !activationCode) {
      return { success: false, error: 'Código de ativação não encontrado' };
    }

    return { success: true, code: activationCode.code };
  } catch (error) {
    logger.error('Erro ao buscar código de ativação', 'personalTrainerService', error);
    return { success: false, error: 'Erro ao buscar código' };
  }
}


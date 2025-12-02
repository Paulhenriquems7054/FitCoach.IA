/**
 * Serviço para gerenciar chaves de API do Gemini por academia
 * Permite que o desenvolvedor controle qual academia usa qual chave
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface GymApiKeyConfig {
  gymId: string;
  gymName: string;
  geminiApiKey: string | null;
  geminiApiEnabled: boolean;
  lastUsed: string | null;
  usageCount: number;
}

/**
 * Busca todas as academias com suas configurações de API
 */
export async function getAllGymsWithApiConfig(): Promise<GymApiKeyConfig[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('id, name, gemini_api_key, gemini_api_enabled, gemini_api_last_used, gemini_api_usage_count')
      .order('name');
    
    if (error) {
      logger.error('Erro ao buscar academias', 'gymApiKeyService', error);
      return [];
    }
    
    return (data || []).map(gym => ({
      gymId: gym.id,
      gymName: gym.name,
      geminiApiKey: gym.gemini_api_key || null,
      geminiApiEnabled: gym.gemini_api_enabled ?? true, // Default true se não especificado
      lastUsed: gym.gemini_api_last_used || null,
      usageCount: gym.gemini_api_usage_count || 0,
    }));
  } catch (error) {
    logger.error('Erro ao buscar configurações de API das academias', 'gymApiKeyService', error);
    return [];
  }
}

/**
 * Atualiza a chave de API de uma academia
 */
export async function updateGymApiKey(
  gymId: string, 
  apiKey: string | null, 
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  
  try {
    // Se apiKey for string vazia, tratar como null
    const finalApiKey = apiKey && apiKey.trim() ? apiKey.trim() : null;
    
    const { error } = await supabase
      .from('gyms')
      .update({
        gemini_api_key: finalApiKey,
        gemini_api_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gymId);
    
    if (error) {
      logger.error('Erro ao atualizar chave de API', 'gymApiKeyService', error);
      return { success: false, error: error.message };
    }
    
    logger.info(`Chave de API atualizada para academia ${gymId}`, 'gymApiKeyService');
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao atualizar chave de API', 'gymApiKeyService', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Busca a chave de API de uma academia específica
 * Retorna null se não tiver chave própria ou se estiver desabilitada
 */
export async function getGymApiKey(gymId: string | null | undefined): Promise<string | null> {
  if (!gymId) {
    return null;
  }
  
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('gemini_api_key, gemini_api_enabled')
      .eq('id', gymId)
      .single();
    
    if (error || !data) {
      logger.debug(`Academia ${gymId} não encontrada ou sem configuração de API`, 'gymApiKeyService');
      return null;
    }
    
    // Se a API está desabilitada, retornar null
    if (data.gemini_api_enabled === false) {
      logger.debug(`API desabilitada para academia ${gymId}`, 'gymApiKeyService');
      return null;
    }
    
    // Retornar a chave se existir
    return data.gemini_api_key || null;
  } catch (error) {
    logger.error('Erro ao buscar chave de API da academia', 'gymApiKeyService', error);
    return null;
  }
}

/**
 * Registra uso da API para uma academia (para estatísticas)
 */
export async function recordApiUsage(gymId: string | null | undefined): Promise<void> {
  if (!gymId) {
    return;
  }
  
  const supabase = getSupabaseClient();
  
  try {
    // Buscar contador atual
    const { data: currentData } = await supabase
      .from('gyms')
      .select('gemini_api_usage_count')
      .eq('id', gymId)
      .single();
    
    const currentCount = currentData?.gemini_api_usage_count || 0;
    
    // Atualizar contador e última data de uso
    await supabase
      .from('gyms')
      .update({
        gemini_api_last_used: new Date().toISOString(),
        gemini_api_usage_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gymId);
  } catch (error) {
    // Não bloquear o fluxo se falhar ao registrar uso
    logger.warn('Erro ao registrar uso de API', 'gymApiKeyService', error);
  }
}

/**
 * Reseta o contador de uso de uma academia (útil para reset mensal)
 */
export async function resetGymUsageCount(gymId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('gyms')
      .update({
        gemini_api_usage_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gymId);
    
    if (error) {
      logger.error('Erro ao resetar contador de uso', 'gymApiKeyService', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao resetar contador de uso', 'gymApiKeyService', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Cria automaticamente uma chave de API para uma academia quando ela assina
 * Esta função deve ser chamada sempre que uma assinatura é criada/ativada
 * 
 * Lógica:
 * - Trial: Habilita API mas usa chave global (não cria chave própria)
 * - Assinatura ativa: Cria chave própria automaticamente
 * - Cancelada/Expirada: Mantém chave mas desabilita uso
 */
export async function autoSetupGymApiKey(
  userId: string,
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'expired'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  
  try {
    // 1. Verificar se o usuário é admin de uma academia
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, gym_id, gym_role')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      logger.warn(`Usuário ${userId} não encontrado`, 'gymApiKeyService');
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // 2. Se não for admin ou não tiver gym_id, não fazer nada
    if (user.gym_role !== 'admin' || !user.gym_id) {
      logger.debug(`Usuário ${userId} não é admin de academia, pulando criação de chave`, 'gymApiKeyService');
      return { success: true }; // Não é erro, apenas não aplicável
    }
    
    const gymId = user.gym_id;
    
    // 3. Verificar se já existe chave para esta academia
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('gemini_api_key, gemini_api_enabled')
      .eq('id', gymId)
      .single();
    
    if (gymError) {
      logger.error(`Erro ao buscar academia ${gymId}`, 'gymApiKeyService', gymError);
      return { success: false, error: 'Erro ao buscar academia' };
    }
    
    // 4. Se já tem chave própria, apenas atualizar status conforme assinatura
    if (gym.gemini_api_key) {
      logger.debug(`Academia ${gymId} já possui chave de API`, 'gymApiKeyService');
      // Atualizar status conforme assinatura
      if (subscriptionStatus === 'active') {
        await supabase
          .from('gyms')
          .update({ gemini_api_enabled: true })
          .eq('id', gymId);
      } else if (subscriptionStatus === 'canceled' || subscriptionStatus === 'expired') {
        await supabase
          .from('gyms')
          .update({ gemini_api_enabled: false })
          .eq('id', gymId);
      }
      return { success: true };
    }
    
    // 5. Se for trial, não criar chave própria (usa global)
    if (subscriptionStatus === 'trialing') {
      logger.info(`Academia ${gymId} em trial - habilitando API com chave global`, 'gymApiKeyService');
      // Apenas habilitar uso da API (com chave global)
      await supabase
        .from('gyms')
        .update({ 
          gemini_api_enabled: true,
          // gemini_api_key permanece null (usa global)
          updated_at: new Date().toISOString(),
        })
        .eq('id', gymId);
      return { success: true };
    }
    
    // 6. Se assinatura ativa, criar chave própria
    if (subscriptionStatus === 'active') {
      // Gerar uma nova chave de API
      const newApiKey = await generateNewApiKey();
      
      if (!newApiKey) {
        // Se não conseguir gerar automaticamente, apenas habilitar com chave global
        // O desenvolvedor pode adicionar chave própria depois no painel
        logger.warn(`Não foi possível gerar chave automática para academia ${gymId} - usando chave global`, 'gymApiKeyService');
        await supabase
          .from('gyms')
          .update({ 
            gemini_api_enabled: true,
            // gemini_api_key permanece null (usa global por enquanto)
            updated_at: new Date().toISOString(),
          })
          .eq('id', gymId);
        return { success: true }; // Sucesso, mas usando chave global
      }
      
      // Salvar chave na academia
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          gemini_api_key: newApiKey,
          gemini_api_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gymId);
      
      if (updateError) {
        logger.error(`Erro ao salvar chave de API para academia ${gymId}`, 'gymApiKeyService', updateError);
        return { success: false, error: 'Erro ao salvar chave de API' };
      }
      
      logger.info(`Chave de API criada automaticamente para academia ${gymId}`, 'gymApiKeyService');
      return { success: true };
    }
    
    // 7. Se cancelada/expirada, manter chave mas desabilitar uso
    if (subscriptionStatus === 'canceled' || subscriptionStatus === 'expired') {
      // Manter chave, mas desabilitar uso
      await supabase
        .from('gyms')
        .update({ 
          gemini_api_enabled: false,
          // Mantém gemini_api_key (não deleta)
          updated_at: new Date().toISOString(),
        })
        .eq('id', gymId);
      
      logger.info(`API desabilitada para academia ${gymId} (assinatura ${subscriptionStatus})`, 'gymApiKeyService');
      return { success: true };
    }
    
    return { success: true };
  } catch (error: any) {
    logger.error('Erro ao configurar chave de API automaticamente', 'gymApiKeyService', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Gera uma nova chave de API do Gemini
 * 
 * NOTA: Esta função precisa ser implementada com a lógica real de geração.
 * 
 * Opções de implementação:
 * 1. Usar API do Google para criar chave programaticamente (requer autenticação)
 * 2. Usar um pool de chaves pré-configuradas e rotacionar
 * 3. Retornar null e deixar desenvolvedor criar manualmente no painel
 * 
 * Por enquanto, retorna null para indicar que precisa ser criada manualmente.
 * Quando uma academia assina, a API será habilitada mas usará a chave global.
 * O desenvolvedor pode adicionar uma chave específica depois no painel.
 */
async function generateNewApiKey(): Promise<string | null> {
  // TODO: Implementar geração real de chave de API do Gemini
  // 
  // Exemplo de implementação futura com API do Google:
  // 
  // try {
  //   const MASTER_API_KEY = import.meta.env.VITE_GEMINI_MASTER_API_KEY;
  //   if (!MASTER_API_KEY) {
  //     logger.warn('VITE_GEMINI_MASTER_API_KEY não configurada', 'gymApiKeyService');
  //     return null;
  //   }
  //   
  //   const response = await fetch('https://generativelanguage.googleapis.com/v1beta/projects/PROJECT_ID/apiKeys', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${MASTER_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       displayName: `FitCoach.IA - Academia ${gymId}`,
  //     }),
  //   });
  //   
  //   if (!response.ok) {
  //     logger.error('Erro ao criar chave via API do Google', 'gymApiKeyService');
  //     return null;
  //   }
  //   
  //   const data = await response.json();
  //   return data.apiKey;
  // } catch (error) {
  //   logger.error('Erro ao gerar chave de API', 'gymApiKeyService', error);
  //   return null;
  // }
  
  // Por enquanto, retorna null - academia usará chave global
  // Desenvolvedor pode adicionar chave específica manualmente no painel
  logger.debug('Geração automática de chave de API não implementada - academia usará chave global', 'gymApiKeyService');
  return null;
}


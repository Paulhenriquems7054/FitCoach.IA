/**
 * Serviço de integração com Supabase
 * Substitui o IndexedDB por Supabase para suporte a assinaturas e multi-tenancy
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '../types';
import { logger } from '../utils/logger';
import { activateUserWithCode } from './activationCodeService';

// Tipos para Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nome: string;
          username: string | null;
          photo_url: string | null;
          idade: number;
          genero: 'Masculino' | 'Feminino';
          peso: number;
          altura: number;
          objetivo: string;
          points: number;
          discipline_score: number;
          completed_challenge_ids: string[];
          is_anonymized: boolean;
          role: 'user' | 'professional';
          gym_id: string | null;
          gym_role: 'student' | 'admin' | 'trainer' | 'receptionist' | null;
          is_gym_managed: boolean;
          matricula: string | null;
          data_permissions: any;
          security_settings: any;
          access_blocked: boolean;
          blocked_at: string | null;
          blocked_by: string | null;
          blocked_reason: string | null;
          last_sync_at: string | null;
          gym_server_url: string | null;
          // Controle de Plano
          plan_type: 'free' | 'monthly' | 'annual_vip' | 'academy_starter_mini' | 'academy_starter' | 'academy_growth' | 'academy_pro' | 'personal_team_5' | 'personal_team_15' | null;
          subscription_status: 'active' | 'inactive' | 'expired' | null;
          expiry_date: string | null;
          // Controle de Voz
          voice_daily_limit_seconds: number | null;
          voice_used_today_seconds: number | null;
          voice_balance_upsell: number | null;
          last_usage_date: string | null;
          // Controle de Chat
          text_msg_count_today: number | null;
          last_msg_date: string | null;
          // Nota: email não está na tabela users, está em auth.users
          // email: string | null; // Removido - não existe na tabela
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at' | 'email'> & {
          id?: string;
          email?: string | null; // Opcional - pode não existir na tabela
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          currency: string;
          limits: any;
          features: any;
          is_active: boolean;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
          billing_cycle: 'monthly' | 'yearly';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
          payment_method_id: string | null;
          payment_provider: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          subscription_id: string | null;
          user_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
          payment_method: string | null;
          payment_provider: string;
          provider_payment_id: string | null;
          description: string | null;
          metadata: any;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          payment_id: string | null;
          subscription_id: string | null;
          user_id: string;
          invoice_number: string;
          amount: number;
          currency: string;
          status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
          period_start: string | null;
          period_end: string | null;
          customer_name: string | null;
          customer_email: string | null;
          customer_address: any;
          line_items: any;
          invoice_pdf_url: string | null;
          hosted_invoice_url: string | null;
          due_date: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      gyms: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          settings: any;
          subscription_plan_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Inicializa o cliente Supabase
 */
export function initSupabase(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Verificar se as variáveis estão configuradas
  const urlIsExample = supabaseUrl && (supabaseUrl.includes('seu-projeto') || supabaseUrl === 'https://seu-projeto.supabase.co');
  const keyIsExample = supabaseAnonKey && (supabaseAnonKey.includes('sua_chave') || supabaseAnonKey === 'sua_chave_anon_key_aqui');

  if (!supabaseUrl || !supabaseAnonKey || urlIsExample || keyIsExample) {
    // Diagnóstico mais detalhado
    const urlStatus = !supabaseUrl ? 'não encontrado' : (urlIsExample ? 'valor de exemplo' : 'configurado');
    const keyStatus = !supabaseAnonKey ? 'não encontrado' : (keyIsExample ? 'valor de exemplo' : 'configurado');
    
    let actionMessage = '';
    if (!supabaseUrl || !supabaseAnonKey) {
      actionMessage = `
⚠️  PROBLEMA: Variáveis não estão sendo carregadas pelo Vite!

Possíveis causas:
1. O servidor não foi reiniciado após criar/modificar .env.local
2. O arquivo .env.local não está na raiz do projeto
3. As variáveis não começam com VITE_

SOLUÇÃO:
1. Pare o servidor completamente (Ctrl+C)
2. Certifique-se de que .env.local está na raiz (mesmo nível do package.json)
3. Verifique se as variáveis começam com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
4. Reinicie o servidor: npm run dev
      `.trim();
    } else {
      actionMessage = `
⚠️  PROBLEMA: Arquivo .env.local contém valores de EXEMPLO!

AÇÃO NECESSÁRIA:
1. Abra o arquivo .env.local na raiz do projeto
2. Acesse: https://app.supabase.com/project/seu-projeto/settings/api
3. Copie o "Project URL" e substitua em VITE_SUPABASE_URL
4. Copie a chave "anon public" e substitua em VITE_SUPABASE_ANON_KEY
5. REINICIE o servidor (pare com Ctrl+C e execute: npm run dev)
      `.trim();
    }

    const errorMessage = `
Supabase não configurado!

${actionMessage}

Status atual:
- VITE_SUPABASE_URL: ${urlStatus}${supabaseUrl ? ` (${supabaseUrl.substring(0, 50)}...)` : ''}
- VITE_SUPABASE_ANON_KEY: ${keyStatus}${supabaseAnonKey ? ` (${supabaseAnonKey.substring(0, 30)}...)` : ''}

💡 DICA: Se você acabou de criar/modificar o .env.local, REINICIE o servidor!
    `.trim();
    throw new Error(errorMessage);
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  logger.info('Cliente Supabase inicializado', 'supabaseService');
  return supabaseClient;
}

/**
 * Obtém o cliente Supabase
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Converte User do tipo local para formato do Supabase
 */
function userToSupabase(user: User, userId?: string): Database['public']['Tables']['users']['Insert'] {
  return {
    id: userId || user.id || undefined,
    nome: user.nome,
    username: user.username || null,
    photo_url: user.photoUrl || null,
    idade: user.idade,
    genero: user.genero,
    peso: Number(user.peso),
    altura: Number(user.altura),
    objetivo: user.objetivo,
    points: user.points,
    discipline_score: user.disciplineScore,
    completed_challenge_ids: user.completedChallengeIds || [],
    is_anonymized: user.isAnonymized || false,
    role: user.role || 'user',
    gym_id: user.gymId || null,
    gym_role: user.gymRole || null,
    is_gym_managed: user.isGymManaged || false,
    matricula: user.matricula || null,
    data_permissions: user.dataPermissions || {
      allowWeightHistory: true,
      allowMealPlans: true,
      allowPhotoAnalysis: true,
      allowWorkoutData: true,
      allowChatHistory: true,
    },
    security_settings: user.securitySettings || {
      biometricEnabled: false,
      securityNotifications: true,
    },
    access_blocked: user.accessBlocked || false,
    blocked_at: user.blockedAt || null,
    blocked_by: user.blockedBy || null,
    blocked_reason: user.blockedReason || null,
    last_sync_at: user.lastSyncAt || null,
    gym_server_url: user.gymServerUrl || null,
    // Novos campos de plano, voz e chat
    plan_type: (user.planType || 'free') as any,
    subscription_status: (user.subscriptionStatus || 'active') as any,
    expiry_date: user.expiryDate || null,
    voice_daily_limit_seconds: user.voiceDailyLimitSeconds || 900,
    voice_used_today_seconds: user.voiceUsedTodaySeconds || 0,
    voice_balance_upsell: user.voiceBalanceUpsell || 0,
    last_usage_date: user.lastUsageDate || null,
    text_msg_count_today: user.textMsgCountToday || 0,
    last_msg_date: user.lastMsgDate || null,
    // Email: não incluir se a coluna não existir (será obtido do auth.users se necessário)
    // email: (user as any).email || null,
  };
}

/**
 * Converte dados do Supabase para User local
 */
function supabaseToUser(row: Database['public']['Tables']['users']['Row']): User {
  return {
    id: row.id,
    nome: row.nome,
    username: row.username || undefined,
    photoUrl: row.photo_url || undefined,
    idade: row.idade,
    genero: row.genero,
    peso: Number(row.peso),
    altura: Number(row.altura),
    objetivo: row.objetivo as any,
    points: row.points,
    disciplineScore: row.discipline_score,
    completedChallengeIds: row.completed_challenge_ids || [],
    isAnonymized: row.is_anonymized,
    weightHistory: [], // Será carregado separadamente
    role: row.role,
    subscription: 'free', // Será determinado pela assinatura ativa
    gymId: row.gym_id || undefined,
    gymRole: row.gym_role || undefined,
    isGymManaged: row.is_gym_managed,
    matricula: row.matricula || undefined,
    dataPermissions: row.data_permissions,
    securitySettings: row.security_settings,
    accessBlocked: row.access_blocked,
    blockedAt: row.blocked_at || undefined,
    blockedBy: row.blocked_by || undefined,
    blockedReason: row.blocked_reason || undefined,
    lastSyncAt: row.last_sync_at || undefined,
    gymServerUrl: row.gym_server_url || undefined,
    // Novos campos de plano, voz e chat
    planType: row.plan_type || undefined,
    subscriptionStatus: row.subscription_status || undefined,
    expiryDate: row.expiry_date || undefined,
    voiceDailyLimitSeconds: row.voice_daily_limit_seconds || undefined,
    voiceUsedTodaySeconds: row.voice_used_today_seconds || undefined,
    voiceBalanceUpsell: row.voice_balance_upsell || undefined,
    lastUsageDate: row.last_usage_date || undefined,
    textMsgCountToday: row.text_msg_count_today || undefined,
    lastMsgDate: row.last_msg_date || undefined,
  };
}

/**
 * Salva ou atualiza um usuário no Supabase
 */
export async function saveUserToSupabase(user: User): Promise<User> {
  const supabase = getSupabaseClient();
  const userId = user.id || (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error('Usuário não autenticado');
  }

  const userData = userToSupabase(user, userId);

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao salvar usuário no Supabase', 'supabaseService', error);
    throw new Error(`Erro ao salvar usuário: ${error.message}`);
  }

  return supabaseToUser(data);
}

/**
 * Obtém um usuário do Supabase
 */
export async function getUserFromSupabase(userId?: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

  if (!targetUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Usuário não encontrado
      return null;
    }
    logger.error('Erro ao obter usuário do Supabase', 'supabaseService', error);
    throw new Error(`Erro ao obter usuário: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Carregar histórico de peso
  const weightHistory = await getWeightHistoryFromSupabase(targetUserId);
  const user = supabaseToUser(data);
  user.weightHistory = weightHistory;

  return user;
}

/**
 * Obtém histórico de peso do Supabase
 */
export async function getWeightHistoryFromSupabase(userId: string): Promise<{ date: string; weight: number }[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('weight_history')
    .select('date, weight')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    logger.error('Erro ao obter histórico de peso', 'supabaseService', error);
    return [];
  }

  return (data || []).map((entry) => ({
    date: entry.date,
    weight: Number(entry.weight),
  }));
}

/**
 * Obtém a assinatura ativa do usuário
 */
export async function getActiveSubscription(userId?: string, userEmail?: string, username?: string): Promise<Database['public']['Tables']['user_subscriptions']['Row'] | null> {
  const supabase = getSupabaseClient();
  
  let targetUserId = userId;
  
  // Se não tem userId, tentar buscar pelo email ou username
  if (!targetUserId) {
    // Nota: email não está na tabela users (está em auth.users)
    // Para buscar por email, use auth.users ou uma função SQL que acesse auth.users
    // Por enquanto, pulamos a busca por email e vamos direto para username
    if (userEmail) {
      logger.debug(`Email fornecido (${userEmail}), mas não buscando na tabela users (coluna não existe)`, 'supabaseService');
      // TODO: Implementar busca por email via auth.users ou função SQL se necessário
    }
    
    // Se não encontrou pelo email, tentar pelo username
    if (!targetUserId && username) {
      const { data: userData, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (userData && !usernameError) {
        targetUserId = userData.id;
        logger.info(`Usuário encontrado pelo username: ${username}`, 'supabaseService');
      } else if (usernameError) {
        logger.warn(`Erro ao buscar usuário por username: ${usernameError.message}`, 'supabaseService');
      }
    }
    
    // Se ainda não encontrou, tentar buscar todas as assinaturas ativas e verificar
    if (!targetUserId && username) {
      // Buscar usuários com username similar (pode ter diferenças de formatação)
      // Nota: não selecionar 'email' pois essa coluna não existe na tabela users (está em auth.users)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', `%${username}%`);
      
      if (usersData && usersData.length > 0) {
        targetUserId = usersData[0].id;
        logger.info(`Usuário encontrado por busca parcial de username: ${username}`, 'supabaseService');
      }
    }
  }

  if (!targetUserId) {
    logger.warn(`Usuário não encontrado no Supabase. Email: ${userEmail}, Username: ${username}`, 'supabaseService');
    return null;
  }

  logger.info(`Buscando assinatura para userId: ${targetUserId}`, 'supabaseService');
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', targetUserId)
    // Considerar tanto assinaturas ativas quanto em período de teste ('trialing')
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      logger.info('Nenhuma assinatura ativa encontrada', 'supabaseService');
      return null;
    }
    logger.error('Erro ao obter assinatura', 'supabaseService', error);
    return null;
  }

  if (data) {
    logger.info(`Assinatura ativa encontrada: ${data.id}`, 'supabaseService');
  }

  return data;
}

/**
 * Obtém todos os planos de assinatura disponíveis
 */
export async function getSubscriptionPlans(): Promise<Database['public']['Tables']['subscription_plans']['Row'][]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_visible', true)
    .order('price_monthly', { ascending: true });

  if (error) {
    logger.error('Erro ao obter planos de assinatura', 'supabaseService', error);
    return [];
  }

  return data || [];
}

/**
 * Cria uma nova assinatura para o usuário
 */
export async function createSubscription(
  planId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  userId?: string
): Promise<Database['public']['Tables']['user_subscriptions']['Row']> {
  const supabase = getSupabaseClient();
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

  if (!targetUserId) {
    throw new Error('Usuário não autenticado');
  }

  // Obter informações do plano
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    throw new Error('Plano de assinatura não encontrado');
  }

  // Calcular datas do período
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now);
  
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Criar assinatura
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: targetUserId,
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      current_period_start: periodStart,
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      payment_provider: 'stripe',
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao criar assinatura', 'supabaseService', error);
    throw new Error(`Erro ao criar assinatura: ${error.message}`);
  }

  // Criar chave de API automaticamente se for admin de academia
  if (data) {
    try {
      const { autoSetupGymApiKey } = await import('./gymApiKeyService');
      await autoSetupGymApiKey(targetUserId, 'active');
    } catch (apiKeyError) {
      // Não bloquear criação de assinatura se falhar ao criar chave
      logger.warn('Erro ao criar chave de API automaticamente (não crítico)', 'supabaseService', apiKeyError);
    }
  }

  return data;
}

/**
 * Cancela uma assinatura
 * @param subscriptionId - ID da assinatura
 * @param immediate - Se true, cancela imediatamente. Se false, cancela no fim do período.
 */
export async function cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<void> {
  const supabase = getSupabaseClient();

  if (immediate) {
    // Cancelar imediatamente
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: false,
        canceled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      logger.error('Erro ao cancelar assinatura imediatamente', 'supabaseService', error);
      throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
    }

    // Atualizar usuário para plano free
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (subscription) {
      await supabase
        .from('users')
        .update({
          plan_type: 'free',
          subscription_status: 'expired',
        })
        .eq('id', subscription.user_id);
    }
  } else {
    // Cancelar no fim do período
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      logger.error('Erro ao cancelar assinatura', 'supabaseService', error);
      throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
    }
  }
}

/**
 * Verifica se o usuário tem acesso a um recurso baseado na assinatura
 */
export async function checkFeatureAccess(feature: string, userId?: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  
  if (!subscription) {
    // Sem assinatura ativa, apenas recursos gratuitos
    return feature === 'basic_chat' || feature === 'basic_reports' || feature === 'weight_tracking';
  }

  // Obter plano
  const supabase = getSupabaseClient();
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('features')
    .eq('id', subscription.plan_id)
    .single();

  if (!plan) {
    return false;
  }

  const features = plan.features as string[];
  return features.includes(feature);
}

/**
 * Verifica limites de uso baseado na assinatura
 */
export async function checkUsageLimit(limitType: string, currentUsage: number, userId?: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  
  if (!subscription) {
    // Limites do plano gratuito
    const freeLimits: Record<string, number> = {
      maxReportsPerWeek: 5,
      maxPhotoAnalysesPerDay: 10,
      maxChatMessages: 100,
    };
    const limit = freeLimits[limitType] || 0;
    return currentUsage < limit;
  }

  // Obter limites do plano
  const supabase = getSupabaseClient();
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('limits')
    .eq('id', subscription.plan_id)
    .single();

  if (!plan) {
    return false;
  }

  const limits = plan.limits as Record<string, number>;
  const limit = limits[limitType];

  // -1 significa ilimitado
  if (limit === -1) {
    return true;
  }

  return currentUsage < limit;
}

// ============================================================================
// SERVIÇOS DE CUPOM
// ============================================================================

/**
 * Tipos de erro de validação de cupom
 */
export type CouponValidationError = 
  | 'CUPOM_INEXISTENTE'
  | 'CUPOM_INATIVO'
  | 'CUPOM_ESGOTADO'
  | 'CUPOM_EXPIRADO'
  | 'CUPOM_NAO_VALIDO'
  | 'LIMITE_CONTAS_ATINGIDO'
  | 'PAGAMENTO_INATIVO';

/**
 * Resultado da validação de cupom
 */
export interface CouponValidationResult {
  success: boolean;
  error?: CouponValidationError;
  message?: string;
  couponId?: string;
  planLinked?: string;
  caktoCustomerId?: string | null;
  linkedAccountsCount?: number;
  maxLinkedAccounts?: number | null;
  currentUses?: number;
  maxUses?: number;
}

/**
 * Serviço de cupons
 */
export const couponService = {
  /**
   * Valida um cupom e verifica se há acesso baseado em pagamento Cakto
   */
  async validateCoupon(couponCode: string): Promise<CouponValidationResult> {
    const supabase = getSupabaseClient();

    try {
      // Chamar função SQL de validação
      const { data, error } = await supabase.rpc('check_coupon_payment_access', {
        coupon_code: couponCode.toUpperCase().trim(),
      });

      if (error) {
        logger.error('Erro ao validar cupom', 'couponService', error);
        return {
          success: false,
          error: 'CUPOM_INEXISTENTE',
          message: 'Erro ao validar cupom',
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'CUPOM_INEXISTENTE',
          message: data?.message || 'Cupom inválido',
        };
      }

      return {
        success: true,
        couponId: data.coupon_id,
        planLinked: data.plan_linked,
        caktoCustomerId: data.cakto_customer_id,
        linkedAccountsCount: data.linked_accounts_count,
        maxLinkedAccounts: data.max_linked_accounts,
        currentUses: data.current_uses,
        maxUses: data.max_uses,
      };
    } catch (error) {
      logger.error('Erro ao validar cupom', 'couponService', error);
      return {
        success: false,
        error: 'CUPOM_INEXISTENTE',
        message: 'Erro ao validar cupom',
      };
    }
  },
};

/**
 * Serviço de fluxo de autenticação
 */
export const authFlowService = {
  /**
   * Registra um novo usuário com código de convite
   */
  async registerWithInvite(
    username: string,
    password: string,
    userData: Partial<User>,
    couponCode: string
  ): Promise<{ user: User; couponId: string }> {
    const supabase = getSupabaseClient();

    // 1. Tentar validar como CUPOM (fluxo B2C). Se não for cupom válido, trataremos como código de ativação (B2B / activation_code).
    const couponValidation = await couponService.validateCoupon(couponCode);
    const isCoupon = !!couponValidation.success;

    // 2. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email || `${username}@fitcoach.ia`,
      password: password,
      options: {
        data: {
          username: username,
          nome: userData.nome || username,
        },
      },
    });

    if (authError || !authData.user) {
      logger.error('Erro ao criar usuário no Supabase Auth', 'authFlowService', authError);
      
      // Mensagem de erro mais clara para casos específicos
      if (authError?.message?.includes('Email signups are disabled')) {
        throw new Error('Cadastros por email estão desabilitados no Supabase. Habilite em Authentication → Settings → Enable sign ups.');
      }
      
      // Rate limit - muitas tentativas de signup
      if (authError?.status === 429 || authError?.message?.includes('Too Many Requests') || authError?.message?.includes('after')) {
        const waitTime = authError?.message?.match(/(\d+)\s+seconds?/i)?.[1] || 'alguns';
        throw new Error(`Muitas tentativas de cadastro. Por segurança, aguarde ${waitTime} segundos antes de tentar novamente.`);
      }
      
      throw new Error(authError?.message || 'Erro ao criar conta');
    }

    const userId = authData.user.id;
    const userEmail = userData.email || `${username}@fitcoach.ia`;

    // IMPORTANTE: Verificar se a sessão está estabelecida após signup
    // Se não houver sessão (ex: confirmação de email habilitada), tentar fazer login
    let sessionEstablished = false;
    let currentSession = authData.session;

    if (!currentSession) {
      // Se não houver sessão, pode ser que confirmação de email esteja habilitada
      // Não tentar fazer login automaticamente, pois pode falhar se email não foi confirmado
      logger.warn('Sessão não retornada no signup. Pode ser necessário confirmar email.', 'authFlowService');
      logger.warn('Vamos tentar criar o perfil usando função SQL que bypassa RLS', 'authFlowService');
    } else {
      sessionEstablished = true;
    }

    // 3. Criar registro na tabela users
    // Usar o cliente autenticado (com a sessão do signup/login)
    const userSupabase = userToSupabase(
      {
        ...userData,
        username,
        // Se for cupom válido (B2C), já definimos o planType. Caso contrário, deixamos como 'free'
        planType: (isCoupon ? (couponValidation.planLinked as any) : 'free') || 'free',
        subscriptionStatus: 'active',
        expiryDate: undefined, // Será definido pelo plano
      },
      userId
    );

    // Remover email do insert se não existir na tabela (evitar erro de schema cache)
    const userSupabaseInsert = { ...userSupabase };
    delete (userSupabaseInsert as any).email; // Remover email para evitar erro se coluna não existir
    
    // Garantir que o id está definido corretamente
    if (!userSupabaseInsert.id) {
      userSupabaseInsert.id = userId;
    }
    
    // Verificar se o usuário está autenticado antes de inserir
    // Se não estiver autenticado, ainda podemos tentar inserir se a política RLS permitir
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || currentUser.id !== userId) {
      logger.warn('Usuário não autenticado ao tentar criar perfil, mas continuando...', 'authFlowService');
      logger.warn('Isso pode funcionar se a política RLS permitir inserção baseada apenas no ID', 'authFlowService');
    }
    
    // Tentar inserir diretamente primeiro
    let { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert(userSupabaseInsert)
      .select()
      .single();

    // Se falhar por falta de autenticação, tentar usar função SQL como fallback
    if (userError && (userError.code === '42501' || userError.message?.includes('row-level security'))) {
      logger.warn('Inserção direta falhou por RLS, tentando função SQL...', 'authFlowService');
      
      // Tentar usar função SQL que bypassa RLS
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('insert_user_profile_after_signup', {
          p_user_id: userId,
          p_nome: userData.nome || username,
          p_username: username,
          p_plan_type: (isCoupon ? (couponValidation.planLinked as any) : 'free') || 'free',
          p_subscription_status: 'active',
          p_user_data: {
            idade: userData.idade || 0,
            genero: userData.genero || 'Masculino',
            peso: userData.peso || 0,
            altura: userData.altura || 0,
            objetivo: userData.objetivo || 'perder peso',
            points: userData.points || 0,
            disciplineScore: userData.disciplineScore || 0,
            // Não enviar array vazio, deixar a função SQL lidar com isso
            completedChallengeIds: (userData.completedChallengeIds && userData.completedChallengeIds.length > 0) 
              ? userData.completedChallengeIds 
              : null,
            isAnonymized: userData.isAnonymized || false,
            role: userData.role || 'user',
          },
        });

        if (rpcError) {
          logger.error('Erro ao criar registro via função SQL', 'authFlowService', rpcError);
          // Continuar para tentar buscar o registro (pode ter sido criado mesmo com erro)
        }

        // A função SQL retorna uma tabela, então rpcData será um array
        // Se a função executou sem erro, o registro foi criado
        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          // Buscar o registro completo criado
          const { data: createdUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();  // Usar maybeSingle ao invés de single para evitar erro se não encontrar

          if (createdUser) {
            userRecord = createdUser;
            userError = null;
            logger.info('Perfil criado via função SQL com sucesso', 'authFlowService');
          } else {
            // Se não encontrou, pode ser que RLS esteja bloqueando a leitura
            // Mas o registro foi criado, então vamos continuar
            logger.warn('Registro criado via função SQL mas não foi possível recuperá-lo (pode ser RLS)', 'authFlowService');
            // Criar um objeto mínimo para continuar o fluxo
            userRecord = {
              id: userId,
              nome: userData.nome || username,
              username: username,
            } as any;
            userError = null;
          }
        } else if (rpcError) {
          // Se houve erro na função SQL, verificar se foi erro de tipo ou outro
          logger.error('Erro na função SQL', 'authFlowService', rpcError);
          throw new Error(`Erro ao criar perfil: ${rpcError.message}. Verifique se a função SQL foi criada corretamente.`);
        } else {
          throw new Error('Função SQL executou mas não retornou dados. Verifique se o registro foi criado.');
        }
      } catch (rpcException: any) {
        logger.error('Exceção ao usar função SQL', 'authFlowService', rpcException);
        throw new Error(rpcException?.message || 'Erro ao criar perfil. Verifique se a função SQL foi criada no Supabase.');
      }
    } else if (userError || !userRecord) {
      logger.error('Erro ao criar registro de usuário', 'authFlowService', userError);
      
      // Log detalhado para debug
      if (userError) {
        logger.error(`Código do erro: ${userError.code}`, 'authFlowService');
        logger.error(`Mensagem: ${userError.message}`, 'authFlowService');
        logger.error(`Detalhes: ${JSON.stringify(userError)}`, 'authFlowService');
      }
      
      throw new Error(userError?.message || 'Erro ao criar perfil. Verifique se a política RLS está configurada corretamente.');
    }

    // 4. Se for um CUPOM válido (B2C), criar vínculo com cupom (trigger incrementará contadores automaticamente)
    if (isCoupon && couponValidation.couponId) {
      // Verificar se o vínculo já existe antes de criar
      const { data: existingLink, error: checkError } = await supabase
        .from('user_coupon_links')
        .select('id')
        .eq('user_id', userId)
        .eq('coupon_id', couponValidation.couponId)
        .maybeSingle();

      if (!existingLink && !checkError) {
        // Vínculo não existe, criar
        const { error: linkError } = await supabase
          .from('user_coupon_links')
          .insert({
            user_id: userId,
            coupon_id: couponValidation.couponId,
          });

        if (linkError) {
          // Se for erro de duplicata (pode ter sido criado entre a verificação e a inserção), ignorar
          if (linkError.code === '23505') {
            logger.info('Vínculo com cupom já existe (criado entre verificação e inserção)', 'authFlowService');
          } else {
            logger.error('Erro ao vincular cupom', 'authFlowService', linkError);
            logger.warn('Usuário criado mas vínculo com cupom falhou', 'authFlowService');
          }
        } else {
          logger.info('Vínculo com cupom criado com sucesso', 'authFlowService');
        }
      } else if (existingLink) {
        logger.info('Vínculo com cupom já existe, pulando criação', 'authFlowService');
      } else if (checkError) {
        logger.warn('Erro ao verificar vínculo existente, tentando criar mesmo assim', 'authFlowService', checkError);
        // Tentar criar mesmo assim (pode ser erro de RLS)
        const { error: linkError } = await supabase
          .from('user_coupon_links')
          .insert({
            user_id: userId,
            coupon_id: couponValidation.couponId,
          });

        if (linkError && linkError.code !== '23505') {
          logger.error('Erro ao vincular cupom após verificação falhar', 'authFlowService', linkError);
        }
      }
    }

    // 5. Verificar se conseguimos buscar o usuário criado
    // Aguardar um pouco para garantir que o registro está disponível
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Tentar buscar o usuário criado para garantir que está acessível
    let finalUser: User;
    
    try {
      // Primeiro, tentar converter o userRecord que temos
      if (userRecord) {
        finalUser = supabaseToUser(userRecord);
        logger.info('Usuário convertido do registro criado', 'authFlowService');
      } else {
        throw new Error('userRecord não está disponível');
      }
      
      // Tentar buscar do banco para garantir que está acessível
      const { data: fetchedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchedUser && !fetchError) {
        finalUser = supabaseToUser(fetchedUser);
        logger.info('Usuário encontrado e atualizado após criação', 'authFlowService');
      } else if (fetchError) {
        logger.warn('Não foi possível buscar usuário após criação (pode ser RLS)', 'authFlowService', fetchError);
        // Continuar com o userRecord que temos - já convertido acima
        logger.info('Usando usuário do registro criado (não foi possível buscar do banco)', 'authFlowService');
      } else {
        logger.warn('Usuário não encontrado no banco após criação, usando registro criado', 'authFlowService');
      }
    } catch (fetchException: any) {
      logger.error('Exceção ao processar usuário após criação', 'authFlowService', fetchException);
      
      // Se não conseguimos converter o userRecord, criar um usuário básico
      if (!userRecord) {
        logger.error('userRecord não disponível, criando usuário básico', 'authFlowService');
        finalUser = {
          id: userId,
          nome: userData.nome || username,
          username: username,
          idade: userData.idade || 0,
          genero: userData.genero || 'Masculino',
          peso: userData.peso || 0,
          altura: userData.altura || 0,
          objetivo: (userData.objetivo || 'perder peso') as any,
          points: userData.points || 0,
          disciplineScore: userData.disciplineScore || 0,
          completedChallengeIds: userData.completedChallengeIds || [],
          isAnonymized: userData.isAnonymized || false,
          weightHistory: userData.weightHistory || [],
          role: userData.role || 'user',
          subscription: 'free',
          planType: (isCoupon ? (couponValidation.planLinked as any) : 'free') || 'free',
          subscriptionStatus: 'active',
        };
      } else {
        // Tentar converter mesmo com erro
        try {
          finalUser = supabaseToUser(userRecord);
        } catch (convertError) {
          logger.error('Erro ao converter userRecord, criando usuário básico', 'authFlowService', convertError);
          finalUser = {
            id: userId,
            nome: userData.nome || username,
            username: username,
            idade: userData.idade || 0,
            genero: userData.genero || 'Masculino',
            peso: userData.peso || 0,
            altura: userData.altura || 0,
            objetivo: (userData.objetivo || 'perder peso') as any,
            points: userData.points || 0,
            disciplineScore: userData.disciplineScore || 0,
            completedChallengeIds: userData.completedChallengeIds || [],
            isAnonymized: userData.isAnonymized || false,
            weightHistory: userData.weightHistory || [],
            role: userData.role || 'user',
            subscription: 'free',
          planType: (isCoupon ? (couponValidation.planLinked as any) : 'free') || 'free',
            subscriptionStatus: 'active',
          };
        }
      }
    }
    
    // Garantir que o usuário tem todos os campos obrigatórios
    if (!finalUser.id) {
      finalUser.id = userId;
    }
    if (!finalUser.username) {
      finalUser.username = username;
    }
    if (!finalUser.nome) {
      finalUser.nome = userData.nome || username;
    }

    // 6. Se NÃO for cupom (fluxo B2B / activation_code), ativar assinatura via código (empresa B2B ou código legado)
    if (!isCoupon) {
      const activationResult = await activateUserWithCode(finalUser.id, couponCode);
      if (!activationResult.success) {
        logger.warn('Erro ao ativar usuário com código de acesso', 'authFlowService', { error: activationResult.error });
        throw new Error(activationResult.error || 'Erro ao ativar código de acesso. Verifique se o código é válido e se a academia possui vagas disponíveis.');
      }
    }

    // 7. Retornar usuário
    logger.info(`Usuário retornado após registro: ${finalUser.username} (${finalUser.id})`, 'authFlowService');
    return {
      user: finalUser,
      couponId: isCoupon ? (couponValidation.couponId || '') : '',
    };
  },
};

/**
 * Serviço de autenticação
 */
export const authService = {
  /**
   * Obtém o perfil completo do usuário atual
   */
  async getCurrentUserProfile(): Promise<User | null> {
    const supabase = getSupabaseClient();

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        logger.warn('Usuário não autenticado ao buscar perfil', 'authService');
        return null;
      }

      const userProfile = await getUserFromSupabase(authUser.id);
      
      if (!userProfile) {
        logger.warn(`Perfil não encontrado para usuário autenticado: ${authUser.id}`, 'authService');
        // Pode ser que o perfil ainda não foi criado ou RLS está bloqueando
        // Tentar aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getUserFromSupabase(authUser.id);
      }
      
      return userProfile;
    } catch (error) {
      logger.error('Erro ao obter perfil do usuário', 'authService', error);
      return null;
    }
  },
};


/**
 * Serviço de integração com Supabase
 * Substitui o IndexedDB por Supabase para suporte a assinaturas e multi-tenancy
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '../types';
import { logger } from '../utils/logger';

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
          plan_type: 'free' | 'monthly' | 'annual' | 'academy_starter' | 'academy_growth' | 'personal_team' | null;
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
          // Email
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
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

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
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
    email: (user as any).email || null,
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
    // Primeiro tentar pelo email (mais confiável)
    if (userEmail) {
      const { data: userData, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (userData && !emailError) {
        targetUserId = userData.id;
        logger.info(`Usuário encontrado pelo email: ${userEmail}`, 'supabaseService');
      } else if (emailError) {
        logger.warn(`Erro ao buscar usuário por email: ${emailError.message}`, 'supabaseService');
      }
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
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, email')
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
    .eq('status', 'active')
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

  return data;
}

/**
 * Cancela uma assinatura
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const supabase = getSupabaseClient();

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


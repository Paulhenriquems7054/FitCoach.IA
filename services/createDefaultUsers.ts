/**
 * Serviço para criar usuários padrões no Supabase
 * Cria: Desenvolvedor/dev123 e Administrador/admin123
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import type { User } from '../types';

interface DefaultUser {
  nome: string;
  username: string;
  password: string;
  email: string;
  gymRole: 'admin';
  role: 'professional';
}

const DEFAULT_USERS: DefaultUser[] = [
  {
    nome: 'Desenvolvedor',
    username: 'dev123',
    password: 'dev123',
    email: 'dev123@fitcoach.ia',
    gymRole: 'admin',
    role: 'professional',
  },
  {
    nome: 'Administrador',
    username: 'admin123',
    password: 'admin123',
    email: 'admin123@fitcoach.ia',
    gymRole: 'admin',
    role: 'professional',
  },
];

/**
 * Cria um usuário padrão no Supabase
 */
async function createDefaultUser(userConfig: DefaultUser): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = getSupabaseClient();

  try {
    // 1. Verificar se o usuário já existe na tabela users pelo username
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', userConfig.username)
      .maybeSingle();

    if (existingProfile) {
      logger.info(`Usuário ${userConfig.username} já existe na tabela users (ID: ${existingProfile.id})`, 'createDefaultUsers');
      
      // Verificar se também existe no auth
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === existingProfile.id) {
          // Usuário completo já existe
          return { success: true, userId: existingProfile.id };
        }
      } catch (e) {
        // Não autenticado, mas o perfil existe - tentar criar no auth
      }

      // Se o perfil existe mas não tem auth, tentar criar no auth
      // Mas como não temos admin access, vamos apenas atualizar o perfil
      const updateResult = await createUserProfile(existingProfile.id, userConfig);
      return updateResult;
    }

    // 2. Criar usuário no auth (signUp)
    // Nota: Isso pode requerer confirmação de email dependendo das configurações do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userConfig.email,
      password: userConfig.password,
      options: {
        data: {
          nome: userConfig.nome,
          username: userConfig.username,
        },
        emailRedirectTo: undefined, // Não redirecionar
      },
    });

    if (authError) {
      // Se o erro for "User already registered", tentar buscar o usuário
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        // Tentar fazer login para obter o ID
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: userConfig.email,
          password: userConfig.password,
        });

        if (loginData?.user) {
          const userId = loginData.user.id;
          logger.info(`Usuário ${userConfig.username} já existe no auth, criando perfil (ID: ${userId})`, 'createDefaultUsers');
          const profileResult = await createUserProfile(userId, userConfig);
          return profileResult;
        }

        logger.error(`Erro ao fazer login para usuário existente ${userConfig.username}`, 'createDefaultUsers', loginError);
        return { success: false, error: `Usuário já existe mas não foi possível acessar: ${authError.message}` };
      }

      logger.error(`Erro ao criar usuário ${userConfig.username} no auth`, 'createDefaultUsers', authError);
      return { success: false, error: `Erro ao criar no auth: ${authError.message}` };
    }

    if (!authData.user) {
      return { success: false, error: 'Usuário não foi criado no auth' };
    }

    const userId = authData.user.id;
    logger.info(`Usuário ${userConfig.username} criado no auth (ID: ${userId})`, 'createDefaultUsers');

    // 3. Criar perfil na tabela users
    const profileResult = await createUserProfile(userId, userConfig);
    return profileResult;
  } catch (error: any) {
    logger.error(`Erro ao criar usuário padrão ${userConfig.username}`, 'createDefaultUsers', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Cria o perfil do usuário na tabela users
 */
async function createUserProfile(userId: string, userConfig: DefaultUser): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = getSupabaseClient();

  try {
    const userProfile: any = {
      id: userId,
      nome: userConfig.nome,
      username: userConfig.username,
      email: userConfig.email,
      idade: 30,
      genero: 'Masculino',
      peso: 0,
      altura: 0,
      objetivo: 'perder peso',
      points: 0,
      discipline_score: 0,
      completed_challenge_ids: [],
      is_anonymized: false,
      role: userConfig.role,
      gym_role: userConfig.gymRole,
      gym_id: null,
      is_gym_managed: false,
      plan_type: 'monthly', // Premium
      subscription_status: 'active',
      data_permissions: {
        allowWeightHistory: true,
        allowMealPlans: true,
        allowPhotoAnalysis: true,
        allowWorkoutData: true,
        allowChatHistory: true,
      },
      security_settings: {
        biometricEnabled: false,
        securityNotifications: true,
      },
      access_blocked: false,
      voice_daily_limit_seconds: 999999, // Praticamente ilimitado
      voice_used_today_seconds: 0,
      voice_balance_upsell: 0,
      text_msg_count_today: 0,
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userProfile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      logger.error(`Erro ao criar perfil do usuário ${userConfig.username}`, 'createDefaultUsers', error);
      return { success: false, error: `Erro ao criar perfil: ${error.message}` };
    }

    logger.info(`Perfil do usuário ${userConfig.username} criado/atualizado com sucesso (ID: ${userId})`, 'createDefaultUsers');
    return { success: true, userId };
  } catch (error: any) {
    logger.error(`Erro ao criar perfil do usuário ${userConfig.username}`, 'createDefaultUsers', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Cria todos os usuários padrões no Supabase
 */
export async function createAllDefaultUsers(): Promise<{ success: boolean; results: Array<{ user: string; success: boolean; error?: string }> }> {
  logger.info('Iniciando criação de usuários padrões no Supabase...', 'createDefaultUsers');

  const results: Array<{ user: string; success: boolean; error?: string }> = [];

  for (const userConfig of DEFAULT_USERS) {
    const result = await createDefaultUser(userConfig);
    results.push({
      user: userConfig.username,
      success: result.success,
      error: result.error,
    });

    // Pequeno delay entre criações para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const allSuccess = results.every(r => r.success);
  logger.info(
    `Criação de usuários padrões concluída. Sucesso: ${results.filter(r => r.success).length}/${results.length}`,
    'createDefaultUsers'
  );

  return { success: allSuccess, results };
}

/**
 * Função auxiliar para executar via console do navegador
 * Uso: No console do navegador, execute:
 *   import { createAllDefaultUsers } from './services/createDefaultUsers';
 *   await createAllDefaultUsers();
 */
export default createAllDefaultUsers;


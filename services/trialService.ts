import { getSupabaseClient, getActiveSubscription } from './supabaseService';
import { logger } from '../utils/logger';

/**
 * Inicia um período de teste Premium (trial) de 7 dias para o usuário.
 * - Cria um registro em `user_subscriptions` com status `trialing`
 * - Usa o plano mensal (`monthly`) como base para o trial
 * - Não inicia se já houver assinatura ativa ou trial em andamento
 */
export async function startTrialPeriod(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (!userId) {
    throw new Error('Usuário não autenticado. Faça login para iniciar o período de teste.');
  }

  // 1. Verificar se já existe assinatura ativa ou trial
  const existing = await getActiveSubscription(userId);
  if (existing) {
    throw new Error('Você já possui uma assinatura ativa ou um período de teste em andamento.');
  }

  // 2. Verificar se já teve trial anteriormente (opcional, aqui verificamos por status trialing/expired_trial)
  const { data: pastTrials, error: pastTrialsError } = await supabase
    .from('user_subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['trialing', 'expired_trial']);

  if (pastTrialsError) {
    logger.warn('Erro ao verificar trials anteriores', 'trialService', pastTrialsError);
  }
  if (pastTrials && pastTrials.length > 0) {
    throw new Error('Você já utilizou um período de teste anteriormente.');
  }

  // 3. Obter plano base para o trial (usamos o plano mensal `monthly`)
  const { data: monthlyPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, name')
    .eq('name', 'monthly')
    .maybeSingle();

  if (planError || !monthlyPlan) {
    logger.error('Plano mensal não encontrado para iniciar trial', 'trialService', planError);
    throw new Error('Não foi possível iniciar o período de teste. Tente novamente mais tarde.');
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  // 4. Criar assinatura em modo trial
  const { error: insertError } = await supabase.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: monthlyPlan.id,
    status: 'trialing',
    billing_cycle: 'trial',
    current_period_start: now.toISOString(),
    current_period_end: trialEnd.toISOString(),
    cancel_at_period_end: true,
  });

  if (insertError) {
    logger.error('Erro ao criar assinatura de trial', 'trialService', insertError);
    throw new Error('Não foi possível iniciar o período de teste. Tente novamente mais tarde.');
  }

  // Habilitar API para academia (mas usar chave global, não criar chave própria)
  try {
    const { autoSetupGymApiKey } = await import('./gymApiKeyService');
    await autoSetupGymApiKey(userId, 'trialing');
  } catch (apiKeyError) {
    // Não bloquear trial se falhar ao configurar API
    logger.warn('Erro ao configurar API para trial (não crítico)', 'trialService', apiKeyError);
  }

  logger.info(`Trial Premium iniciado para usuário ${userId} até ${trialEnd.toISOString()}`, 'trialService');
}

/**
 * Verifica se o usuário está em período de trial ativo.
 */
export async function checkTrialStatus(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (!userId) return false;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'trialing')
    .gt('current_period_end', now)
    .maybeSingle();

  if (error) {
    logger.warn('Erro ao verificar status de trial', 'trialService', error);
    return false;
  }

  return !!data;
}



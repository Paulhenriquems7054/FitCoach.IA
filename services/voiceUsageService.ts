/**
 * Serviço de controle de uso de minutos de voz
 * Conforme documentação de lógica de planos
 */

import { getSupabaseClient } from './supabaseService';

/**
 * Registra o uso de minutos de voz
 * Conforme documentação de lógica de planos
 */
export async function useVoiceMinutes(
  userId: string,
  minutesUsed: number
): Promise<{ success: boolean; remaining: number }> {
  const supabase = getSupabaseClient();

  // Buscar dados de uso do usuário (adaptado: usa tabela users ao invés de user_voice_usage)
  const { data: userData, error } = await supabase
    .from('users')
    .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Erro ao buscar uso de voz');
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastReset = userData.last_usage_date
    ? new Date(userData.last_usage_date).toISOString().split('T')[0]
    : today;

  // Reset diário se necessário
  if (lastReset !== today) {
    await supabase
      .from('users')
      .update({
        voice_used_today_seconds: 0,
        last_usage_date: today,
      })
      .eq('id', userId);
  }

  // Verificar Passe Livre (buscar em recargas ativas)
  const { data: activePassLibre } = await supabase
    .from('recharges')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('recharge_type', 'pass_libre')
    .eq('status', 'active')
    .gt('expires_at', now.toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activePassLibre?.expires_at) {
    const unlimitedUntil = new Date(activePassLibre.expires_at);
    if (unlimitedUntil > now) {
      // Ilimitado - não precisa verificar limite
      return { success: true, remaining: Infinity };
    }
  }

  // Verificar limite diário (15 min)
  const dailyLimit = 15;
  const dailyUsedSeconds = userData.voice_used_today_seconds || 0;
  const dailyUsed = Math.floor(dailyUsedSeconds / 60); // Converter segundos para minutos
  const dailyRemaining = dailyLimit - dailyUsed;

  if (dailyRemaining >= minutesUsed) {
    // Usa do limite diário
    const newDailyUsedSeconds = (dailyUsed + minutesUsed) * 60;
    await supabase
      .from('users')
      .update({
        voice_used_today_seconds: newDailyUsedSeconds,
      })
      .eq('id', userId);

    return {
      success: true,
      remaining: dailyRemaining - minutesUsed,
    };
  }

  // Tentar usar do banco de voz
  const bankAvailableSeconds = userData.voice_balance_upsell || 0;
  const bankAvailable = Math.floor(bankAvailableSeconds / 60); // Converter segundos para minutos
  const neededFromBank = minutesUsed - dailyRemaining;

  if (bankAvailable >= neededFromBank) {
    // Usa do banco
    const newBankBalanceSeconds = (bankAvailable - neededFromBank) * 60;
    const dailyLimitSeconds = userData.voice_daily_limit_seconds || 900; // 15 min = 900 segundos
    
    await supabase
      .from('users')
      .update({
        voice_used_today_seconds: dailyLimitSeconds, // Esgota limite diário
        voice_balance_upsell: newBankBalanceSeconds,
      })
      .eq('id', userId);

    return {
      success: true,
      remaining: bankAvailable - neededFromBank,
    };
  }

  // Não tem minutos suficientes
  return {
    success: false,
    remaining: dailyRemaining + bankAvailable,
  };
}

/**
 * Obtém os minutos de voz disponíveis
 */
export async function getAvailableVoiceMinutes(userId: string): Promise<{
  dailyRemaining: number;
  bankAvailable: number;
  isUnlimited: boolean;
  unlimitedUntil?: Date;
}> {
  try {
    const supabase = getSupabaseClient();

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
      .eq('id', userId)
      .single();

    if (!userData) {
      return {
        dailyRemaining: 0,
        bankAvailable: 0,
        isUnlimited: false,
      };
    }

    // Verificar reset diário
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastUsageDate = userData.last_usage_date
      ? new Date(userData.last_usage_date).toISOString().split('T')[0]
      : null;

    let dailyUsedSeconds = userData.voice_used_today_seconds || 0;
    if (lastUsageDate !== today) {
      dailyUsedSeconds = 0;
    }

    const dailyLimitSeconds = userData.voice_daily_limit_seconds || 900;
    const dailyRemainingSeconds = Math.max(0, dailyLimitSeconds - dailyUsedSeconds);
    const bankAvailableSeconds = userData.voice_balance_upsell || 0;

    // Verificar Passe Livre
    const { data: activePassLibre } = await supabase
      .from('recharges')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('recharge_type', 'pass_libre')
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const unlimitedUntil = activePassLibre?.expires_at
      ? new Date(activePassLibre.expires_at)
      : undefined;

    const isUnlimited = unlimitedUntil ? unlimitedUntil > now : false;

    return {
      dailyRemaining: Math.floor(dailyRemainingSeconds / 60),
      bankAvailable: Math.floor(bankAvailableSeconds / 60),
      isUnlimited,
      unlimitedUntil,
    };
  } catch (error) {
    return {
      dailyRemaining: 0,
      bankAvailable: 0,
      isUnlimited: false,
    };
  }
}


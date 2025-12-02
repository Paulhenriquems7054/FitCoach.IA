/**
 * Serviço para gerenciar limites de uso (voz e texto)
 * Monitora e controla o consumo de recursos do usuário
 */

import { getUser } from './databaseService';
import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import type { User } from '../types';

export interface VoiceUsageStatus {
    canUse: boolean;
    remainingDaily: number; // segundos restantes do limite diário (free)
    remainingBoost: number; // segundos restantes do boost (Ajuda Rápida)
    remainingReserve: number; // segundos restantes do banco de reserva
    totalRemaining: number; // total disponível (soma de todos)
    isUnlimited?: boolean;
    unlimitedUntil?: Date;
    error?: string;
}

export interface TextUsageStatus {
    canSend: boolean;
    countToday: number;
    limit: number;
    remaining: number;
    error?: string;
}

/**
 * Verifica se o usuário pode usar voz e retorna status
 */
export async function checkVoiceUsage(): Promise<VoiceUsageStatus> {
    try {
        const user = await getUser();
        if (!user) {
            return {
                canUse: false,
                remainingDaily: 0,
                remainingBoost: 0,
                remainingReserve: 0,
                totalRemaining: 0,
                error: 'Usuário não encontrado'
            };
        }

        // Buscar dados atualizados do Supabase
        const supabase = getSupabaseClient();
        const { data: userData, error } = await supabase
            .from('users')
            .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date, boost_minutes_balance, boost_expires_at')
            .eq('id', user.id || '')
            .single();

        const now = new Date();

        // Se não encontrar no Supabase, usar dados locais como fallback simples
        if (error || !userData) {
            const dailyLimit = user.voiceDailyLimitSeconds || 900;
            const usedToday = user.voiceUsedTodaySeconds || 0;
            const reserveBalance = user.voiceBalanceUpsell || 0;

            const remainingDaily = Math.max(0, dailyLimit - usedToday);
            const totalRemaining = remainingDaily + reserveBalance;

            return {
                canUse: totalRemaining > 0,
                remainingDaily,
                remainingBoost: 0,
                remainingReserve: reserveBalance,
                totalRemaining
            };
        }

        // Reset diário (free minutes) se necessário
        const today = now.toISOString().split('T')[0];
        const lastUsageDate = userData.last_usage_date ? new Date(userData.last_usage_date).toISOString().split('T')[0] : null;

        let usedToday = userData.voice_used_today_seconds || 0;
        if (lastUsageDate !== today) {
            usedToday = 0;
        }

        const dailyLimit = userData.voice_daily_limit_seconds || 900; // 15 min padrão
        const reserveBalance = userData.voice_balance_upsell || 0; // segundos

        // Boost (Ajuda Rápida) - do campo boost_minutes_balance
        let boostMinutes = userData.boost_minutes_balance || 0;
        const boostExpiresAt = userData.boost_expires_at ? new Date(userData.boost_expires_at) : null;

        if (boostExpiresAt && boostExpiresAt <= now) {
            // Boost expirado: considerar como 0
            boostMinutes = 0;
        }

        // Verificar recargas TURBO ativas na tabela recharges
        // Isso garante que recargas ativas sejam consideradas mesmo se ainda não aplicadas ao boost
        const { data: allTurboRecharges } = await supabase
            .from('recharges')
            .select('quantity, valid_until, expires_at')
            .eq('user_id', user.id || '')
            .eq('recharge_type', 'turbo')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // Filtrar recargas válidas (que não expiraram)
        if (allTurboRecharges && allTurboRecharges.length > 0) {
            for (const recharge of allTurboRecharges) {
                const validUntil = recharge.valid_until || recharge.expires_at;
                if (validUntil) {
                    const validDate = new Date(validUntil);
                    if (validDate > now) {
                        // Adicionar quantidade da recarga (em minutos) ao boost
                        const rechargeMinutes = recharge.quantity || 0;
                        boostMinutes += rechargeMinutes;
                    }
                }
            }
        }

        const remainingDaily = Math.max(0, dailyLimit - usedToday);
        const remainingBoost = boostMinutes * 60; // Converter minutos para segundos
        const remainingReserve = reserveBalance;

        // Verificar ilimitado (Passe Livre 30 dias)
        const { data: activePassLibre } = await supabase
            .from('recharges')
            .select('expires_at')
            .eq('user_id', user.id || '')
            .eq('recharge_type', 'pass_libre')
            .eq('status', 'active')
            .gt('expires_at', now.toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let isUnlimited = false;
        let unlimitedUntil: Date | undefined;
        if (activePassLibre?.expires_at) {
            const exp = new Date(activePassLibre.expires_at);
            if (exp > now) {
                isUnlimited = true;
                unlimitedUntil = exp;
            }
        }

        const totalRemaining = isUnlimited
            ? Number.MAX_SAFE_INTEGER
            : remainingDaily + remainingBoost + remainingReserve;

        return {
            canUse: totalRemaining > 0,
            remainingDaily,
            remainingBoost,
            remainingReserve,
            totalRemaining,
            isUnlimited,
            unlimitedUntil
        };
    } catch (error) {
        logger.error('Erro ao verificar uso de voz', 'usageLimitService', error);
        return {
            canUse: false,
            remainingDaily: 0,
            remainingBoost: 0,
            remainingReserve: 0,
            totalRemaining: 0,
            error: 'Erro ao verificar limites de uso'
        };
    }
}

/**
 * Consome segundos de voz (primeiro do limite diário, depois do upsell)
 */
export async function consumeVoiceSeconds(seconds: number): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();
        
        // Buscar dados atuais
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date, boost_minutes_balance, boost_expires_at')
            .eq('id', user.id)
            .single();

        if (fetchError || !userData) {
            return { success: false, error: 'Erro ao buscar dados do usuário' };
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastUsageDate = userData.last_usage_date ? new Date(userData.last_usage_date).toISOString().split('T')[0] : null;
        
        // Reset diário (free)
        let usedToday = userData.voice_used_today_seconds || 0;
        if (lastUsageDate !== today) {
            usedToday = 0;
        }

        const dailyLimit = userData.voice_daily_limit_seconds || 900; // 15 min
        let reserveBalance = userData.voice_balance_upsell || 0; // segundos

        // Boost (Ajuda Rápida) - do campo boost_minutes_balance
        let boostMinutes = userData.boost_minutes_balance || 0;
        let boostExpiresAt = userData.boost_expires_at ? new Date(userData.boost_expires_at) : null;

        if (boostExpiresAt && boostExpiresAt <= now) {
            // Boost expirado
            boostMinutes = 0;
            boostExpiresAt = null;
        }

        // Verificar recargas TURBO ativas na tabela recharges
        // Isso garante que recargas ativas sejam consideradas mesmo se ainda não aplicadas ao boost
        const { data: allTurboRecharges } = await supabase
            .from('recharges')
            .select('quantity, valid_until, expires_at')
            .eq('user_id', user.id)
            .eq('recharge_type', 'turbo')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // Filtrar recargas válidas (que não expiraram)
        if (allTurboRecharges && allTurboRecharges.length > 0) {
            for (const recharge of allTurboRecharges) {
                const validUntil = recharge.valid_until || recharge.expires_at;
                if (validUntil) {
                    const validDate = new Date(validUntil);
                    if (validDate > now) {
                        // Adicionar quantidade da recarga (em minutos) ao boost
                        const rechargeMinutes = recharge.quantity || 0;
                        boostMinutes += rechargeMinutes;
                    }
                }
            }
        }

        // 1) Verificar ilimitado (Passe Livre 30 dias)
        const { data: activePassLibre } = await supabase
            .from('recharges')
            .select('expires_at')
            .eq('user_id', user.id)
            .eq('recharge_type', 'pass_libre')
            .eq('status', 'active')
            .gt('expires_at', now.toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (activePassLibre?.expires_at && new Date(activePassLibre.expires_at) > now) {
            // Conversa ilimitada ativa: não desconta nenhum saldo
            return { success: true };
        }

        // 2) Consumo em cascata: diário -> boost -> reserva
        const remainingDaily = Math.max(0, dailyLimit - usedToday);
        let toConsume = seconds;
        let newUsedToday = usedToday;
        let newBoostMinutes = boostMinutes;
        let newBoostExpiresAt = boostExpiresAt;
        let newReserveBalance = reserveBalance;

        // 2.1 Free diário
        if (remainingDaily > 0) {
            const consumeFromDaily = Math.min(toConsume, remainingDaily);
            newUsedToday = usedToday + consumeFromDaily;
            toConsume -= consumeFromDaily;
        }

        // 2.2 Boost (Ajuda Rápida) - em minutos
        if (toConsume > 0 && boostMinutes > 0) {
            const boostSeconds = boostMinutes * 60;
            const consumeFromBoost = Math.min(toConsume, boostSeconds);
            const remainingBoostSeconds = boostSeconds - consumeFromBoost;
            newBoostMinutes = Math.floor(remainingBoostSeconds / 60);
            toConsume -= consumeFromBoost;

            // Se acabou o boost, limpar validade
            if (newBoostMinutes <= 0) {
                newBoostMinutes = 0;
                newBoostExpiresAt = null;
            }
        }

        // 2.3 Banco de Reserva
        if (toConsume > 0 && reserveBalance > 0) {
            const consumeFromReserve = Math.min(toConsume, reserveBalance);
            newReserveBalance = reserveBalance - consumeFromReserve;
            toConsume -= consumeFromReserve;
        }

        // Se ainda sobrou, não pode consumir
        if (toConsume > 0) {
            return { success: false, error: 'LIMIT_REACHED' };
        }

        // Atualizar no Supabase
        const updatePayload: Record<string, any> = {
            voice_used_today_seconds: newUsedToday,
            voice_balance_upsell: newReserveBalance,
            last_usage_date: today
        };

        updatePayload.boost_minutes_balance = newBoostMinutes;
        updatePayload.boost_expires_at = newBoostExpiresAt ? newBoostExpiresAt.toISOString() : null;

        const { error: updateError } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', user.id);

        if (updateError) {
            logger.error('Erro ao atualizar uso de voz', 'usageLimitService', updateError);
            return { success: false, error: 'Erro ao atualizar uso' };
        }

        return { success: true };
    } catch (error) {
        logger.error('Erro ao consumir segundos de voz', 'usageLimitService', error);
        return { success: false, error: 'Erro ao processar consumo' };
    }
}

/**
 * Verifica se o usuário pode enviar mensagens de texto
 */
export async function checkTextUsage(): Promise<TextUsageStatus> {
    try {
        const user = await getUser();
        if (!user) {
            return {
                canSend: false,
                countToday: 0,
                limit: 600,
                remaining: 0,
                error: 'Usuário não encontrado'
            };
        }

        // Resetar contador se necessário
        await resetDailyCountersIfNeeded(user);

        // Buscar dados atualizados do Supabase
        const supabase = getSupabaseClient();
        const { data: userData, error } = await supabase
            .from('users')
            .select('text_msg_count_today, last_msg_date')
            .eq('id', user.id || '')
            .single();

        const limit = 600; // Limite fixo de segurança
        let countToday = 0;

        if (!error && userData) {
            countToday = userData.text_msg_count_today || 0;
        } else {
            // Usar dados locais se não encontrar no Supabase
            countToday = user.textMsgCountToday || 0;
        }

        const remaining = Math.max(0, limit - countToday);

        return {
            canSend: countToday < limit,
            countToday,
            limit,
            remaining
        };
    } catch (error) {
        logger.error('Erro ao verificar uso de texto', 'usageLimitService', error);
        return {
            canSend: false,
            countToday: 0,
            limit: 600,
            remaining: 0,
            error: 'Erro ao verificar limites'
        };
    }
}

/**
 * Incrementa contador de mensagens de texto
 */
export async function incrementTextMessageCount(): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();
        const today = new Date().toISOString().split('T')[0];

        // Buscar dados atuais
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('text_msg_count_today, last_msg_date')
            .eq('id', user.id)
            .single();

        let countToday = 0;
        if (!fetchError && userData) {
            // Resetar se mudou o dia
            const lastMsgDate = userData.last_msg_date ? new Date(userData.last_msg_date).toISOString().split('T')[0] : null;
            if (lastMsgDate !== today) {
                countToday = 0;
            } else {
                countToday = userData.text_msg_count_today || 0;
            }
        }

        // Incrementar
        const { error: updateError } = await supabase
            .from('users')
            .update({
                text_msg_count_today: countToday + 1,
                last_msg_date: today
            })
            .eq('id', user.id);

        if (updateError) {
            logger.error('Erro ao incrementar contador de texto', 'usageLimitService', updateError);
            return { success: false, error: 'Erro ao atualizar contador' };
        }

        return { success: true };
    } catch (error) {
        logger.error('Erro ao incrementar contador de texto', 'usageLimitService', error);
        return { success: false, error: 'Erro ao processar' };
    }
}

/**
 * Reseta contadores diários se necessário
 */
async function resetDailyCountersIfNeeded(user: User): Promise<void> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const lastUsageDate = user.lastUsageDate ? new Date(user.lastUsageDate).toISOString().split('T')[0] : null;
        const lastMsgDate = user.lastMsgDate ? new Date(user.lastMsgDate).toISOString().split('T')[0] : null;

        const supabase = getSupabaseClient();
        const updates: any = {};

        // Resetar voz se necessário
        if (lastUsageDate !== today && user.id) {
            updates.voice_used_today_seconds = 0;
            updates.last_usage_date = today;
        }

        // Resetar texto se necessário
        if (lastMsgDate !== today && user.id) {
            updates.text_msg_count_today = 0;
            updates.last_msg_date = today;
        }

        if (Object.keys(updates).length > 0 && user.id) {
            await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);
        }
    } catch (error) {
        logger.warn('Erro ao resetar contadores', 'usageLimitService', error);
    }
}


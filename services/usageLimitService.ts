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
    remainingDaily: number; // segundos restantes do limite diário
    remainingUpsell: number; // segundos restantes do saldo comprado
    totalRemaining: number; // total disponível
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
                remainingUpsell: 0,
                totalRemaining: 0,
                error: 'Usuário não encontrado'
            };
        }

        // Resetar contador se necessário
        await resetDailyCountersIfNeeded(user);

        // Buscar dados atualizados do Supabase
        const supabase = getSupabaseClient();
        const { data: userData, error } = await supabase
            .from('users')
            .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
            .eq('id', user.id || '')
            .single();

        if (error || !userData) {
            // Se não encontrar no Supabase, usar dados locais
            const dailyLimit = user.voiceDailyLimitSeconds || 900;
            const usedToday = user.voiceUsedTodaySeconds || 0;
            const upsellBalance = user.voiceBalanceUpsell || 0;

            const remainingDaily = Math.max(0, dailyLimit - usedToday);
            const totalRemaining = remainingDaily + upsellBalance;

            return {
                canUse: totalRemaining > 0,
                remainingDaily,
                remainingUpsell: upsellBalance,
                totalRemaining
            };
        }

        const dailyLimit = userData.voice_daily_limit_seconds || 900;
        const usedToday = userData.voice_used_today_seconds || 0;
        const upsellBalance = userData.voice_balance_upsell || 0;

        const remainingDaily = Math.max(0, dailyLimit - usedToday);
        const totalRemaining = remainingDaily + upsellBalance;

        return {
            canUse: totalRemaining > 0,
            remainingDaily,
            remainingUpsell: upsellBalance,
            totalRemaining
        };
    } catch (error) {
        logger.error('Erro ao verificar uso de voz', 'usageLimitService', error);
        return {
            canUse: false,
            remainingDaily: 0,
            remainingUpsell: 0,
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
            .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
            .eq('id', user.id)
            .single();

        if (fetchError || !userData) {
            return { success: false, error: 'Erro ao buscar dados do usuário' };
        }

        // Resetar contador se necessário
        const today = new Date().toISOString().split('T')[0];
        const lastUsageDate = userData.last_usage_date ? new Date(userData.last_usage_date).toISOString().split('T')[0] : null;
        
        let usedToday = userData.voice_used_today_seconds || 0;
        let upsellBalance = userData.voice_balance_upsell || 0;
        const dailyLimit = userData.voice_daily_limit_seconds || 900;

        // Resetar se mudou o dia
        if (lastUsageDate !== today) {
            usedToday = 0;
        }

        // Calcular quanto pode consumir
        const remainingDaily = Math.max(0, dailyLimit - usedToday);
        let toConsume = seconds;
        let newUsedToday = usedToday;
        let newUpsellBalance = upsellBalance;

        // Primeiro consumir do limite diário
        if (remainingDaily > 0) {
            const consumeFromDaily = Math.min(toConsume, remainingDaily);
            newUsedToday = usedToday + consumeFromDaily;
            toConsume -= consumeFromDaily;
        }

        // Depois consumir do upsell
        if (toConsume > 0 && upsellBalance > 0) {
            const consumeFromUpsell = Math.min(toConsume, upsellBalance);
            newUpsellBalance = upsellBalance - consumeFromUpsell;
            toConsume -= consumeFromUpsell;
        }

        // Se ainda sobrar, não pode consumir
        if (toConsume > 0) {
            return { success: false, error: 'Limite insuficiente' };
        }

        // Atualizar no Supabase
        const { error: updateError } = await supabase
            .from('users')
            .update({
                voice_used_today_seconds: newUsedToday,
                voice_balance_upsell: newUpsellBalance,
                last_usage_date: today
            })
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


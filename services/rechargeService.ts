/**
 * Serviço de recargas e upgrades
 * Aplica recargas compradas (Turbo, Banco de Voz, Passe Livre)
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface Recharge {
  id: string;
  userId: string;
  type: 'turbo' | 'bank_100' | 'unlimited_30';
  caktoProductId: string;
  purchasedAt: Date;
  appliedAt?: Date;
  expiresAt?: Date;
  status: 'pending' | 'active' | 'used' | 'expired'; // Conforme tabela
}

/**
 * Aplica uma recarga pendente ao usuário
 * Conforme documentação de lógica de planos
 */
export async function applyRecharge(
  userId: string,
  rechargeType: 'turbo' | 'bank_100' | 'unlimited_30'
): Promise<void> {
  const supabase = getSupabaseClient();

  // Mapear tipos do documento para tipos da tabela
  const typeMap: Record<string, string> = {
    'turbo': 'turbo',
    'bank_100': 'voice_bank',
    'unlimited_30': 'pass_libre',
  };

  const tableType = typeMap[rechargeType] || rechargeType;

  // 1. Buscar recarga pendente
  const { data: recharge, error } = await supabase
    .from('recharges')
    .select('*')
    .eq('user_id', userId)
    .eq('recharge_type', tableType)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !recharge) {
    throw new Error('Recarga não encontrada');
  }

  const now = new Date();

  switch (rechargeType) {
    case 'turbo':
      // Ajuda Rápida: adiciona +20 minutos em boost com validade de 24h
      {
        const nowIso = now.toISOString();
        const { data: userData } = await supabase
          .from('users')
          .select('boost_minutes_balance, boost_expires_at')
          .eq('id', userId)
          .maybeSingle();

        let currentBoost = userData?.boost_minutes_balance || 0;
        let boostExpiresAt: Date | null = userData?.boost_expires_at ? new Date(userData.boost_expires_at) : null;

        // Se o boost atual já expirou, zera antes de adicionar
        if (boostExpiresAt && boostExpiresAt < now) {
          currentBoost = 0;
          boostExpiresAt = null;
        }

        const newBoostMinutes = currentBoost + 20; // +20 minutos de Ajuda Rápida
        const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        await supabase
          .from('users')
          .update({
            boost_minutes_balance: newBoostMinutes,
            boost_expires_at: newExpiresAt.toISOString(),
          })
          .eq('id', userId);
      }

      // Marca recarga como aplicada e expira em 24h
      await supabase
        .from('recharges')
        .update({
          status: 'active', // Tabela usa 'active' ao invés de 'applied'
          used_at: now.toISOString(),
          expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', recharge.id);
      break;

    case 'bank_100':
      // Adiciona 100 minutos ao banco de voz (não expira)
      const currentBank100 = await getCurrentVoiceBank(userId);
      const newBank100 = currentBank100 + 100;

      await supabase
        .from('users')
        .update({
          voice_balance_upsell: newBank100 * 60, // Converter para segundos
        })
        .eq('id', userId);

      await supabase
        .from('recharges')
        .update({
          status: 'active', // Tabela usa 'active' ao invés de 'applied'
          used_at: now.toISOString(),
        })
        .eq('id', recharge.id);
      break;

    case 'unlimited_30':
      // Remove limite diário por 30 dias
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Atualizar recarga para ativa
      await supabase
        .from('recharges')
        .update({
          status: 'active', // Tabela usa 'active' ao invés de 'applied'
          used_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', recharge.id);

      // Verificar se já existe outro Passe Livre ativo e desativar
      await supabase
        .from('recharges')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('recharge_type', 'pass_libre')
        .eq('status', 'active')
        .neq('id', recharge.id);
      break;
  }
}

/**
 * Obtém o saldo atual do banco de voz em minutos
 * Conforme documentação de lógica de planos
 */
async function getCurrentVoiceBank(userId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('users')
    .select('voice_balance_upsell')
    .eq('id', userId)
    .single();

  if (!data) {
    return 0;
  }

  // Converter segundos para minutos
  return Math.floor((data.voice_balance_upsell || 0) / 60);
}

/**
 * Processa recargas pendentes após confirmação de pagamento
 * Chamado pelo webhook da Cakto
 */
export async function processPendingRecharges(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Buscar todas as recargas pendentes com pagamento confirmado
    const { data: pendingRecharges, error } = await supabase
      .from('recharges')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Erro ao buscar recargas pendentes', 'rechargeService', error);
      return;
    }

    if (!pendingRecharges || pendingRecharges.length === 0) {
      return;
    }

    // Aplicar cada recarga
    for (const recharge of pendingRecharges) {
      try {
        // Mapear tipo da tabela para tipo do documento
        const typeMap: Record<string, 'turbo' | 'bank_100' | 'unlimited_30'> = {
          'turbo': 'turbo',
          'voice_bank': 'bank_100',
          'pass_libre': 'unlimited_30',
        };
        
        const docType = typeMap[recharge.recharge_type];
        if (!docType) {
          logger.warn(`Tipo de recarga desconhecido: ${recharge.recharge_type}`, 'rechargeService');
          continue;
        }
        
        await applyRecharge(userId, docType);
        logger.info(`Recarga ${recharge.id} processada com sucesso`, 'rechargeService');
      } catch (applyError) {
        logger.error(`Erro ao aplicar recarga ${recharge.id}`, 'rechargeService', applyError);
        // Continuar com as próximas recargas mesmo se uma falhar
      }
    }
  } catch (error) {
    logger.error('Erro ao processar recargas pendentes', 'rechargeService', error);
  }
}


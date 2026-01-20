/**
 * Serviço de Recargas FitVoice
 * Permite que alunos comprem minutos extras de voz além do limite mensal
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export type TipoRecarga = 'FitVoice20' | 'FitVoice60' | 'FitVoice120';

export interface Recarga {
  id: string;
  aluno_id: string;
  tipo_recarga: TipoRecarga;
  minutos_comprados: number;
  valor_pago: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  cakto_checkout_id?: string;
  cakto_transaction_id?: string;
  data_compra: string;
  data_confirmacao?: string;
  created_at: string;
  updated_at: string;
}

export interface RecargaDisponivel {
  tipo: TipoRecarga;
  nome: string;
  minutos: number;
  preco: number;
  descricao: string;
}

/**
 * Tipos de recarga disponíveis
 */
export const RECARGAS_DISPONIVEIS: RecargaDisponivel[] = [
  {
    tipo: 'FitVoice20',
    nome: 'FitVoice 20',
    minutos: 20,
    preco: 5.00,
    descricao: '20 minutos extras de voz'
  },
  {
    tipo: 'FitVoice60',
    nome: 'FitVoice 60',
    minutos: 60,
    preco: 12.90,
    descricao: '60 minutos extras de voz'
  },
  {
    tipo: 'FitVoice120',
    nome: 'FitVoice 120',
    minutos: 120,
    preco: 19.90,
    descricao: '120 minutos extras de voz'
  }
];

/**
 * Criar recarga pendente
 */
export async function criarRecarga(
  alunoId: string,
  tipoRecarga: TipoRecarga
): Promise<{ success: boolean; recargaId?: string; checkoutUrl?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Buscar detalhes da recarga
    const recargaInfo = RECARGAS_DISPONIVEIS.find(r => r.tipo === tipoRecarga);
    if (!recargaInfo) {
      return { success: false, error: 'Tipo de recarga inválido' };
    }

    // Inserir recarga pendente
    const { data, error } = await supabase
      .from('recargas')
      .insert({
        aluno_id: alunoId,
        tipo_recarga: tipoRecarga,
        minutos_comprados: recargaInfo.minutos,
        valor_pago: recargaInfo.preco,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar recarga', 'recargaService', error);
      return { success: false, error: 'Erro ao criar recarga' };
    }

    // TODO: Integrar com Cakto/Stripe para gerar checkout URL
    // Por enquanto, retornar apenas o ID da recarga
    // const checkoutUrl = await gerarCheckoutUrl(data.id, recargaInfo);
    
    return {
      success: true,
      recargaId: data.id,
      checkoutUrl: undefined // TODO: Implementar integração de pagamento
    };
  } catch (error) {
    logger.error('Erro fatal ao criar recarga', 'recargaService', error);
    return { success: false, error: 'Erro ao criar recarga' };
  }
}

/**
 * Processar recarga paga (chamado pelo webhook de pagamento)
 */
export async function processarRecargaPaga(
  recargaId: string,
  caktoTransactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Chamar função RPC do Supabase que processa a recarga
    const { error } = await supabase.rpc('processar_recarga_paga', {
      p_recarga_id: recargaId,
      p_cakto_transaction_id: caktoTransactionId
    });

    if (error) {
      logger.error('Erro ao processar recarga paga', 'recargaService', error);
      return { success: false, error: 'Erro ao processar recarga' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro fatal ao processar recarga paga', 'recargaService', error);
    return { success: false, error: 'Erro ao processar recarga' };
  }
}

/**
 * Listar recargas do aluno
 */
export async function listarRecargasAluno(
  alunoId: string,
  limit: number = 10
): Promise<Recarga[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('recargas')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_compra', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Erro ao listar recargas', 'recargaService', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Erro fatal ao listar recargas', 'recargaService', error);
    return [];
  }
}

/**
 * Obter saldo de voz extra do aluno
 */
export async function obterSaldoVozExtra(alunoId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('saldo_voz_extra')
      .eq('id', alunoId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.saldo_voz_extra || 0;
  } catch (error) {
    logger.error('Erro ao obter saldo de voz extra', 'recargaService', error);
    return 0;
  }
}

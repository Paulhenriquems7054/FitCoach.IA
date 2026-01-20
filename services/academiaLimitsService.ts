/**
 * Serviço de Verificação de Limites para Academias
 * Novo modelo: Academias pagam planos mensais com IA embutida
 * Cada aluno tem limites mensais controlados (texto, imagem, voz)
 * Voz além do limite → recarga paga (FitVoice)
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import type { User } from '../types';

export type TipoUso = 'texto' | 'imagem' | 'voz';

export interface LimiteVerificado {
  podeUsar: boolean;
  limiteAtual: number;
  usadoAtual: number;
  restante: number;
  mensagem: string;
}

export interface LimitesAcademia {
  limiteTexto: number;
  limiteImagem: number;
  limiteVoz: number;
  alunosMax: number;
}

export interface UsoAluno {
  usoTexto: number;
  usoImagem: number;
  usoVozMinutos: number;
  saldoVozExtra: number;
  interacoesDemoUsadas?: number;
  modoDemo?: boolean;
}

/**
 * Verifica se o aluno pode usar uma funcionalidade antes de fazer chamada IA
 * Retorna true se pode usar, false se excedeu limite
 */
export async function verificarLimiteAntesUso(
  userId: string,
  tipoUso: TipoUso,
  quantidade: number = 1
): Promise<LimiteVerificado> {
  try {
    const supabase = getSupabaseClient();

    // Chamar função RPC do Supabase que faz toda a verificação
    const { data, error } = await supabase.rpc('verificar_limite_antes_uso', {
      p_user_id: userId,
      p_tipo_uso: tipoUso,
      p_quantidade: quantidade
    });

    if (error) {
      logger.error('Erro ao verificar limite', 'academiaLimitsService', error);
      return {
        podeUsar: false,
        limiteAtual: 0,
        usadoAtual: 0,
        restante: 0,
        mensagem: 'Erro ao verificar limite. Tente novamente.'
      };
    }

    if (!data || data.length === 0) {
      return {
        podeUsar: false,
        limiteAtual: 0,
        usadoAtual: 0,
        restante: 0,
        mensagem: 'Dados de limite não encontrados.'
      };
    }

    const resultado = data[0];
    return {
      podeUsar: resultado.pode_usar,
      limiteAtual: resultado.limite_atual,
      usadoAtual: resultado.usado_atual,
      restante: resultado.restante,
      mensagem: resultado.mensagem || ''
    };
  } catch (error) {
    logger.error('Erro fatal ao verificar limite', 'academiaLimitsService', error);
    return {
      podeUsar: false,
      limiteAtual: 0,
      usadoAtual: 0,
      restante: 0,
      mensagem: 'Erro ao verificar limite. Tente novamente.'
    };
  }
}

/**
 * Consome uso após verificação (atualiza contadores)
 */
export async function consumirUso(
  userId: string,
  tipoUso: TipoUso,
  quantidade: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Verificar se pode usar ANTES de consumir
    const verificacao = await verificarLimiteAntesUso(userId, tipoUso, quantidade);
    
    if (!verificacao.podeUsar) {
      return {
        success: false,
        error: verificacao.mensagem || 'Limite excedido'
      };
    }

    // Atualizar contadores conforme tipo de uso
    const updates: any = {};
    
    switch (tipoUso) {
      case 'texto':
        updates.uso_texto = (verificacao.usadoAtual + quantidade);
        break;
      case 'imagem':
        updates.uso_imagem = (verificacao.usadoAtual + quantidade);
        break;
      case 'voz':
        // Para voz, verificar se usa do limite mensal ou saldo extra
        const alunoData = await obterUsoAluno(userId);
        if (!alunoData) {
          return { success: false, error: 'Dados do aluno não encontrados' };
        }

        const limiteVozMensal = await obterLimiteVozAcademia(userId);
        const usadoMensal = alunoData.usoVozMinutos;
        const saldoExtra = alunoData.saldoVozExtra || 0;

        // Primeiro usa do limite mensal, depois do saldo extra
        if (usadoMensal + quantidade <= limiteVozMensal) {
          // Usa do limite mensal
          updates.uso_voz_minutos = usadoMensal + quantidade;
        } else {
          // Esgota limite mensal e usa do saldo extra
          const usadoDoMensal = limiteVozMensal - usadoMensal;
          const usadoDoExtra = quantidade - usadoDoMensal;
          updates.uso_voz_minutos = limiteVozMensal;
          updates.saldo_voz_extra = Math.max(0, saldoExtra - usadoDoExtra);
        }
        break;
    }

    // Atualizar período de uso se necessário
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: userData } = await supabase
      .from('users')
      .select('periodo_uso_mes')
      .eq('id', userId)
      .single();

    if (!userData || userData.periodo_uso_mes !== currentMonth) {
      updates.periodo_uso_mes = currentMonth;
    }

    // Se está em modo demo, incrementar contador
    if (userData?.modo_demo && tipoUso !== 'voz') { // Demo não inclui voz
      updates.interacoes_demo_usadas = (userData.interacoes_demo_usadas || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      logger.error('Erro ao atualizar uso', 'academiaLimitsService', updateError);
      return { success: false, error: 'Erro ao atualizar uso' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro fatal ao consumir uso', 'academiaLimitsService', error);
    return { success: false, error: 'Erro ao consumir uso' };
  }
}

/**
 * Obtém uso atual do aluno
 */
export async function obterUsoAluno(userId: string): Promise<UsoAluno | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('uso_texto, uso_imagem, uso_voz_minutos, saldo_voz_extra, periodo_uso_mes, modo_demo, interacoes_demo_usadas')
      .eq('id', userId)
      .single();

    if (error || !data) {
      logger.warn('Erro ao buscar uso do aluno', 'academiaLimitsService', error);
      return null;
    }

    // Verificar se precisa resetar (mudou de mês)
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (data.periodo_uso_mes !== currentMonth) {
      // Resetar contadores
      await supabase
        .from('users')
        .update({
          uso_texto: 0,
          uso_imagem: 0,
          uso_voz_minutos: 0,
          periodo_uso_mes: currentMonth
        })
        .eq('id', userId);

      return {
        usoTexto: 0,
        usoImagem: 0,
        usoVozMinutos: 0,
        saldoVozExtra: data.saldo_voz_extra || 0,
        interacoesDemoUsadas: data.interacoes_demo_usadas || 0,
        modoDemo: data.modo_demo || false
      };
    }

    return {
      usoTexto: data.uso_texto || 0,
      usoImagem: data.uso_imagem || 0,
      usoVozMinutos: data.uso_voz_minutos || 0,
      saldoVozExtra: data.saldo_voz_extra || 0,
      interacoesDemoUsadas: data.interacoes_demo_usadas || 0,
      modoDemo: data.modo_demo || false
    };
  } catch (error) {
    logger.error('Erro fatal ao obter uso do aluno', 'academiaLimitsService', error);
    return null;
  }
}

/**
 * Obtém limites da academia do aluno
 */
export async function obterLimitesAcademia(userId: string): Promise<LimitesAcademia | null> {
  try {
    const supabase = getSupabaseClient();

    // Buscar academia do aluno
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('academias_id')
      .eq('id', userId)
      .single();

    if (userError || !userData || !userData.academias_id) {
      return null; // Aluno não vinculado a academia
    }

    // Buscar limites da academia
    const { data: academiaData, error: academiaError } = await supabase
      .from('companies')
      .select('limite_texto, limite_imagem, limite_voz, alunos_max, status')
      .eq('id', userData.academias_id)
      .single();

    if (academiaError || !academiaData) {
      logger.warn('Erro ao buscar limites da academia', 'academiaLimitsService', academiaError);
      return null;
    }

    // Verificar se academia está ativa
    if (academiaData.status && academiaData.status !== 'active') {
      return null; // Academia não está ativa
    }

    return {
      limiteTexto: academiaData.limite_texto || 1000,
      limiteImagem: academiaData.limite_imagem || 100,
      limiteVoz: academiaData.limite_voz || 450,
      alunosMax: academiaData.alunos_max || 50
    };
  } catch (error) {
    logger.error('Erro fatal ao obter limites da academia', 'academiaLimitsService', error);
    return null;
  }
}

/**
 * Obtém apenas limite de voz da academia (otimizado)
 */
async function obterLimiteVozAcademia(userId: string): Promise<number> {
  const limites = await obterLimitesAcademia(userId);
  return limites?.limiteVoz || 450; // Default: 15 min/dia * 30 dias
}

/**
 * Verifica se o aluno pertence a uma academia ativa
 */
export async function alunoPertenceAcademiaAtiva(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select(`
        academias_id,
        companies!inner(status)
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    // Verificar se academia está ativa
    const empresa = (data as any).companies;
    return empresa?.status === 'active';
  } catch (error) {
    logger.error('Erro ao verificar academia ativa', 'academiaLimitsService', error);
    return false;
  }
}

/**
 * Ativa modo demo para novo usuário não vinculado
 */
export async function ativarModoDemo(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('users')
      .update({
        modo_demo: true,
        interacoes_demo_usadas: 0
      })
      .eq('id', userId);

    if (error) {
      logger.error('Erro ao ativar modo demo', 'academiaLimitsService', error);
      return { success: false, error: 'Erro ao ativar modo demo' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro fatal ao ativar modo demo', 'academiaLimitsService', error);
    return { success: false, error: 'Erro ao ativar modo demo' };
  }
}

/**
 * Verifica se o teste SEM IA expirou (3 dias)
 * Retorna true se expirou, false se ainda está ativo
 */
export async function verificarTesteSemIAExpirado(userId: string): Promise<{ expirado: boolean; diasRestantes?: number }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('teste_sem_ia_inicio')
      .eq('id', userId)
      .single();

    if (error || !data || !data.teste_sem_ia_inicio) {
      // Se não tem data de início, não está em teste SEM IA
      return { expirado: false };
    }

    const dataInicio = new Date(data.teste_sem_ia_inicio);
    const agora = new Date();
    const diasPassados = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.max(0, 3 - diasPassados);

    return {
      expirado: diasPassados >= 3,
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0
    };
  } catch (error) {
    logger.error('Erro ao verificar teste SEM IA', 'academiaLimitsService', error);
    return { expirado: false };
  }
}

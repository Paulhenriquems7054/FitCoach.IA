/**
 * Serviço de Acesso à IA - Novo Modelo
 * Substitui lógica de trial por verificação de limites de academia + modo demo
 * 
 * NOVO MODELO:
 * - Academias pagam planos mensais com IA embutida (texto, imagem, voz)
 * - Cada aluno tem limites mensais controlados
 * - Voz além do limite → recarga paga (FitVoice)
 * - Novos usuários não vinculados → 3 interações grátis (modo_demo)
 */

import type { User } from '../types';
import { logger } from '../utils/logger';
import { isDeveloper } from '../utils/developerUtils';
import {
  verificarLimiteAntesUso,
  alunoPertenceAcademiaAtiva,
  obterUsoAluno,
  obterLimitesAcademia,
  ativarModoDemo,
  type TipoUso
} from './academiaLimitsService';
import { getSupabaseClient } from './supabaseService';

export type AiAccessReason = 'academia' | 'demo' | 'demo_expirado' | 'limite_excedido' | 'none';

export interface AiAccessStatus {
  hasAccess: boolean;
  reason: AiAccessReason;
  remaining?: number;
  limit?: number;
  message?: string;
}

/**
 * Verifica acesso à IA para uma funcionalidade específica
 */
export async function getNovoAiAccessStatus(
  user: User,
  feature: 'chat' | 'voice' | 'vision' | 'plan'
): Promise<AiAccessStatus> {
  if (!user || !user.id) {
    return {
      hasAccess: false,
      reason: 'none',
      message: 'Usuário não autenticado'
    };
  }

  // Desenvolvedor sempre tem acesso total
  if (isDeveloper(user)) {
    return {
      hasAccess: true,
      reason: 'academia',
      remaining: Infinity,
      limit: Infinity
    };
  }

  try {
    // Mapear feature para tipo de uso
    let tipoUso: TipoUso;
    switch (feature) {
      case 'chat':
        tipoUso = 'texto';
        break;
      case 'vision':
        tipoUso = 'imagem';
        break;
      case 'voice':
        tipoUso = 'voz';
        break;
      case 'plan':
        // Para geração de planos, usar texto
        tipoUso = 'texto';
        break;
      default:
        return {
          hasAccess: false,
          reason: 'none',
          message: 'Funcionalidade inválida'
        };
    }

    // Verificar limite antes do uso
    const verificacao = await verificarLimiteAntesUso(user.id as string, tipoUso, 1);

    if (verificacao.podeUsar) {
      // Determinar motivo do acesso
      let reason: AiAccessReason = 'academia';
      
      // Verificar se está em modo demo
      const usoAluno = await obterUsoAluno(user.id as string);
      if (usoAluno?.modoDemo && tipoUso !== 'voz') {
        reason = 'demo';
      }

      return {
        hasAccess: true,
        reason,
        remaining: verificacao.restante,
        limit: verificacao.limiteAtual,
        message: verificacao.mensagem || ''
      };
    } else {
      // Não pode usar - verificar motivo
      const usoAluno = await obterUsoAluno(user.id as string);
      
      if (usoAluno?.modoDemo && tipoUso !== 'voz') {
        // Modo demo esgotado
        return {
          hasAccess: false,
          reason: 'demo_expirado',
          remaining: 0,
          limit: 3,
          message: 'Você atingiu o limite da sua conta. Adquira recarga FitVoice ou vincule-se a uma academia.'
        };
      } else {
        // Limite excedido
        return {
          hasAccess: false,
          reason: 'limite_excedido',
          remaining: verificacao.restante,
          limit: verificacao.limiteAtual,
          message: verificacao.mensagem || 'Você atingiu o limite da sua conta. Adquira recarga FitVoice.'
        };
      }
    }
  } catch (error) {
    logger.error('Erro ao verificar acesso à IA', 'novoAiAccessService', error);
    return {
      hasAccess: false,
      reason: 'none',
      message: 'Erro ao verificar acesso. Tente novamente.'
    };
  }
}

/**
 * Garante que o usuário pode usar IA (lança erro se não puder)
 */
export async function assertNovoAiAccessOrThrow(
  user: User,
  feature: 'chat' | 'voice' | 'vision' | 'plan'
): Promise<void> {
  // Desenvolvedor sempre tem acesso
  if (isDeveloper(user)) {
    return;
  }

  const status = await getNovoAiAccessStatus(user, feature);
  
  if (!status.hasAccess) {
    const error: any = new Error('AI_ACCESS_DENIED');
    error.code = 'AI_ACCESS_DENIED';
    error.reason = status.reason;
    error.feature = feature;
    error.message = status.message || 'Acesso à IA negado';
    error.remaining = status.remaining;
    error.limit = status.limit;
    throw error;
  }
}

/**
 * Verifica se novo usuário deve receber modo demo
 * Condição: Não vinculado a academia E nunca teve acesso
 */
export async function deveAtivarModoDemo(user: User): Promise<boolean> {
  if (!user || !user.id) {
    return false;
  }

  // Verificar se está vinculado a academia
  const pertenceAcademia = await alunoPertenceAcademiaAtiva(user.id as string);
  if (pertenceAcademia) {
    return false; // Já está vinculado, não precisa de demo
  }

  // Verificar se já usou demo ou tem alguma assinatura
  const usoAluno = await obterUsoAluno(user.id as string);
  
  if (!usoAluno?.modoDemo && (usoAluno?.interacoesDemoUsadas || 0) === 0) {
    // Novo usuário não vinculado - ativar demo
    await ativarModoDemo(user.id as string);
    return true;
  }

  return false;
}

/**
 * Obtém informações de uso do aluno para exibição no frontend
 */
export async function obterInfoUsoAluno(userId: string): Promise<{
  texto: { usado: number; limite: number; restante: number };
  imagem: { usado: number; limite: number; restante: number };
  voz: { usado: number; limite: number; saldoExtra: number; restante: number };
  modoDemo?: { usado: number; limite: number; restante: number };
} | null> {
  try {
    const uso = await obterUsoAluno(userId);
    if (!uso) {
      return null;
    }

    const limites = await obterLimitesAcademia(userId);

    // Se não tem limites (não vinculado), usar valores padrão
    const limiteTexto = limites?.limiteTexto || 0;
    const limiteImagem = limites?.limiteImagem || 0;
    const limiteVoz = limites?.limiteVoz || 0;

    return {
      texto: {
        usado: uso.usoTexto,
        limite: limiteTexto,
        restante: Math.max(0, limiteTexto - uso.usoTexto)
      },
      imagem: {
        usado: uso.usoImagem,
        limite: limiteImagem,
        restante: Math.max(0, limiteImagem - uso.usoImagem)
      },
      voz: {
        usado: uso.usoVozMinutos,
        limite: limiteVoz,
        saldoExtra: uso.saldoVozExtra,
        restante: Math.max(0, limiteVoz + uso.saldoVozExtra - uso.usoVozMinutos)
      },
      ...(uso.modoDemo && {
        modoDemo: {
          usado: uso.interacoesDemoUsadas || 0,
          limite: 3,
          restante: Math.max(0, 3 - (uso.interacoesDemoUsadas || 0))
        }
      })
    };
  } catch (error) {
    logger.error('Erro ao obter info de uso', 'novoAiAccessService', error);
    return null;
  }
}

/**
 * Consome uso após chamada bem-sucedida à IA
 */
export async function consumirUsoAposChamada(
  userId: string,
  feature: 'chat' | 'voice' | 'vision' | 'plan',
  quantidade: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mapear feature para tipo de uso
    let tipoUso: TipoUso;
    switch (feature) {
      case 'chat':
      case 'plan':
        tipoUso = 'texto';
        break;
      case 'vision':
        tipoUso = 'imagem';
        break;
      case 'voice':
        tipoUso = 'voz';
        quantidade = Math.ceil(quantidade / 60); // Converter segundos para minutos
        break;
      default:
        return { success: false, error: 'Feature inválida' };
    }

    // Importar e usar serviço de limites
    const { consumirUso } = await import('./academiaLimitsService');
    return await consumirUso(userId, tipoUso, quantidade);
  } catch (error) {
    logger.error('Erro ao consumir uso', 'novoAiAccessService', error);
    return { success: false, error: 'Erro ao consumir uso' };
  }
}

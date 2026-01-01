import { getSupabaseClient } from './supabaseService';

export interface AiUsageDayFeature {
  date: string; // YYYY-MM-DD
  feature: string;
  calls: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface AiUsageSummary {
  byDay: AiUsageDayFeature[];
  totals: {
    calls: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
  };
  month: {
    yearMonth: string;
    totalCostUsd: number;
    hardLimitUsd: number | null;
  } | null;
}

const AI_BACKEND_BASE =
  import.meta.env.VITE_AI_BACKEND_URL || '/api';

/**
 * Busca resumo de uso de IA
 * 
 * IMPORTANTE: Esta função é opcional e tolerante a falhas.
 * Se o endpoint não estiver disponível (404), retorna dados vazios.
 * Não deve quebrar o dashboard ou outras funcionalidades.
 */
export async function fetchAiUsageSummary(
  gymId: string | null | undefined,
  from?: string,
  to?: string,
): Promise<AiUsageSummary> {
  try {
    const params = new URLSearchParams();
    if (gymId) params.set('gymId', gymId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const url = `${AI_BACKEND_BASE}/ai/usage${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const res = await fetch(url, {
      method: 'GET',
    });

    // Tratar especificamente erro 404 (endpoint não configurado)
    if (res.status === 404) {
      if (import.meta.env.DEV) {
        console.warn('[AI_USAGE] Endpoint /ai/usage não configurado (404). Retornando dados vazios.');
      }
      // Retornar estrutura vazia ao invés de lançar erro
      return {
        byDay: [],
        totals: {
          calls: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        },
        month: null,
      };
    }

    // Tratar especificamente erro 503 (Service Unavailable - backend não disponível)
    if (res.status === 503) {
      if (import.meta.env.DEV) {
        console.warn('[AI_USAGE] Backend de uso de IA não disponível (503). Retornando dados vazios. Isso é esperado se o backend não estiver em execução.');
      }
      // Retornar estrutura vazia - funcionalidade opcional
      return {
        byDay: [],
        totals: {
          calls: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        },
        month: null,
      };
    }

    if (!res.ok) {
      // Outros erros: logar mas retornar dados vazios
      const text = await res.text().catch(() => 'Erro desconhecido');
      if (import.meta.env.DEV) {
        console.warn(`[AI_USAGE] Erro ao buscar uso de IA: ${res.status} ${res.statusText} - ${text}`);
      }
      return {
        byDay: [],
        totals: {
          calls: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        },
        month: null,
      };
    }

    // Verificar Content-Type antes de fazer parse JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Resposta não é JSON (provavelmente HTML de erro)
      if (import.meta.env.DEV) {
        console.warn('[AI_USAGE] Resposta não é JSON. Content-Type:', contentType);
      }
      return {
        byDay: [],
        totals: {
          calls: 0,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        },
        month: null,
      };
    }

    return (await res.json()) as AiUsageSummary;
  } catch (error: any) {
    // Qualquer erro de rede, parsing, etc: retornar dados vazios
    if (import.meta.env.DEV) {
      console.warn('[AI_USAGE] Erro ao buscar uso de IA:', error);
    }
    return {
      byDay: [],
      totals: {
        calls: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
      },
      month: null,
    };
  }
}



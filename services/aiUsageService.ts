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

    // Usar fetch com tratamento silencioso de erros
    // O erro 503 é esperado quando o backend não está rodando
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        // Não lançar erro para 503 - é esperado quando backend não está rodando
        signal: AbortSignal.timeout(5000), // Timeout de 5s
      });
    } catch (error: any) {
      // Se for erro de rede ou timeout, retornar dados vazios silenciosamente
      // Não logar nada - o middleware do Vite já intercepta em desenvolvimento
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

    // Tratar especificamente erro 404 (endpoint não configurado)
    if (res.status === 404) {
      // Retornar estrutura vazia ao invés de lançar erro
      // Não logar nada - funcionalidade opcional
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
    // Este erro é ESPERADO e NORMAL quando o backend não está rodando
    if (res.status === 503) {
      // Não logar nada - o middleware do Vite já intercepta em desenvolvimento
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
      // Outros erros: retornar dados vazios silenciosamente
      // Não logar - funcionalidade opcional que não deve quebrar a aplicação
      await res.text().catch(() => ''); // Consumir resposta para evitar warning
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
      // Retornar dados vazios silenciosamente
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
    // Qualquer erro de rede, parsing, etc: retornar dados vazios silenciosamente
    // Não logar - funcionalidade opcional que não deve quebrar a aplicação
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



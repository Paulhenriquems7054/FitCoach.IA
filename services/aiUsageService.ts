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

export async function fetchAiUsageSummary(
  gymId: string | null | undefined,
  from?: string,
  to?: string,
): Promise<AiUsageSummary> {
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Erro ao buscar uso de IA: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  return (await res.json()) as AiUsageSummary;
}



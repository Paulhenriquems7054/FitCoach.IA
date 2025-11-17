export type ApiMode = 'paid' | 'free';

export interface ApiConfig {
  mode: ApiMode;
  paidKey: string;
  freeKey: string;
  providerLink: string;
}

export const API_MODE_STORAGE_KEY = 'nutria.api.mode';
export const PAID_API_KEY_STORAGE_KEY = 'nutria.api.paidKey';
export const FREE_API_KEY_STORAGE_KEY = 'nutria.api.freeKey';
export const PROVIDER_LINK_STORAGE_KEY = 'nutria.api.providerLink';

export const DEFAULT_FREE_API_KEY = 'AIzaSyAt_NhK5SrefQmIUC3iaELCKvD93xlTG8s';
export const DEFAULT_PROVIDER_LINK = 'https://ai.google.dev/';

const DEFAULT_CONFIG: ApiConfig = {
  mode: 'free',
  paidKey: '',
  freeKey: DEFAULT_FREE_API_KEY,
  providerLink: DEFAULT_PROVIDER_LINK,
};

function readLocalStorage(key: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

/**
 * Carrega configuração de API do banco de dados (com fallback para localStorage)
 */
export async function getStoredApiConfig(): Promise<ApiConfig> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CONFIG };
  }

  try {
    // Tentar carregar do banco de dados
    const { getAppSetting } = await import('../services/databaseService');
    const mode = (await getAppSetting<ApiMode>(API_MODE_STORAGE_KEY)) || readLocalStorage(API_MODE_STORAGE_KEY) as ApiMode;
    const paidKey = (await getAppSetting<string>(PAID_API_KEY_STORAGE_KEY)) || readLocalStorage(PAID_API_KEY_STORAGE_KEY);
    const freeKey = (await getAppSetting<string>(FREE_API_KEY_STORAGE_KEY)) || readLocalStorage(FREE_API_KEY_STORAGE_KEY);
    const providerLink = (await getAppSetting<string>(PROVIDER_LINK_STORAGE_KEY)) || readLocalStorage(PROVIDER_LINK_STORAGE_KEY);

    return {
      mode: mode === 'paid' || mode === 'free' ? mode : DEFAULT_CONFIG.mode,
      paidKey: paidKey.trim() || DEFAULT_CONFIG.paidKey,
      freeKey: freeKey.trim() || DEFAULT_CONFIG.freeKey,
      providerLink: providerLink.trim() || DEFAULT_CONFIG.providerLink,
    };
  } catch (error) {
    // Fallback para localStorage se o banco não estiver disponível
    const mode = readLocalStorage(API_MODE_STORAGE_KEY) as ApiMode;
    const paidKey = readLocalStorage(PAID_API_KEY_STORAGE_KEY).trim();
    const freeKey = readLocalStorage(FREE_API_KEY_STORAGE_KEY).trim();
    const providerLink = readLocalStorage(PROVIDER_LINK_STORAGE_KEY).trim();

    return {
      mode: mode === 'paid' || mode === 'free' ? mode : DEFAULT_CONFIG.mode,
      paidKey,
      freeKey: freeKey || DEFAULT_CONFIG.freeKey,
      providerLink: providerLink || DEFAULT_CONFIG.providerLink,
    };
  }
}

export function resolveActiveApiKey(envApiKey?: string | null): string | undefined {
  if (typeof window === 'undefined') {
    return envApiKey ?? DEFAULT_CONFIG.freeKey;
  }

  const config = getStoredApiConfig();
  const fallback = envApiKey?.trim() || config.freeKey || DEFAULT_CONFIG.freeKey;

  if (config.mode === 'paid' && config.paidKey) {
    return config.paidKey;
  }

  if (config.mode === 'free' && config.freeKey) {
    return config.freeKey;
  }

  if (config.paidKey) {
    return config.paidKey;
  }

  if (config.freeKey) {
    return config.freeKey;
  }

  return fallback;
}


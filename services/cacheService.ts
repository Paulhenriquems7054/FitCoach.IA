/**
 * Serviço de cache com TTL (Time To Live)
 */

import { logger } from '../utils/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const CACHE_PREFIX = 'nutria_cache_';

/**
 * Salva dados no cache com TTL
 */
export const setCache = <T>(key: string, data: T, ttl: number = 3600000): void => {
  // TTL padrão: 1 hora (3600000ms)
  if (typeof window === 'undefined') return;

  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    // Se localStorage estiver cheio, limpar caches antigos
    logger.warn('Erro ao salvar no cache, tentando limpar caches antigos', 'cacheService', error);
    clearExpiredCaches();
    
    // Tentar novamente
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (retryError) {
      logger.error('Erro ao salvar no cache após limpeza', 'cacheService', retryError);
    }
  }
};

/**
 * Obtém dados do cache se ainda válidos
 */
export const getCache = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!itemStr) return null;

    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = Date.now();

    // Verificar se expirou
    if (now - item.timestamp > item.ttl) {
      // Remover item expirado
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return item.data;
  } catch (error) {
    logger.error('Erro ao ler do cache', 'cacheService', error);
    return null;
  }
};

/**
 * Remove um item específico do cache
 */
export const removeCache = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
};

/**
 * Limpa todos os caches expirados
 */
export const clearExpiredCaches = (): void => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item: CacheItem<unknown> = JSON.parse(itemStr);
            if (now - item.timestamp > item.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Se não conseguir parsear, remover
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    logger.error('Erro ao limpar caches expirados', 'cacheService', error);
  }
};

/**
 * Limpa todos os caches (expira ou não)
 */
export const clearAllCaches = (): void => {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    logger.error('Erro ao limpar todos os caches', 'cacheService', error);
  }
};

/**
 * Verifica se um item existe no cache e está válido
 */
export const hasCache = (key: string): boolean => {
  return getCache(key) !== null;
};

// Limpar caches expirados ao carregar o módulo
if (typeof window !== 'undefined') {
  clearExpiredCaches();
  
  // Limpar caches expirados a cada hora
  setInterval(() => {
    clearExpiredCaches();
  }, 3600000); // 1 hora
}


/**
 * Serviço de Performance e Otimização
 * Code splitting, lazy loading, virtualização, Service Worker
 */

import { logger } from '../utils/logger';

class PerformanceService {
  /**
   * Inicializa Service Worker para cache e offline
   */
  async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        logger.info('Service Worker registrado', 'performanceService', registration);
      } catch (error) {
        logger.warn('Erro ao registrar Service Worker', 'performanceService', error);
      }
    }
  }

  /**
   * Preload de recursos críticos
   */
  preloadCriticalResources(): void {
    const criticalResources = [
      '/fonts/inter.woff2',
      '/images/logo.svg',
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.woff2') ? 'font' : 'image';
      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load de imagens
   */
  setupImageLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Otimiza imagens para WebP/AVIF
   */
  async optimizeImage(imageUrl: string, format: 'webp' | 'avif' = 'webp'): Promise<string> {
    // Em produção, usar API de otimização de imagens
    // Por enquanto, retornar URL original
    return imageUrl;
  }

  /**
   * Debounce para funções
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle para funções
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoização de funções
   */
  memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map<string, ReturnType<T>>();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Limpa cache antigo
   */
  async clearOldCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.includes('old-') || name.includes('v1-')
        );
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        logger.info('Cache antigo limpo', 'performanceService');
      } catch (error) {
        logger.warn('Erro ao limpar cache', 'performanceService', error);
      }
    }
  }

  /**
   * Mede performance de componentes
   */
  measurePerformance(name: string, fn: () => void): void {
    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      performance.mark(`${name}-start`);
      fn();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      logger.info(`Performance ${name}: ${measure.duration.toFixed(2)}ms`, 'performanceService');
    } else {
      fn();
    }
  }

  /**
   * Prefetch de rotas
   */
  prefetchRoute(route: string): void {
    // Em produção, usar React.lazy com prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }

  /**
   * Compressão de dados
   */
  compressData(data: any): string {
    // Em produção, usar biblioteca de compressão
    return JSON.stringify(data);
  }

  /**
   * Descompressão de dados
   */
  decompressData(compressed: string): any {
    return JSON.parse(compressed);
  }
}

// Instância singleton
export const performanceService = new PerformanceService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  performanceService.preloadCriticalResources();
  performanceService.setupImageLazyLoading();
  performanceService.initializeServiceWorker().catch(error => {
    logger.error('Erro ao inicializar Service Worker', 'performanceService', error);
  });
}


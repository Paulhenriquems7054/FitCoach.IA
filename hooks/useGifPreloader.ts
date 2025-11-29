import { useEffect, useState } from 'react';

/**
 * Hook para precarregar GIFs de exercícios
 * Precarrega os GIFs em background para melhorar a performance quando o usuário clicar em "Ver GIF"
 */
export function useGifPreloader(gifPaths: (string | null)[]): {
  preloadedGifs: Set<string>;
  isPreloading: boolean;
} {
  const [preloadedGifs, setPreloadedGifs] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    const validPaths = gifPaths.filter((path): path is string => path !== null);
    
    if (validPaths.length === 0) {
      return;
    }

    setIsPreloading(true);

    // Precarregar GIFs em paralelo, mas com limite de concorrência
    const preloadGif = (path: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          setPreloadedGifs((prev) => new Set([...prev, path]));
          resolve();
        };
        
        img.onerror = () => {
          // Ignorar erros silenciosamente - o GIF será carregado novamente quando necessário
          resolve();
        };
        
        // Iniciar carregamento
        img.src = path;
      });
    };

    // Precarregar até 3 GIFs por vez para não sobrecarregar
    const preloadBatch = async () => {
      const batchSize = 3;
      for (let i = 0; i < validPaths.length; i += batchSize) {
        const batch = validPaths.slice(i, i + batchSize);
        await Promise.all(batch.map(preloadGif));
        
        // Pequeno delay entre batches para não bloquear a UI
        if (i + batchSize < validPaths.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      setIsPreloading(false);
    };

    preloadBatch();
  }, [gifPaths.join(',')]); // Re-executar apenas se os paths mudarem

  return { preloadedGifs, isPreloading };
}


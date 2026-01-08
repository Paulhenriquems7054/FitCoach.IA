/**
 * Serviço para gerenciar URLs de GIFs com suporte a fallback para CDN externo
 * 
 * Este serviço resolve o problema de limite de tamanho do Vercel (1.4 GB de GIFs)
 * tentando primeiro carregar do servidor local/Vercel, e se falhar, usando um CDN externo.
 */

/**
 * Obtém a URL base do CDN de GIFs a partir das variáveis de ambiente
 * @returns URL base do CDN ou null se não configurado
 */
export function getGifCdnBaseUrl(): string | null {
  // Verificar variável de ambiente para URL do CDN
  const cdnUrl = import.meta.env.VITE_GIF_CDN_URL;
  
  if (cdnUrl && typeof cdnUrl === 'string' && cdnUrl.trim() !== '') {
    // Garantir que a URL termina com / mas não começa com /
    const normalizedUrl = cdnUrl.trim().replace(/\/+$/, '');
    return normalizedUrl;
  }
  
  return null;
}

/**
 * Constrói a URL completa para um GIF, tentando primeiro o caminho local
 * e depois o CDN externo se configurado
 * 
 * @param localPath - Caminho local do GIF (ex: /GIFS/Abdomen/Abdominais.gif)
 * @returns Objeto com URLs para tentar (local e CDN se disponível)
 */
export function getGifUrls(localPath: string): {
  local: string;
  cdn: string | null;
  primary: string; // URL principal para tentar primeiro
} {
  // Garantir que o caminho local começa com /
  const normalizedLocalPath = localPath.startsWith('/') ? localPath : `/${localPath}`;
  
  // Obter URL base do CDN
  const cdnBaseUrl = getGifCdnBaseUrl();
  
  // Construir URL do CDN se disponível
  let cdnUrl: string | null = null;
  if (cdnBaseUrl) {
    // Remover a barra inicial do caminho local
    let cdnPath = normalizedLocalPath.startsWith('/') ? normalizedLocalPath.slice(1) : normalizedLocalPath;
    
    // Remover o prefixo "GIFS/" do caminho para o CDN, pois no R2 os arquivos estão diretamente nas pastas
    // (ex: /GIFS/Abdomen/arquivo.gif -> Abdomen/arquivo.gif)
    if (cdnPath.startsWith('GIFS/')) {
      cdnPath = cdnPath.replace(/^GIFS\//, '');
    }
    
    cdnUrl = `${cdnBaseUrl}/${cdnPath}`;
  }
  
  // Por padrão, tentar primeiro o caminho local
  // Se falhar e houver CDN, o componente tentará o CDN
  return {
    local: normalizedLocalPath,
    cdn: cdnUrl,
    primary: normalizedLocalPath, // Sempre tentar local primeiro
  };
}

/**
 * Verifica se um erro de carregamento de imagem é um 404
 * @param error - Evento de erro da imagem
 * @returns true se for um erro 404
 */
export function is404Error(error: Event | { target?: HTMLImageElement; currentTarget?: HTMLImageElement }): boolean {
  const img = (error.target || error.currentTarget) as HTMLImageElement;
  
  if (!img) return false;
  
  // Verificar se a imagem falhou ao carregar
  if (img.naturalWidth === 0 && img.naturalHeight === 0) {
    // Tentar verificar o status HTTP fazendo uma requisição HEAD
    // Mas isso é assíncrono, então vamos assumir que é 404 se a imagem não carregou
    return true;
  }
  
  return false;
}

/**
 * Tenta carregar uma imagem e retorna uma Promise que resolve se carregou com sucesso
 * @param url - URL da imagem para testar
 * @returns Promise que resolve se a imagem carregou, rejeita se falhou
 */
export function testImageLoad(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    // Timeout após 5 segundos
    setTimeout(() => {
      reject(new Error(`Timeout loading image: ${url}`));
    }, 5000);
    
    img.src = url;
  });
}


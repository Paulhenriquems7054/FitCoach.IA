
import { useState, useEffect, useRef } from 'react';

const normalizePath = (hash: string) => {
  // Se não houver hash ou hash vazio, retornar vazio para o App decidir
  if (!hash || hash === '#') {
    return '';
  }
  
  // Se hash for exatamente '#/', ir para dashboard
  if (hash === '#/') {
    return '/';
  }
  
  // Extrair path do hash, removendo query strings e fragmentos
  const hashWithoutQuery = hash.split('?')[0];
  const newPath = hashWithoutQuery.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

export const useRouter = () => {
  // Usar ref para evitar atualizações desnecessárias durante inicialização
  const isInitialMount = useRef(true);
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.hash);
    }
    return '';
  });

  useEffect(() => {
    const enforceRoute = () => {
      const newPath = normalizePath(window.location.hash);
      // Evitar atualizações desnecessárias
      setPath(prevPath => {
        if (prevPath !== newPath) {
          return newPath;
        }
        return prevPath;
      });
    };

    // Na primeira montagem, garantir que o path está correto
    if (isInitialMount.current) {
      enforceRoute();
      isInitialMount.current = false;
    }

    window.addEventListener('hashchange', enforceRoute);
    window.addEventListener('storage', enforceRoute);

    return () => {
      window.removeEventListener('hashchange', enforceRoute);
      window.removeEventListener('storage', enforceRoute);
    };
  }, []);
  
  // Retornar path vazio se não houver hash, para o App decidir
  return { path: path || '' };
};

import { useState, useEffect } from 'react';

const normalizePath = (hash: string) => {
  // Se não houver hash ou hash vazio, ir para apresentação
  if (!hash || hash === '#') {
    return '/presentation';
  }
  
  // Se hash for exatamente '#/', ir para dashboard
  if (hash === '#/') {
    return '/';
  }
  
  // Extrair path do hash
  const newPath = hash.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

export const useRouter = () => {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.hash));

  useEffect(() => {
    const enforceRoute = () => {
      setPath(normalizePath(window.location.hash));
    };

    enforceRoute();
    window.addEventListener('hashchange', enforceRoute);
    window.addEventListener('storage', enforceRoute);

    return () => {
      window.removeEventListener('hashchange', enforceRoute);
      window.removeEventListener('storage', enforceRoute);
    };
  }, []);
  
  return { path: path || '/presentation' };
};
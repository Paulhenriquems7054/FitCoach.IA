
import { useState, useEffect } from 'react';

export const useRouter = () => {
  const [path, setPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      // Ensure path always starts with a slash
      const newPath = (window.location.hash || '#/').substring(1);
      setPath(newPath.startsWith('/') ? newPath : `/${newPath}`);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Set initial path
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  return { path: path || '/' };
};
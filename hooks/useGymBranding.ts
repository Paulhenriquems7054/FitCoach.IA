/**
 * Hook para usar branding de academia (white-labeling)
 */

import { useEffect, useState } from 'react';
import {
  getActiveBranding,
  getAppName,
  getGymLogo,
  loadGymBranding,
  loadGymConfig,
} from '../services/gymConfigService';
import type { Gym, GymBranding } from '../types';

export const useGymBranding = () => {
  const [branding, setBranding] = useState<GymBranding | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [appName, setAppName] = useState<string>('Nutri.IA');
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBranding = () => {
      try {
        // Carregar branding
        const loadedBranding = loadGymBranding();
        setBranding(loadedBranding);

        // Carregar configuração da academia
        const loadedGym = loadGymConfig();
        setGym(loadedGym);

        // Obter nome do app
        const name = getAppName();
        setAppName(name);

        // Obter logo
        const gymLogo = getGymLogo();
        setLogo(gymLogo);
      } catch (error) {
        console.error('Erro ao carregar branding da academia', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'nutria_gym_branding' ||
        e.key === 'nutria_gym_config'
      ) {
        loadBranding();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    branding,
    gym,
    appName,
    logo,
    isLoading,
    // Cores do branding (com fallback)
    colors: {
      primary: branding?.colors.primary || gym?.primaryColor || '#10b981', // emerald-500
      secondary: branding?.colors.secondary || gym?.secondaryColor || '#059669', // emerald-600
      accent: branding?.colors.accent || gym?.accentColor || '#34d399', // emerald-400
      background: branding?.colors.background || undefined,
      text: branding?.colors.text || undefined,
    },
    // Verificar se tem branding ativo
    hasBranding: !!branding || !!gym,
  };
};


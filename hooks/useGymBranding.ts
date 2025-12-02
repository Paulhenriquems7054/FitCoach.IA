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
  applyBrandingStyles,
} from '../services/gymConfigService';
import type { Gym, GymBranding } from '../types';

export const useGymBranding = () => {
  const [branding, setBranding] = useState<GymBranding | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [appName, setAppName] = useState<string>('FitCoach.IA');
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
        
        // Aplicar branding imediatamente se disponível
        if (loadedBranding) {
          applyBrandingStyles(loadedBranding);
        }
      } catch (error) {
        console.error('Erro ao carregar branding da academia', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Carregar imediatamente
    loadBranding();

    // Escutar mudanças no localStorage (incluindo na mesma aba)
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      const key = 'key' in e ? e.key : null;
      if (
        key === 'nutria_gym_branding' ||
        key === 'nutria_gym_config' ||
        !key // CustomEvent não tem key, então recarregar sempre
      ) {
        loadBranding();
      }
    };

    // Escutar eventos storage (outras abas)
    window.addEventListener('storage', handleStorageChange as EventListener);
    
    // Escutar eventos customizados (mesma aba)
    window.addEventListener('gym-branding-updated', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('gym-branding-updated', handleStorageChange as EventListener);
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


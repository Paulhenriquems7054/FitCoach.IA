/**
 * Provider para aplicar branding de academia em toda a aplicação
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useGymBranding } from '../hooks/useGymBranding';

interface GymBrandingContextType {
  appName: string;
  logo: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
    text?: string;
  };
  hasBranding: boolean;
}

const GymBrandingContext = createContext<GymBrandingContextType | undefined>(undefined);

export const useGymBrandingContext = () => {
  const context = useContext(GymBrandingContext);
  if (!context) {
    return {
      appName: 'Nutri.IA',
      logo: null,
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
      },
      hasBranding: false,
    };
  }
  return context;
};

interface GymBrandingProviderProps {
  children: ReactNode;
}

export const GymBrandingProvider: React.FC<GymBrandingProviderProps> = ({ children }) => {
  const { appName, logo, colors, hasBranding } = useGymBranding();

  useEffect(() => {
    // Aplicar CSS customizado baseado no branding
    const styleId = 'gym-branding-dynamic';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Aplicar variáveis CSS
    const css = `
      :root {
        --gym-primary: ${colors.primary};
        --gym-secondary: ${colors.secondary};
        --gym-accent: ${colors.accent};
        ${colors.background ? `--gym-background: ${colors.background};` : ''}
        ${colors.text ? `--gym-text: ${colors.text};` : ''}
      }
    `;

    styleElement.textContent = css;
  }, [colors]);

  const value: GymBrandingContextType = {
    appName,
    logo,
    colors,
    hasBranding,
  };

  return (
    <GymBrandingContext.Provider value={value}>
      {children}
    </GymBrandingContext.Provider>
  );
};


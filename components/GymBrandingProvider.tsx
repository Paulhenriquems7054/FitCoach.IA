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
      appName: 'FitCoach.IA',
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
    // Aplicar CSS customizado baseado no branding GLOBALMENTE
    const styleId = 'gym-branding-dynamic';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Função auxiliar para converter hex para RGB
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '34, 197, 94'; // fallback emerald-500
    };

    // Função auxiliar para gerar tons de uma cor
    const generateColorShades = (baseColor: string) => {
      const rgb = hexToRgb(baseColor);
      return {
        '50': `rgba(${rgb}, 0.05)`,
        '100': `rgba(${rgb}, 0.1)`,
        '200': `rgba(${rgb}, 0.2)`,
        '300': `rgba(${rgb}, 0.3)`,
        '400': `rgba(${rgb}, 0.4)`,
        '500': baseColor,
        '600': baseColor, // Pode ser ajustado para uma versão mais escura
        '700': baseColor,
        '800': baseColor,
        '900': baseColor,
      };
    };

    const primaryShades = generateColorShades(colors.primary);
    const secondaryShades = generateColorShades(colors.secondary);

    // Aplicar variáveis CSS globais que serão usadas por TODO o sistema
    const css = `
      :root {
        /* Cores principais do branding */
        --gym-primary: ${colors.primary};
        --gym-secondary: ${colors.secondary};
        --gym-accent: ${colors.accent};
        ${colors.background ? `--gym-background: ${colors.background};` : ''}
        ${colors.text ? `--gym-text: ${colors.text};` : ''}
        
        /* Integração com Tailwind - Sobrescrever cores primary */
        --color-primary-50: ${primaryShades['50']};
        --color-primary-100: ${primaryShades['100']};
        --color-primary-200: ${primaryShades['200']};
        --color-primary-300: ${primaryShades['300']};
        --color-primary-400: ${primaryShades['400']};
        --color-primary-500: ${colors.primary};
        --color-primary-600: ${colors.secondary};
        --color-primary-700: ${colors.secondary};
        --color-primary-800: ${colors.secondary};
        --color-primary-900: ${colors.secondary};
        
        /* Cores para uso direto em classes */
        --tw-color-primary: ${colors.primary};
        --tw-color-primary-dark: ${colors.secondary};
        --tw-color-accent: ${colors.accent};
      }
      
      /* Aplicar cores em TODOS os elementos que usam primary */
      .bg-primary-500,
      .bg-primary-600,
      .bg-primary-700,
      .text-primary-500,
      .text-primary-600,
      .text-primary-700,
      .border-primary-500,
      .border-primary-600,
      .ring-primary-500,
      .ring-primary-600 {
        --tw-color-primary: ${colors.primary} !important;
      }
      
      /* Botões primários */
      button.bg-primary-500,
      button.bg-primary-600,
      .btn-primary,
      [class*="bg-primary"] {
        background-color: ${colors.primary} !important;
      }
      
      button.bg-primary-500:hover,
      button.bg-primary-600:hover,
      .btn-primary:hover {
        background-color: ${colors.secondary} !important;
      }
      
      /* Links e textos primários */
      a.text-primary-500,
      a.text-primary-600,
      .text-primary-500,
      .text-primary-600,
      [class*="text-primary"] {
        color: ${colors.primary} !important;
      }
      
      /* Bordas primárias */
      .border-primary-500,
      .border-primary-600,
      [class*="border-primary"] {
        border-color: ${colors.primary} !important;
      }
      
      /* Focus rings */
      .focus\\:ring-primary-500:focus,
      .focus\\:ring-primary-600:focus {
        --tw-ring-color: ${colors.primary} !important;
      }
      
      /* Cards e elementos com destaque */
      .bg-primary-50,
      .bg-primary-100 {
        background-color: ${primaryShades['50']} !important;
      }
      
      /* Gradientes */
      .bg-gradient-to-r.from-primary-600.to-primary-500,
      [class*="from-primary"],
      [class*="to-primary"] {
        --tw-gradient-from: ${colors.primary} !important;
        --tw-gradient-to: ${colors.secondary} !important;
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


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

  // Adicionar fallback seguro para colors - garantir que sempre seja um objeto válido
  const safeColors = colors || {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: undefined,
    text: undefined,
  };

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

    const primaryShades = generateColorShades(safeColors.primary);
    const secondaryShades = generateColorShades(safeColors.secondary);

    // Aplicar variáveis CSS globais que serão usadas por TODO o sistema
    const css = `
      :root {
        /* Cores principais do branding */
        --gym-primary: ${safeColors.primary};
        --gym-secondary: ${safeColors.secondary};
        --gym-accent: ${safeColors.accent};
        ${safeColors.background ? `--gym-background: ${safeColors.background};` : ''}
        ${safeColors.text ? `--gym-text: ${safeColors.text};` : ''}
        
        /* Integração com Tailwind - Sobrescrever cores primary */
        --color-primary-50: ${primaryShades['50']};
        --color-primary-100: ${primaryShades['100']};
        --color-primary-200: ${primaryShades['200']};
        --color-primary-300: ${primaryShades['300']};
        --color-primary-400: ${primaryShades['400']};
        --color-primary-500: ${safeColors.primary};
        --color-primary-600: ${safeColors.secondary};
        --color-primary-700: ${safeColors.secondary};
        --color-primary-800: ${safeColors.secondary};
        --color-primary-900: ${safeColors.secondary};
        
        /* Cores para uso direto em classes */
        --tw-color-primary: ${safeColors.primary};
        --tw-color-primary-dark: ${safeColors.secondary};
        --tw-color-accent: ${safeColors.accent};
      }
      
      /* Aplicar cores em TODOS os elementos que usam primary - Backgrounds */
      .bg-primary-50,
      .bg-primary-100,
      .bg-primary-200,
      .bg-primary-300,
      .bg-primary-400,
      .bg-primary-500,
      .bg-primary-600,
      .bg-primary-700,
      .bg-primary-800,
      .bg-primary-900,
      button.bg-primary-500,
      button.bg-primary-600,
      button.bg-primary-700,
      .btn-primary,
      [class*="bg-primary"] {
        background-color: ${safeColors.primary} !important;
      }
      
      /* Text colors */
      .text-primary-50,
      .text-primary-100,
      .text-primary-200,
      .text-primary-300,
      .text-primary-400,
      .text-primary-500,
      .text-primary-600,
      .text-primary-700,
      .text-primary-800,
      .text-primary-900,
      a.text-primary-500,
      a.text-primary-600,
      a.text-primary-700,
      [class*="text-primary"] {
        color: ${safeColors.primary} !important;
      }
      
      /* Border colors */
      .border-primary-50,
      .border-primary-100,
      .border-primary-200,
      .border-primary-300,
      .border-primary-400,
      .border-primary-500,
      .border-primary-600,
      .border-primary-700,
      .border-primary-800,
      .border-primary-900,
      [class*="border-primary"] {
        border-color: ${safeColors.primary} !important;
      }
      
      /* Hover states - Backgrounds */
      .hover\\:bg-primary-50:hover,
      .hover\\:bg-primary-100:hover,
      .hover\\:bg-primary-200:hover,
      .hover\\:bg-primary-300:hover,
      .hover\\:bg-primary-400:hover,
      .hover\\:bg-primary-500:hover,
      .hover\\:bg-primary-600:hover,
      .hover\\:bg-primary-700:hover,
      .hover\\:bg-primary-800:hover,
      .hover\\:bg-primary-900:hover,
      button:hover.bg-primary-500,
      button:hover.bg-primary-600,
      button:hover.bg-primary-700,
      .btn-primary:hover {
        background-color: ${safeColors.secondary} !important;
      }
      
      /* Hover states - Text */
      .hover\\:text-primary-500:hover,
      .hover\\:text-primary-600:hover,
      .hover\\:text-primary-700:hover,
      a:hover.text-primary-500,
      a:hover.text-primary-600,
      a:hover.text-primary-700 {
        color: ${safeColors.secondary} !important;
      }
      
      /* Focus rings */
      .focus\\:ring-primary-500:focus,
      .focus\\:ring-primary-600:focus,
      .focus\\:ring-primary-700:focus,
      .ring-primary-500,
      .ring-primary-600,
      .ring-primary-700 {
        --tw-ring-color: ${safeColors.primary} !important;
        border-color: ${safeColors.primary} !important;
      }
      
      /* Cards e elementos com destaque */
      .bg-primary-50,
      .bg-primary-100 {
        background-color: ${primaryShades['50']} !important;
      }
      
      /* Gradientes */
      .bg-gradient-to-r.from-primary-500,
      .bg-gradient-to-r.from-primary-600,
      .bg-gradient-to-br.from-primary-500,
      .bg-gradient-to-br.from-primary-600,
      .bg-gradient-to-br.to-primary-600,
      .bg-gradient-to-br.to-primary-700,
      [class*="from-primary"],
      [class*="to-primary"] {
        --tw-gradient-from: ${safeColors.primary} !important;
        --tw-gradient-to: ${safeColors.secondary} !important;
        background-image: linear-gradient(to right, ${safeColors.primary}, ${safeColors.secondary}) !important;
      }
    `;

    styleElement.textContent = css;
  }, [safeColors]);

  const value: GymBrandingContextType = {
    appName,
    logo,
    colors: safeColors,
    hasBranding,
  };

  return (
    <GymBrandingContext.Provider value={value}>
      {children}
    </GymBrandingContext.Provider>
  );
};


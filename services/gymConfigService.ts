/**
 * Serviço de Configuração de Academias (Multi-tenancy)
 * 
 * Gerencia configurações de academias, white-labeling e distribuição via QR code
 */

import type { Gym, GymBranding, User } from '../types';
import { logger } from '../utils/logger';

const GYM_STORAGE_KEY = 'nutria_gym_config';
const GYM_BRANDING_KEY = 'nutria_gym_branding';
const GYM_QR_CODE_KEY = 'nutria_gym_qrcode';

/**
 * Salva configuração de academia no localStorage
 */
export const saveGymConfig = (gym: Gym): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(gym));
    logger.info(`Configuração da academia ${gym.name} salva`, 'gymConfigService');
  } catch (error) {
    logger.error('Erro ao salvar configuração de academia', 'gymConfigService', error);
  }
};

/**
 * Carrega configuração de academia do localStorage
 */
export const loadGymConfig = (): Gym | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(GYM_STORAGE_KEY);
    if (!stored) return null;
    
    const gym = JSON.parse(stored) as Gym;
    return gym;
  } catch (error) {
    logger.error('Erro ao carregar configuração de academia', 'gymConfigService', error);
    return null;
  }
};

/**
 * Remove configuração de academia
 */
export const clearGymConfig = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(GYM_STORAGE_KEY);
    localStorage.removeItem(GYM_BRANDING_KEY);
    localStorage.removeItem(GYM_QR_CODE_KEY);
    logger.info('Configuração de academia removida', 'gymConfigService');
  } catch (error) {
    logger.error('Erro ao remover configuração de academia', 'gymConfigService', error);
  }
};

/**
 * Salva configuração de branding (white-labeling)
 */
export const saveGymBranding = (branding: GymBranding): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GYM_BRANDING_KEY, JSON.stringify(branding));
    
    // Aplicar CSS customizado
    applyBrandingStyles(branding);
    
    logger.info(`Branding da academia ${branding.gymId} aplicado`, 'gymConfigService');
  } catch (error) {
    logger.error('Erro ao salvar branding de academia', 'gymConfigService', error);
  }
};

/**
 * Carrega configuração de branding
 */
export const loadGymBranding = (): GymBranding | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(GYM_BRANDING_KEY);
    if (!stored) return null;
    
    const branding = JSON.parse(stored) as GymBranding;
    
    // Aplicar estilos ao carregar
    applyBrandingStyles(branding);
    
    return branding;
  } catch (error) {
    logger.error('Erro ao carregar branding de academia', 'gymConfigService', error);
    return null;
  }
};

/**
 * Aplica estilos CSS customizados baseados no branding
 */
const applyBrandingStyles = (branding: GymBranding): void => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'gym-branding-styles';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  const css = `
    :root {
      --gym-primary: ${branding.colors.primary};
      --gym-secondary: ${branding.colors.secondary};
      --gym-accent: ${branding.colors.accent};
      ${branding.colors.background ? `--gym-background: ${branding.colors.background};` : ''}
      ${branding.colors.text ? `--gym-text: ${branding.colors.text};` : ''}
    }
    
    .gym-primary {
      background-color: ${branding.colors.primary} !important;
      color: white !important;
    }
    
    .gym-secondary {
      background-color: ${branding.colors.secondary} !important;
    }
    
    .gym-accent {
      color: ${branding.colors.accent} !important;
    }
    
    .gym-logo {
      content: url(${branding.logo || ''});
    }
  `;
  
  styleElement.textContent = css;
};

/**
 * Gera QR code para distribuição da academia
 * Retorna data URL da imagem do QR code
 */
export const generateGymQRCode = async (gymId: string, gymName: string): Promise<string | null> => {
  try {
    // Dados para o QR code: URL do app + gymId
    const qrData = JSON.stringify({
      type: 'gym_install',
      gymId,
      gymName,
      timestamp: Date.now(),
    });
    
    // Usar biblioteca QR code (se disponível) ou gerar via API
    // Por enquanto, retornamos um placeholder
    // Em produção, usar biblioteca como 'qrcode' ou 'qrcode.react'
    
    // Se tiver biblioteca QR code instalada:
    // const QRCode = await import('qrcode');
    // const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    // return qrCodeDataUrl;
    
    // Por enquanto, retornamos null e o QR code será gerado no frontend
    return null;
  } catch (error) {
    logger.error('Erro ao gerar QR code da academia', 'gymConfigService', error);
    return null;
  }
};

/**
 * Salva QR code da academia
 */
export const saveGymQRCode = (gymId: string, qrCodeDataUrl: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const data = { gymId, qrCodeDataUrl, timestamp: Date.now() };
    localStorage.setItem(GYM_QR_CODE_KEY, JSON.stringify(data));
  } catch (error) {
    logger.error('Erro ao salvar QR code da academia', 'gymConfigService', error);
  }
};

/**
 * Carrega QR code da academia
 */
export const loadGymQRCode = (): { gymId: string; qrCodeDataUrl: string } | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(GYM_QR_CODE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    logger.error('Erro ao carregar QR code da academia', 'gymConfigService', error);
    return null;
  }
};

/**
 * Verifica se o usuário pertence a uma academia
 */
export const isUserFromGym = (user: User): boolean => {
  return !!user.gymId && !!user.isGymManaged;
};

/**
 * Obtém configuração de branding ativa (se houver)
 */
export const getActiveBranding = (): GymBranding | null => {
  return loadGymBranding();
};

/**
 * Obtém nome do app personalizado (ou padrão)
 */
export const getAppName = (): string => {
  const branding = getActiveBranding();
  if (branding?.appName) {
    return branding.appName;
  }
  
  const gym = loadGymConfig();
  if (gym?.appName) {
    return gym.appName;
  }
  
  return 'Nutri.IA'; // Nome padrão
};

/**
 * Obtém logo da academia (ou padrão)
 */
export const getGymLogo = (): string | null => {
  const branding = getActiveBranding();
  if (branding?.logo) {
    return branding.logo;
  }
  
  const gym = loadGymConfig();
  if (gym?.logo) {
    return gym.logo;
  }
  
  return null; // Usar logo padrão
};

/**
 * Processa dados do QR code e configura a academia
 */
export const processQRCodeData = (qrData: string): { gymId: string; gymName: string } | null => {
  try {
    const data = JSON.parse(qrData);
    
    if (data.type === 'gym_install' && data.gymId && data.gymName) {
      return {
        gymId: data.gymId,
        gymName: data.gymName,
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Erro ao processar dados do QR code', 'gymConfigService', error);
    return null;
  }
};

/**
 * Cria uma nova academia (para administradores)
 */
export const createGym = (gymData: Omit<Gym, 'id' | 'createdAt' | 'updatedAt'>): Gym => {
  const gym: Gym = {
    ...gymData,
    id: `gym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: gymData.isActive ?? true,
  };
  
  saveGymConfig(gym);
  return gym;
};

/**
 * Atualiza configuração de academia
 */
export const updateGym = (gymId: string, updates: Partial<Gym>): Gym | null => {
  const currentGym = loadGymConfig();
  
  if (!currentGym || currentGym.id !== gymId) {
    logger.warn(`Academia ${gymId} não encontrada para atualização`, 'gymConfigService');
    return null;
  }
  
  const updatedGym: Gym = {
    ...currentGym,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveGymConfig(updatedGym);
  return updatedGym;
};


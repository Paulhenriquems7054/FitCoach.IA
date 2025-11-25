import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOS = 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown';
export type BrowserType = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Unknown';

export interface DeviceInfo {
  type: DeviceType;
  os: DeviceOS;
  browser: BrowserType;
  isTouch: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  deviceId: string; // ID único por dispositivo (baseado em características)
}

/**
 * Detecta informações detalhadas do dispositivo
 */
const detectDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      os: 'Unknown',
      browser: 'Unknown',
      isTouch: false,
      isPortrait: true,
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: '',
      deviceId: 'unknown'
    };
  }

  const ua = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isPortrait = screenHeight > screenWidth;

  // Detectar OS
  let os: DeviceOS = 'Unknown';
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/win/i.test(ua)) {
    os = 'Windows';
  } else if (/mac/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detectar navegador
  let browser: BrowserType = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // Detectar tipo de dispositivo baseado em tamanho de tela e user agent
  let type: DeviceType = 'desktop';
  const isMobileUA = /mobile|android|iphone|ipad/i.test(ua);
  const isTabletUA = /tablet|ipad/i.test(ua) || (screenWidth >= 768 && screenWidth < 1024);

  if (isTabletUA) {
    type = 'tablet';
  } else if (isMobileUA || screenWidth < 768) {
    type = 'mobile';
  } else {
    type = 'desktop';
  }

  // Detectar touch
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Gerar ID único do dispositivo (baseado em características estáveis)
  const generateDeviceId = (): string => {
    try {
      // Tentar usar localStorage para persistir o ID
      const storedId = localStorage.getItem('fitcoach.device.id');
      if (storedId) {
        return storedId;
      }

      // Gerar novo ID baseado em características do dispositivo
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillText(ua + screenWidth + screenHeight, 2, 2);
      }

      const fingerprint = [
        ua,
        screenWidth,
        screenHeight,
        navigator.language,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.deviceMemory || 0
      ].join('|');

      // Hash simples (não criptográfico, apenas para identificação)
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      const deviceId = `device_${Math.abs(hash).toString(36)}`;
      localStorage.setItem('fitcoach.device.id', deviceId);
      return deviceId;
    } catch (error) {
      // Fallback: usar timestamp + random
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  return {
    type,
    os,
    browser,
    isTouch,
    isPortrait,
    screenWidth,
    screenHeight,
    userAgent: ua,
    deviceId: generateDeviceId()
  };
};

/**
 * Hook para detectar e monitorar informações do dispositivo
 */
export const useDevice = (): DeviceInfo & {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
} => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDeviceInfo());

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDeviceInfo());
    };

    // Atualizar ao redimensionar
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Atualizar periodicamente (para detectar mudanças de orientação)
    const interval = setInterval(updateDeviceInfo, 1000);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      clearInterval(interval);
    };
  }, []);

  return {
    ...deviceInfo,
    isMobile: deviceInfo.type === 'mobile',
    isTablet: deviceInfo.type === 'tablet',
    isDesktop: deviceInfo.type === 'desktop',
    isSmallScreen: deviceInfo.screenWidth < 640,
    isMediumScreen: deviceInfo.screenWidth >= 640 && deviceInfo.screenWidth < 1024,
    isLargeScreen: deviceInfo.screenWidth >= 1024
  };
};


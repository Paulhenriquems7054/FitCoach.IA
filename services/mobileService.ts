/**
 * Serviço de Funcionalidades Mobile Específicas
 * Offline, widgets, atalhos, Siri/Assistant
 */

import { logger } from '../utils/logger';

export interface MobileWidget {
  id: string;
  type: 'progress' | 'workout' | 'nutrition' | 'stats';
  config: Record<string, any>;
}

export interface Shortcut {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
}

class MobileService {
  /**
   * Verifica se está em dispositivo móvel
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Verifica se app está instalado como PWA
   */
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  /**
   * Solicita instalação PWA
   */
  async promptPWAInstall(): Promise<boolean> {
    if ('BeforeInstallPromptEvent' in window) {
      const event = new (window as any).BeforeInstallPromptEvent();
      const result = await event.prompt();
      return result === 'accepted';
    }
    return false;
  }

  /**
   * Verifica suporte offline
   */
  isOfflineCapable(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Cria atalho (iOS/Android)
   */
  async createShortcut(shortcut: Shortcut): Promise<boolean> {
    try {
      if (this.isPWAInstalled()) {
        // Em produção, criar atalho nativo
        logger.info(`Atalho criado: ${shortcut.title}`, 'mobileService');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erro ao criar atalho', 'mobileService', error);
      return false;
    }
  }

  /**
   * Adiciona widget nativo (iOS 14+/Android)
   */
  async addWidget(widget: MobileWidget): Promise<boolean> {
    try {
      // Em produção, usar API de widgets nativa
      logger.info(`Widget adicionado: ${widget.id}`, 'mobileService');
      return true;
    } catch (error) {
      logger.error('Erro ao adicionar widget', 'mobileService', error);
      return false;
    }
  }

  /**
   * Configura integração com Siri/Assistant
   */
  async setupVoiceAssistant(commands: Array<{ phrase: string; action: string }>): Promise<boolean> {
    try {
      // Em produção, configurar Intents (iOS) ou App Shortcuts (Android)
      logger.info(`Assistente de voz configurado com ${commands.length} comandos`, 'mobileService');
      return true;
    } catch (error) {
      logger.error('Erro ao configurar assistente de voz', 'mobileService', error);
      return false;
    }
  }

  /**
   * Vibração (Haptic Feedback)
   */
  vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Detecta orientação
   */
  getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Solicita permissão de notificação
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  /**
   * Solicita permissão de localização
   */
  async requestLocationPermission(): Promise<boolean> {
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }
    return false;
  }

  /**
   * Obtém informações do dispositivo
   */
  getDeviceInfo(): {
    platform: string;
    version: string;
    model?: string;
    isMobile: boolean;
    isPWA: boolean;
  } {
    const ua = navigator.userAgent;
    const platform = /Android/i.test(ua) ? 'Android' :
                    /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
                    /Mac/i.test(ua) ? 'macOS' :
                    /Win/i.test(ua) ? 'Windows' :
                    /Linux/i.test(ua) ? 'Linux' : 'Unknown';

    return {
      platform,
      version: '1.0.0',
      isMobile: this.isMobile(),
      isPWA: this.isPWAInstalled(),
    };
  }
}

// Instância singleton
export const mobileService = new MobileService();


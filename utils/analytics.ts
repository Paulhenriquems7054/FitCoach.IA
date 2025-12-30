/**
 * Serviço de Analytics
 * Preparado para integração com Google Analytics, Plausible, ou outros serviços
 * Respeitando privacidade do usuário
 */

import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

class AnalyticsService {
  private isInitialized = false;
  private isEnabled = false;
  private analyticsId: string | null = null;
  private userId: string | null = null;
  private hasUserConsent = false;

  /**
   * Inicializa o serviço de analytics
   */
  init(): void {
    if (this.isInitialized) {
      return;
    }

    // Verificar se analytics está configurado
    this.analyticsId = import.meta.env.VITE_ANALYTICS_ID || null;

    if (!this.analyticsId) {
      logger.info('Analytics não configurado. Configure VITE_ANALYTICS_ID para ativar.', 'analytics');
      this.isInitialized = true;
      return;
    }

    // Verificar consentimento do usuário (LGPD/GDPR)
    this.checkUserConsent();

    if (this.hasUserConsent && this.isEnabled) {
      this.initAnalytics();
    }

    this.isInitialized = true;
    logger.info('Analytics inicializado', 'analytics');
  }

  /**
   * Verifica consentimento do usuário
   */
  private checkUserConsent(): void {
    // Verificar preferência do usuário (localStorage)
    const consent = localStorage.getItem('analytics_consent');
    
    if (consent === 'true') {
      this.hasUserConsent = true;
      this.isEnabled = true;
    } else if (consent === 'false') {
      this.hasUserConsent = true;
      this.isEnabled = false;
    } else {
      // Não há consentimento definido ainda
      this.hasUserConsent = false;
      this.isEnabled = false;
    }
  }

  /**
   * Solicita consentimento do usuário
   */
  requestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      // Em uma implementação real, mostrar um banner de consentimento
      // Por enquanto, assumir que o usuário aceita se chamar esta função
      this.setConsent(true);
      resolve(true);
    });
  }

  /**
   * Define consentimento do usuário
   */
  setConsent(consent: boolean): void {
    this.hasUserConsent = true;
    this.isEnabled = consent;
    localStorage.setItem('analytics_consent', String(consent));

    if (consent && !this.isInitialized) {
      this.initAnalytics();
    }

    logger.info(`Consentimento de analytics: ${consent}`, 'analytics');
  }

  /**
   * Inicializa o serviço de analytics
   */
  private initAnalytics(): void {
    // TODO: Implementar integração com Google Analytics ou Plausible
    // 
    // Exemplo para Google Analytics 4:
    // gtag('config', this.analyticsId, {
    //   page_path: window.location.pathname,
    // });
    //
    // Exemplo para Plausible:
    // plausible('init', { domain: 'fitcoach.ia' });

    logger.info('Analytics configurado (implementação pendente)', 'analytics');
  }

  /**
   * Rastreia um evento
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled || !this.hasUserConsent) {
      return;
    }

    logger.debug('Evento de analytics:', 'analytics', event);

    // TODO: Implementar envio para serviço de analytics
    // 
    // Exemplo para Google Analytics:
    // gtag('event', event.name, {
    //   event_category: event.category,
    //   event_label: event.label,
    //   value: event.value,
    //   ...event.properties,
    // });
    //
    // Exemplo para Plausible:
    // plausible(event.name, {
    //   props: {
    //     category: event.category,
    //     ...event.properties,
    //   },
    // });
  }

  /**
   * Rastreia visualização de página
   */
  trackPageView(path: string, title?: string): void {
    if (!this.isEnabled || !this.hasUserConsent) {
      return;
    }

    logger.debug(`Page view: ${path}`, 'analytics');

    // TODO: Implementar envio para serviço de analytics
    // 
    // Exemplo para Google Analytics:
    // gtag('config', this.analyticsId, {
    //   page_path: path,
    //   page_title: title,
    // });
  }

  /**
   * Define o usuário atual
   */
  setUser(userId: string): void {
    this.userId = userId;

    // TODO: Implementar quando analytics estiver configurado
    // gtag('set', { user_id: userId });

    logger.debug(`Usuário definido para analytics: ${userId}`, 'analytics');
  }

  /**
   * Limpa o contexto do usuário
   */
  clearUser(): void {
    this.userId = null;

    // TODO: Implementar quando analytics estiver configurado
    // gtag('set', { user_id: null });

    logger.debug('Contexto do usuário limpo', 'analytics');
  }

  /**
   * Verifica se analytics está habilitado
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled && this.hasUserConsent;
  }
}

// Instância singleton
export const analytics = new AnalyticsService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  analytics.init();
}

// Funções auxiliares para eventos comuns
export const trackConversion = (conversionType: string, value?: number) => {
  analytics.trackEvent({
    name: 'conversion',
    category: 'business',
    action: conversionType,
    value: value,
  });
};

export const trackFeatureUsage = (featureName: string, properties?: Record<string, unknown>) => {
  analytics.trackEvent({
    name: 'feature_used',
    category: 'engagement',
    action: featureName,
    properties: properties,
  });
};

export const trackError = (errorType: string, errorMessage: string) => {
  analytics.trackEvent({
    name: 'error',
    category: 'technical',
    action: errorType,
    label: errorMessage,
  });
};


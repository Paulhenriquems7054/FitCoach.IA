/**
 * Serviço de Error Tracking
 * Preparado para integração com Sentry ou outros serviços
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  feature?: string;
  additionalData?: Record<string, unknown>;
}

class ErrorTrackingService {
  private isInitialized = false;
  private sentryDsn: string | null = null;
  private isCapturing = false; // Flag para evitar loops recursivos

  /**
   * Inicializa o serviço de error tracking
   */
  init(): void {
    if (this.isInitialized) {
      return;
    }

    // Verificar se Sentry está configurado
    this.sentryDsn = import.meta.env.VITE_SENTRY_DSN || null;

    if (this.sentryDsn) {
      this.initSentry();
    } else {
      logger.info('Error tracking não configurado. Configure VITE_SENTRY_DSN para ativar.', 'errorTracking');
    }

    // Capturar erros não tratados
    this.setupGlobalErrorHandlers();

    this.isInitialized = true;
    logger.info('Error tracking inicializado', 'errorTracking');
  }

  /**
   * Inicializa Sentry (quando implementado)
   */
  private initSentry(): void {
    // TODO: Implementar integração com Sentry
    // import * as Sentry from '@sentry/react';
    // 
    // Sentry.init({
    //   dsn: this.sentryDsn,
    //   environment: import.meta.env.MODE,
    //   integrations: [
    //     new Sentry.BrowserTracing(),
    //     new Sentry.Replay(),
    //   ],
    //   tracesSampleRate: 1.0,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // });

    logger.info('Sentry configurado (implementação pendente)', 'errorTracking');
  }

  /**
   * Configura handlers globais de erro
   */
  private setupGlobalErrorHandlers(): void {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        feature: 'global',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Capturar promessas rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          feature: 'promise',
          additionalData: {
            reason: event.reason,
          },
        }
      );
    });
  }

  /**
   * Captura um erro
   */
  captureError(error: Error | unknown, context?: ErrorContext): void {
    // Proteção contra loops recursivos
    if (this.isCapturing) {
      console.warn('[errorTracking] Evitando loop recursivo - erro já está sendo capturado');
      return;
    }
    
    this.isCapturing = true;
    
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // NÃO chamar logger.error aqui para evitar loop - apenas console.error
      console.error('[errorTracking]', errorMessage, error);

    // Preparar dados para envio
    const errorData = {
      message: errorMessage,
      stack: errorStack,
      context: context || {},
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

      // Enviar para serviço de tracking (quando implementado)
      if (this.sentryDsn) {
        this.sendToSentry(errorData);
      } else {
        // Em desenvolvimento, logar no console
        if (import.meta.env.DEV) {
          console.error('Error Tracking:', errorData);
        }
      }
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Envia erro para Sentry (quando implementado)
   */
  private sendToSentry(errorData: unknown): void {
    // TODO: Implementar envio para Sentry
    // Sentry.captureException(error, {
    //   contexts: {
    //     custom: context,
    //   },
    //   user: {
    //     id: context?.userId,
    //     email: context?.userEmail,
    //   },
    //   tags: {
    //     feature: context?.feature,
    //   },
    // });

    logger.debug('Erro preparado para envio ao Sentry', 'errorTracking', errorData);
  }

  /**
   * Captura uma mensagem (não erro)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    logger[level](message, 'errorTracking', context);

    if (this.sentryDsn) {
      // TODO: Implementar envio para Sentry
      // Sentry.captureMessage(message, level);
    }
  }

  /**
   * Define o usuário atual para tracking
   */
  setUser(userId: string, email?: string): void {
    // TODO: Implementar quando Sentry estiver configurado
    // Sentry.setUser({
    //   id: userId,
    //   email: email,
    // });

    logger.debug(`Usuário definido para tracking: ${userId}`, 'errorTracking');
  }

  /**
   * Limpa o contexto do usuário
   */
  clearUser(): void {
    // TODO: Implementar quando Sentry estiver configurado
    // Sentry.setUser(null);

    logger.debug('Contexto do usuário limpo', 'errorTracking');
  }
}

// Instância singleton
export const errorTracking = new ErrorTrackingService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  errorTracking.init();
}


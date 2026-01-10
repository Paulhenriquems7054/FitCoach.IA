/**
 * Serviço de Monitoramento e Observabilidade
 * Sentry, Grafana, alertas
 */

import { logger } from '../utils/logger';

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'security' | 'usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

class MonitoringService {
  private errors: ErrorEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];

  /**
   * Inicializa Sentry (se disponível)
   */
  async initializeSentry(dsn?: string): Promise<void> {
    try {
      // Em produção, inicializar Sentry SDK
      if (dsn && typeof (window as any).Sentry !== 'undefined') {
        (window as any).Sentry.init({
          dsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: 1.0,
        });
        logger.info('Sentry inicializado', 'monitoringService');
      }
    } catch (error) {
      logger.warn('Erro ao inicializar Sentry', 'monitoringService', error);
    }
  }

  /**
   * Captura erro
   */
  captureError(error: Error, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
    };

    this.errors.push(errorEvent);
    
    // Manter apenas últimos 1000 erros
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    // Enviar para Sentry (se disponível)
    if (typeof (window as any).Sentry !== 'undefined') {
      (window as any).Sentry.captureException(error, { extra: context });
    }

    logger.error(error.message, 'monitoringService', error);
    this.checkForAlerts('error', errorEvent);
  }

  /**
   * Registra métrica de performance
   */
  recordMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metrics.push(metric);

    // Manter apenas últimos 5000 métricas
    if (this.metrics.length > 5000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // Enviar para Grafana (em produção via API)
    this.sendMetricToGrafana(metric);
  }

  /**
   * Envia métrica para Grafana
   */
  private sendMetricToGrafana(metric: PerformanceMetric): void {
    // Em produção, enviar via API para Grafana
    // fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metric) });
  }

  /**
   * Verifica se deve criar alerta
   */
  private checkForAlerts(type: Alert['type'], data: any): void {
    // Regras de alerta
    if (type === 'error') {
      const recentErrors = this.errors.filter(
        e => new Date(e.timestamp).getTime() > Date.now() - 60000 // Último minuto
      );

      if (recentErrors.length >= 10) {
        this.createAlert({
          type: 'error',
          severity: 'high',
          message: `Muitos erros detectados: ${recentErrors.length} erros no último minuto`,
        });
      }
    }

    if (type === 'performance') {
      const slowMetrics = this.metrics.filter(
        m => m.name.includes('render') && m.value > 1000
      );

      if (slowMetrics.length >= 5) {
        this.createAlert({
          type: 'performance',
          severity: 'medium',
          message: 'Performance degradada detectada',
        });
      }
    }
  }

  /**
   * Cria alerta
   */
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(newAlert);

    // Notificar administradores (em produção)
    this.notifyAdmins(newAlert);

    logger.warn(`Alerta criado: ${newAlert.message}`, 'monitoringService');
  }

  /**
   * Notifica administradores
   */
  private notifyAdmins(alert: Alert): void {
    // Em produção, enviar notificação via email/Slack/etc
    if (alert.severity === 'critical') {
      // Enviar notificação imediata
    }
  }

  /**
   * Resolve alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`Alerta resolvido: ${alertId}`, 'monitoringService');
      return true;
    }
    return false;
  }

  /**
   * Obtém erros recentes
   */
  getRecentErrors(limit: number = 50): ErrorEvent[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obtém métricas
   */
  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    return filtered.slice(-limit);
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }
}

// Instância singleton
export const monitoringService = new MonitoringService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  monitoringService.initializeSentry().catch(error => {
    logger.error('Erro ao inicializar monitoramento', 'monitoringService', error);
  });

  // Capturar erros globais
  window.addEventListener('error', (event) => {
    monitoringService.captureError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Capturar promessas rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    monitoringService.captureError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      { reason: event.reason }
    );
  });
}

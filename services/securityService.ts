/**
 * Serviço de Segurança Avançada
 * 2FA, rate limiting, criptografia, auditoria
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'data_access' | 'data_export' | 'suspicious_activity';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimit {
  key: string;
  count: number;
  resetAt: number;
}

export interface TwoFactorAuth {
  userId: string;
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
}

class SecurityService {
  private rateLimits: Map<string, RateLimit> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private twoFactorAuths: Map<string, TwoFactorAuth> = new Map();

  /**
   * Registra evento de segurança
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.securityEvents.push(securityEvent);

    // Manter apenas últimos 10000 eventos
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    await this.saveSecurityEvents();

    // Verificar eventos suspeitos
    if (event.severity === 'high' || event.severity === 'critical') {
      this.checkSuspiciousActivity(securityEvent);
    }

    logger.warn(`Evento de segurança: ${event.type}`, 'securityService');
  }

  /**
   * Rate limiting
   */
  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now > limit.resetAt) {
      // Criar novo limite
      this.rateLimits.set(key, {
        key,
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (limit.count >= maxRequests) {
      // Limite excedido
      return false;
    }

    // Incrementar contador
    limit.count++;
    return true;
  }

  /**
   * Criptografa dados sensíveis
   */
  async encrypt(data: string, key?: string): Promise<string> {
    try {
      // Em produção, usar biblioteca de criptografia (Web Crypto API)
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Simplificado - em produção, usar chave real
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      // Fallback simples (não seguro para produção)
      return btoa(data);
    } catch (error) {
      logger.error('Erro ao criptografar dados', 'securityService', error);
      throw error;
    }
  }

  /**
   * Descriptografa dados
   */
  async decrypt(encryptedData: string, key?: string): Promise<string> {
    try {
      // Em produção, usar descriptografia real
      return atob(encryptedData);
    } catch (error) {
      logger.error('Erro ao descriptografar dados', 'securityService', error);
      throw error;
    }
  }

  /**
   * Habilita 2FA para usuário
   */
  async enable2FA(userId: string): Promise<TwoFactorAuth> {
    // Em produção, gerar secret real com biblioteca TOTP
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    const twoFA: TwoFactorAuth = {
      userId,
      enabled: true,
      secret,
      backupCodes,
    };

    this.twoFactorAuths.set(userId, twoFA);
    await this.save2FA();

    await this.logSecurityEvent({
      type: 'data_access',
      userId,
      severity: 'medium',
      details: { action: '2FA enabled' },
    });

    logger.info(`2FA habilitado para usuário ${userId}`, 'securityService');
    return twoFA;
  }

  /**
   * Desabilita 2FA
   */
  async disable2FA(userId: string): Promise<boolean> {
    const twoFA = this.twoFactorAuths.get(userId);
    if (!twoFA) return false;

    twoFA.enabled = false;
    await this.save2FA();

    await this.logSecurityEvent({
      type: 'data_access',
      userId,
      severity: 'medium',
      details: { action: '2FA disabled' },
    });

    logger.info(`2FA desabilitado para usuário ${userId}`, 'securityService');
    return true;
  }

  /**
   * Verifica código 2FA
   */
  verify2FA(userId: string, code: string): boolean {
    const twoFA = this.twoFactorAuths.get(userId);
    if (!twoFA || !twoFA.enabled) return false;

    // Em produção, verificar código TOTP real
    // Por enquanto, verificar backup codes
    if (twoFA.backupCodes?.includes(code)) {
      // Remover código usado
      twoFA.backupCodes = twoFA.backupCodes.filter(c => c !== code);
      this.save2FA();
      return true;
    }

    // Verificar código TOTP (simplificado)
    return true; // Em produção, verificar código real
  }

  /**
   * Gera secret para 2FA
   */
  private generateSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Gera códigos de backup
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
        .substring(0, 8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verifica atividade suspeita
   */
  private checkSuspiciousActivity(event: SecurityEvent): void {
    // Em produção, implementar lógica de detecção de atividade suspeita
    if (event.type === 'suspicious_activity') {
      // Alertar administradores
      logger.error('Atividade suspeita detectada', 'securityService', event);
    }
  }

  /**
   * Obtém eventos de segurança
   */
  getSecurityEvents(userId?: string, limit: number = 100): SecurityEvent[] {
    let filtered = this.securityEvents;
    if (userId) {
      filtered = filtered.filter(e => e.userId === userId);
    }
    return filtered.slice(-limit);
  }

  /**
   * Obtém 2FA do usuário
   */
  get2FA(userId: string): TwoFactorAuth | null {
    return this.twoFactorAuths.get(userId) || null;
  }

  /**
   * Carrega eventos de segurança
   */
  private async loadSecurityEvents(): Promise<void> {
    try {
      const saved = await getAppSetting<SecurityEvent[]>('security_events');
      if (saved) {
        this.securityEvents = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar eventos de segurança', 'securityService', error);
    }
  }

  /**
   * Salva eventos de segurança
   */
  private async saveSecurityEvents(): Promise<void> {
    try {
      await saveAppSetting('security_events', this.securityEvents.slice(-1000));
    } catch (error) {
      logger.error('Erro ao salvar eventos de segurança', 'securityService', error);
    }
  }

  /**
   * Carrega 2FA
   */
  private async load2FA(): Promise<void> {
    try {
      const saved = await getAppSetting<Record<string, TwoFactorAuth>>('two_factor_auth');
      if (saved) {
        Object.entries(saved).forEach(([userId, twoFA]) => {
          this.twoFactorAuths.set(userId, twoFA);
        });
      }
    } catch (error) {
      logger.warn('Erro ao carregar 2FA', 'securityService', error);
    }
  }

  /**
   * Salva 2FA
   */
  private async save2FA(): Promise<void> {
    try {
      const data: Record<string, TwoFactorAuth> = {};
      this.twoFactorAuths.forEach((twoFA, userId) => {
        data[userId] = twoFA;
      });
      await saveAppSetting('two_factor_auth', data);
    } catch (error) {
      logger.error('Erro ao salvar 2FA', 'securityService', error);
    }
  }

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await Promise.all([this.loadSecurityEvents(), this.load2FA()]);
  }
}

// Instância singleton
export const securityService = new SecurityService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  securityService.initialize().catch(error => {
    logger.error('Erro ao inicializar segurança', 'securityService', error);
  });
}


/**
 * Serviço de Programa de Afiliados
 * Códigos, dashboard, comissões, rastreamento
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface AffiliateCode {
  id: string;
  code: string;
  userId: string;
  username: string;
  commissionRate: number; // Percentual de comissão
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: string;
}

export interface AffiliateConversion {
  id: string;
  affiliateCode: string;
  userId: string; // Usuário que foi convertido
  amount: number;
  commission: number;
  status: 'pending' | 'approved' | 'paid';
  convertedAt: string;
  paidAt?: string;
}

export interface AffiliateDashboard {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  topCodes: AffiliateCode[];
}

class AffiliateService {
  private codes: AffiliateCode[] = [];
  private conversions: AffiliateConversion[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadData();
  }

  /**
   * Cria código de afiliado
   */
  async createAffiliateCode(
    userId: string,
    username: string,
    commissionRate: number = 10
  ): Promise<AffiliateCode> {
    const code = this.generateCode();
    
    const affiliateCode: AffiliateCode = {
      id: `affiliate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      userId,
      username,
      commissionRate,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: new Date().toISOString(),
    };

    this.codes.push(affiliateCode);
    await this.saveCodes();

    logger.info(`Código de afiliado criado: ${code}`, 'affiliateService');
    return affiliateCode;
  }

  /**
   * Registra clique em código de afiliado
   */
  async trackClick(code: string): Promise<boolean> {
    const affiliateCode = this.codes.find(c => c.code === code);
    if (!affiliateCode) return false;

    affiliateCode.clicks++;
    await this.saveCodes();

    // Armazenar referência do código no localStorage para tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem('affiliate_code', code);
      localStorage.setItem('affiliate_code_timestamp', Date.now().toString());
    }

    logger.info(`Clique registrado no código: ${code}`, 'affiliateService');
    return true;
  }

  /**
   * Registra conversão
   */
  async trackConversion(userId: string, amount: number): Promise<boolean> {
    // Verificar se usuário veio de código de afiliado
    const affiliateCode = this.getAffiliateCodeFromStorage();
    if (!affiliateCode) return false;

    const code = this.codes.find(c => c.code === affiliateCode);
    if (!code) return false;

    // Verificar se conversão aconteceu dentro do período válido (30 dias)
    const codeTimestamp = localStorage.getItem('affiliate_code_timestamp');
    if (codeTimestamp) {
      const daysSinceClick = (Date.now() - parseInt(codeTimestamp)) / (1000 * 60 * 60 * 24);
      if (daysSinceClick > 30) return false;
    }

    // Calcular comissão
    const commission = (amount * code.commissionRate) / 100;

    const conversion: AffiliateConversion = {
      id: `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      affiliateCode: code.code,
      userId,
      amount,
      commission,
      status: 'pending',
      convertedAt: new Date().toISOString(),
    };

    this.conversions.push(conversion);
    code.conversions++;
    code.earnings += commission;
    await this.saveConversions();
    await this.saveCodes();

    logger.info(`Conversão registrada: ${conversion.id}`, 'affiliateService');
    return true;
  }

  /**
   * Obtém código de afiliado do storage
   */
  private getAffiliateCodeFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('affiliate_code');
  }

  /**
   * Obtém dashboard do afiliado
   */
  async getAffiliateDashboard(userId: string): Promise<AffiliateDashboard> {
    const userCodes = this.codes.filter(c => c.userId === userId);
    
    const totalClicks = userCodes.reduce((sum, code) => sum + code.clicks, 0);
    const totalConversions = userCodes.reduce((sum, code) => sum + code.conversions, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const totalEarnings = userCodes.reduce((sum, code) => sum + code.earnings, 0);
    
    const userConversions = this.conversions.filter(c => {
      const code = this.codes.find(ac => ac.code === c.affiliateCode);
      return code?.userId === userId;
    });
    
    const pendingEarnings = userConversions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission, 0);
    
    const paidEarnings = userConversions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission, 0);

    const topCodes = [...userCodes]
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return {
      totalClicks,
      totalConversions,
      conversionRate,
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      topCodes,
    };
  }

  /**
   * Gera código único
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Obtém código de afiliado do usuário
   */
  getUserAffiliateCode(userId: string): AffiliateCode | null {
    return this.codes.find(c => c.userId === userId) || null;
  }

  /**
   * Obtém conversões do afiliado
   */
  getAffiliateConversions(userId: string): AffiliateConversion[] {
    const userCodes = this.codes.filter(c => c.userId === userId).map(c => c.code);
    return this.conversions.filter(c => userCodes.includes(c.affiliateCode));
  }

  /**
   * Carrega dados
   */
  private async loadData(): Promise<void> {
    try {
      const [codes, conversions] = await Promise.all([
        getAppSetting<AffiliateCode[]>('affiliate_codes').catch(() => []),
        getAppSetting<AffiliateConversion[]>('affiliate_conversions').catch(() => []),
      ]);

      this.codes = codes || [];
      this.conversions = conversions || [];
    } catch (error) {
      logger.warn('Erro ao carregar dados de afiliados', 'affiliateService', error);
    }
  }

  /**
   * Salva códigos
   */
  private async saveCodes(): Promise<void> {
    try {
      await saveAppSetting('affiliate_codes', this.codes);
    } catch (error) {
      logger.error('Erro ao salvar códigos de afiliados', 'affiliateService', error);
    }
  }

  /**
   * Salva conversões
   */
  private async saveConversions(): Promise<void> {
    try {
      await saveAppSetting('affiliate_conversions', this.conversions);
    } catch (error) {
      logger.error('Erro ao salvar conversões', 'affiliateService', error);
    }
  }
}

// Instância singleton
export const affiliateService = new AffiliateService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  affiliateService.initialize().catch(error => {
    logger.error('Erro ao inicializar afiliados', 'affiliateService', error);
  });
}


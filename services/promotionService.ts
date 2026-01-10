/**
 * Serviço de Cupons e Promoções
 * Descontos, fidelidade, cashback
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number; // Percentual ou valor fixo
  minPurchase?: number; // Valor mínimo de compra
  maxDiscount?: number; // Desconto máximo
  usageLimit?: number; // Limite de uso total
  usageCount: number; // Usos atuais
  userLimit?: number; // Limite por usuário
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface LoyaltyProgram {
  userId: string;
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalOrders: number;
  joinedAt: string;
}

export interface Cashback {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'approved' | 'paid';
  earnedAt: string;
  paidAt?: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'bogo' | 'cashback' | 'loyalty';
  value: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  conditions?: Record<string, any>;
}

class PromotionService {
  private coupons: Coupon[] = [];
  private loyaltyPrograms: Map<string, LoyaltyProgram> = new Map();
  private cashbacks: Cashback[] = [];
  private promotions: Promotion[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadData();
    this.initDefaultCoupons();
  }

  /**
   * Cria cupom
   */
  async createCoupon(coupon: Omit<Coupon, 'id' | 'usageCount'>): Promise<Coupon> {
    const newCoupon: Coupon = {
      ...coupon,
      id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      active: true,
    };

    this.coupons.push(newCoupon);
    await this.saveCoupons();

    logger.info(`Cupom criado: ${newCoupon.code}`, 'promotionService');
    return newCoupon;
  }

  /**
   * Valida cupom
   */
  validateCoupon(code: string, purchaseAmount: number): { valid: boolean; discount: number; error?: string } {
    const coupon = this.coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    
    if (!coupon) {
      return { valid: false, discount: 0, error: 'Cupom não encontrado' };
    }

    if (!coupon.active) {
      return { valid: false, discount: 0, error: 'Cupom inativo' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) {
      return { valid: false, discount: 0, error: 'Cupom ainda não válido' };
    }

    if (now > validUntil) {
      return { valid: false, discount: 0, error: 'Cupom expirado' };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, error: 'Cupom esgotado' };
    }

    if (coupon.minPurchase && purchaseAmount < coupon.minPurchase) {
      return { valid: false, discount: 0, error: `Valor mínimo: R$ ${coupon.minPurchase}` };
    }

    let discount = 0;
    
    switch (coupon.type) {
      case 'percentage':
        discount = (purchaseAmount * coupon.value) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
        break;
      case 'fixed':
        discount = Math.min(coupon.value, purchaseAmount);
        break;
      case 'free_shipping':
        discount = 0; // Aplicar separadamente
        break;
    }

    return { valid: true, discount };
  }

  /**
   * Aplica cupom
   */
  async applyCoupon(code: string, userId: string, purchaseAmount: number): Promise<{ valid: boolean; discount: number; error?: string }> {
    const validation = this.validateCoupon(code, purchaseAmount);
    
    if (!validation.valid) {
      return validation;
    }

    const coupon = this.coupons.find(c => c.code.toLowerCase() === code.toLowerCase())!;
    coupon.usageCount++;
    await this.saveCoupons();

    logger.info(`Cupom aplicado: ${code} por ${userId}`, 'promotionService');
    return validation;
  }

  /**
   * Adiciona pontos de fidelidade
   */
  async addLoyaltyPoints(userId: string, points: number): Promise<void> {
    let program = this.loyaltyPrograms.get(userId);
    
    if (!program) {
      program = {
        userId,
        points: 0,
        level: 'bronze',
        totalSpent: 0,
        totalOrders: 0,
        joinedAt: new Date().toISOString(),
      };
      this.loyaltyPrograms.set(userId, program);
    }

    program.points += points;
    this.updateLoyaltyLevel(program);
    await this.saveLoyaltyPrograms();

    logger.info(`Pontos adicionados: ${points} para ${userId}`, 'promotionService');
  }

  /**
   * Atualiza nível de fidelidade
   */
  private updateLoyaltyLevel(program: LoyaltyProgram): void {
    if (program.points >= 10000 || program.totalSpent >= 10000) {
      program.level = 'platinum';
    } else if (program.points >= 5000 || program.totalSpent >= 5000) {
      program.level = 'gold';
    } else if (program.points >= 2000 || program.totalSpent >= 2000) {
      program.level = 'silver';
    } else {
      program.level = 'bronze';
    }
  }

  /**
   * Cria cashback
   */
  async createCashback(userId: string, orderId: string, amount: number, percentage: number): Promise<Cashback> {
    const cashback: Cashback = {
      id: `cashback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      orderId,
      amount,
      percentage,
      status: 'pending',
      earnedAt: new Date().toISOString(),
    };

    this.cashbacks.push(cashback);
    await this.saveCashbacks();

    logger.info(`Cashback criado: ${cashback.id}`, 'promotionService');
    return cashback;
  }

  /**
   * Obtém programa de fidelidade do usuário
   */
  getUserLoyaltyProgram(userId: string): LoyaltyProgram | null {
    return this.loyaltyPrograms.get(userId) || null;
  }

  /**
   * Obtém cashbacks do usuário
   */
  getUserCashbacks(userId: string): Cashback[] {
    return this.cashbacks.filter(c => c.userId === userId);
  }

  /**
   * Inicializa cupons padrão
   */
  private initDefaultCoupons(): void {
    if (this.coupons.length === 0) {
      this.createCoupon({
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minPurchase: 50,
        maxDiscount: 20,
        usageLimit: 1000,
        userLimit: 1,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).catch(() => {});
    }
  }

  /**
   * Carrega dados
   */
  private async loadData(): Promise<void> {
    try {
      const [coupons, loyaltyData, cashbacks] = await Promise.all([
        getAppSetting<Coupon[]>('promotion_coupons').catch(() => []),
        getAppSetting<Record<string, LoyaltyProgram>>('promotion_loyalty').catch(() => ({})),
        getAppSetting<Cashback[]>('promotion_cashbacks').catch(() => []),
      ]);

      this.coupons = coupons || [];
      
      if (loyaltyData) {
        Object.entries(loyaltyData).forEach(([userId, program]) => {
          this.loyaltyPrograms.set(userId, program);
        });
      }
      
      this.cashbacks = cashbacks || [];
    } catch (error) {
      logger.warn('Erro ao carregar dados de promoções', 'promotionService', error);
    }
  }

  /**
   * Salva cupons
   */
  private async saveCoupons(): Promise<void> {
    try {
      await saveAppSetting('promotion_coupons', this.coupons);
    } catch (error) {
      logger.error('Erro ao salvar cupons', 'promotionService', error);
    }
  }

  /**
   * Salva programas de fidelidade
   */
  private async saveLoyaltyPrograms(): Promise<void> {
    try {
      const data: Record<string, LoyaltyProgram> = {};
      this.loyaltyPrograms.forEach((program, userId) => {
        data[userId] = program;
      });
      await saveAppSetting('promotion_loyalty', data);
    } catch (error) {
      logger.error('Erro ao salvar programas de fidelidade', 'promotionService', error);
    }
  }

  /**
   * Salva cashbacks
   */
  private async saveCashbacks(): Promise<void> {
    try {
      await saveAppSetting('promotion_cashbacks', this.cashbacks);
    } catch (error) {
      logger.error('Erro ao salvar cashbacks', 'promotionService', error);
    }
  }
}

// Instância singleton
export const promotionService = new PromotionService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  promotionService.initialize().catch(error => {
    logger.error('Erro ao inicializar promoções', 'promotionService', error);
  });
}


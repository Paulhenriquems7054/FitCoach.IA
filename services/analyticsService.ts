/**
 * Serviço de Analytics e Relatórios de Negócio
 * Dashboard executivo, churn, coorte
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface BusinessMetric {
  name: string;
  value: number;
  change: number; // Percentual de mudança
  period: 'day' | 'week' | 'month' | 'year';
  timestamp: string;
}

export interface UserCohort {
  cohort: string; // Mês de cadastro (ex: "2025-01")
  users: number;
  activeUsers: number;
  retentionRate: number;
  revenue: number;
}

export interface ChurnAnalysis {
  period: string;
  churnRate: number;
  churnedUsers: number;
  totalUsers: number;
  reasons: Record<string, number>;
}

export interface BusinessDashboard {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  churnRate: number;
  revenue: number;
  revenueGrowth: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  metrics: BusinessMetric[];
  cohorts: UserCohort[];
  churn: ChurnAnalysis[];
}

class AnalyticsService {
  private metrics: BusinessMetric[] = [];
  private cohorts: UserCohort[] = [];
  private churnData: ChurnAnalysis[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadData();
  }

  /**
   * Registra métrica de negócio
   */
  async recordMetric(metric: Omit<BusinessMetric, 'timestamp'>): Promise<void> {
    const businessMetric: BusinessMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(businessMetric);
    
    // Manter apenas últimos 10000 métricas
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }

    await this.saveMetrics();
    logger.info(`Métrica registrada: ${metric.name}`, 'analyticsService');
  }

  /**
   * Obtém dashboard executivo
   */
  async getBusinessDashboard(startDate?: string, endDate?: string): Promise<BusinessDashboard> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Calcular métricas principais
    const totalUsers = await this.getTotalUsers();
    const activeUsers = await this.getActiveUsers(start, end);
    const newUsers = await this.getNewUsers(start, end);
    const churnRate = await this.calculateChurnRate(start, end);
    const revenue = await this.getRevenue(start, end);
    const previousRevenue = await this.getRevenue(
      new Date(start.getTime() - (end.getTime() - start.getTime())),
      start
    );
    const revenueGrowth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
    const averageRevenuePerUser = activeUsers > 0 ? revenue / activeUsers : 0;
    const lifetimeValue = await this.calculateLTV();

    // Obter métricas recentes
    const metrics = this.getRecentMetrics(start, end);
    
    // Obter coortes
    const cohorts = await this.getCohorts(start, end);
    
    // Obter análise de churn
    const churn = await this.getChurnAnalysis(start, end);

    return {
      totalUsers,
      activeUsers,
      newUsers,
      churnRate,
      revenue,
      revenueGrowth,
      averageRevenuePerUser,
      lifetimeValue,
      metrics,
      cohorts,
      churn,
    };
  }

  /**
   * Obtém total de usuários
   */
  private async getTotalUsers(): Promise<number> {
    // Em produção, buscar do banco de dados
    return 0;
  }

  /**
   * Obtém usuários ativos
   */
  private async getActiveUsers(start: Date, end: Date): Promise<number> {
    // Em produção, buscar usuários que fizeram login no período
    return 0;
  }

  /**
   * Obtém novos usuários
   */
  private async getNewUsers(start: Date, end: Date): Promise<number> {
    // Em produção, buscar usuários cadastrados no período
    return 0;
  }

  /**
   * Calcula taxa de churn
   */
  private async calculateChurnRate(start: Date, end: Date): Promise<number> {
    // Em produção, calcular baseado em usuários que cancelaram
    return 0;
  }

  /**
   * Obtém receita
   */
  private async getRevenue(start: Date, end: Date): Promise<number> {
    // Em produção, somar receitas do período
    return 0;
  }

  /**
   * Calcula LTV (Lifetime Value)
   */
  private async calculateLTV(): Promise<number> {
    // Em produção, calcular valor médio ao longo da vida do usuário
    return 0;
  }

  /**
   * Obtém métricas recentes
   */
  private getRecentMetrics(start: Date, end: Date): BusinessMetric[] {
    return this.metrics.filter(m => {
      const timestamp = new Date(m.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Obtém coortes de usuários
   */
  async getCohorts(start: Date, end: Date): Promise<UserCohort[]> {
    // Em produção, agrupar usuários por mês de cadastro e calcular retenção
    return this.cohorts.filter(c => {
      const cohortDate = new Date(c.cohort);
      return cohortDate >= start && cohortDate <= end;
    });
  }

  /**
   * Obtém análise de churn
   */
  async getChurnAnalysis(start: Date, end: Date): Promise<ChurnAnalysis[]> {
    // Em produção, analisar padrões de churn
    return this.churnData.filter(c => {
      const periodDate = new Date(c.period);
      return periodDate >= start && periodDate <= end;
    });
  }

  /**
   * Carrega dados
   */
  private async loadData(): Promise<void> {
    try {
      const [metrics, cohorts, churn] = await Promise.all([
        getAppSetting<BusinessMetric[]>('analytics_metrics').catch(() => []),
        getAppSetting<UserCohort[]>('analytics_cohorts').catch(() => []),
        getAppSetting<ChurnAnalysis[]>('analytics_churn').catch(() => []),
      ]);

      this.metrics = metrics || [];
      this.cohorts = cohorts || [];
      this.churnData = churn || [];
    } catch (error) {
      logger.warn('Erro ao carregar dados de analytics', 'analyticsService', error);
    }
  }

  /**
   * Salva métricas
   */
  private async saveMetrics(): Promise<void> {
    try {
      await saveAppSetting('analytics_metrics', this.metrics.slice(-1000));
    } catch (error) {
      logger.error('Erro ao salvar métricas', 'analyticsService', error);
    }
  }
}

// Instância singleton
export const analyticsService = new AnalyticsService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  analyticsService.initialize().catch(error => {
    logger.error('Erro ao inicializar analytics', 'analyticsService', error);
  });
}


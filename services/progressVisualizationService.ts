/**
 * Serviço de Visualização de Progresso Avançado
 * Gráficos detalhados, comparação antes/depois, previsões com IA
 */

import { logger } from '../utils/logger';
import type { User } from '../types';

export interface ProgressDataPoint {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface ProgressTrend {
  period: 'week' | 'month' | 'quarter' | 'year';
  weightChange: number;
  weightChangePercent: number;
  averageWeight: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  velocity: number; // kg por período
}

export interface ProgressPrediction {
  date: string;
  predictedWeight: number;
  confidence: number; // 0-1
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

export interface BeforeAfterComparison {
  before: {
    date: string;
    weight: number;
    measurements?: Record<string, number>;
    photoUrl?: string;
  };
  after: {
    date: string;
    weight: number;
    measurements?: Record<string, number>;
    photoUrl?: string;
  };
  improvements: {
    weightLoss: number;
    weightLossPercent: number;
    measurementChanges: Record<string, number>;
  };
}

export interface BodyComposition {
  bodyFat: number;
  muscleMass: number;
  water: number;
  bone: number;
  visceralFat?: number;
}

class ProgressVisualizationService {
  /**
   * Calcula tendência de progresso
   */
  calculateTrend(
    dataPoints: ProgressDataPoint[],
    period: ProgressTrend['period'] = 'month'
  ): ProgressTrend | null {
    if (dataPoints.length < 2) return null;

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const weightChange = last.weight - first.weight;
    const weightChangePercent = (weightChange / first.weight) * 100;

    const averageWeight =
      sorted.reduce((sum, point) => sum + point.weight, 0) / sorted.length;

    // Calcular velocidade (mudança por período)
    const daysDiff = Math.ceil(
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let periodDays = 30;
    switch (period) {
      case 'week':
        periodDays = 7;
        break;
      case 'month':
        periodDays = 30;
        break;
      case 'quarter':
        periodDays = 90;
        break;
      case 'year':
        periodDays = 365;
        break;
    }

    const velocity = (weightChange / daysDiff) * periodDays;

    let trend: ProgressTrend['trend'] = 'stable';
    if (Math.abs(weightChangePercent) < 1) {
      trend = 'stable';
    } else if (weightChangePercent < 0) {
      trend = 'decreasing';
    } else {
      trend = 'increasing';
    }

    return {
      period,
      weightChange,
      weightChangePercent,
      averageWeight,
      trend,
      velocity,
    };
  }

  /**
   * Gera previsão de progresso usando regressão linear simples
   */
  generatePrediction(
    dataPoints: ProgressDataPoint[],
    daysAhead: number = 30
  ): ProgressPrediction[] {
    if (dataPoints.length < 3) {
      return [];
    }

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Regressão linear simples
    const n = sorted.length;
    const dates = sorted.map((p, i) => i);
    const weights = sorted.map(p => p.weight);

    const sumX = dates.reduce((a, b) => a + b, 0);
    const sumY = weights.reduce((a, b) => a + b, 0);
    const sumXY = dates.reduce((sum, x, i) => sum + x * weights[i], 0);
    const sumXX = dates.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcular R² para confiança
    const meanY = sumY / n;
    const ssRes = weights.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * dates[i] + intercept), 2),
      0
    );
    const ssTot = weights.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const rSquared = 1 - ssRes / ssTot;
    const confidence = Math.max(0, Math.min(1, rSquared));

    const predictions: ProgressPrediction[] = [];
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const lastWeight = sorted[sorted.length - 1].weight;

    for (let i = 1; i <= daysAhead; i += 7) {
      // Previsões semanais
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      const futureIndex = n + i / 7;
      const predictedWeight = slope * futureIndex + intercept;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predictedWeight: Math.round(predictedWeight * 10) / 10,
        confidence: Math.max(0.3, confidence - i / daysAhead * 0.2), // Diminui confiança com o tempo
        scenario: 'realistic',
      });
    }

    // Adicionar cenários otimista e pessimista
    const optimistic = predictions.map(p => ({
      ...p,
      predictedWeight: p.predictedWeight * 0.95, // 5% melhor
      scenario: 'optimistic' as const,
      confidence: p.confidence * 0.9,
    }));

    const pessimistic = predictions.map(p => ({
      ...p,
      predictedWeight: p.predictedWeight * 1.05, // 5% pior
      scenario: 'pessimistic' as const,
      confidence: p.confidence * 0.9,
    }));

    return [...predictions, ...optimistic, ...pessimistic];
  }

  /**
   * Cria comparação antes/depois
   */
  createBeforeAfterComparison(
    dataPoints: ProgressDataPoint[],
    beforeDate?: string,
    afterDate?: string
  ): BeforeAfterComparison | null {
    if (dataPoints.length < 2) return null;

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const before = beforeDate
      ? sorted.find(p => p.date === beforeDate) || sorted[0]
      : sorted[0];

    const after = afterDate
      ? sorted.find(p => p.date === afterDate) || sorted[sorted.length - 1]
      : sorted[sorted.length - 1];

    const weightLoss = before.weight - after.weight;
    const weightLossPercent = (weightLoss / before.weight) * 100;

    const measurementChanges: Record<string, number> = {};
    if (before.measurements && after.measurements) {
      Object.keys(before.measurements).forEach(key => {
        const beforeValue = before.measurements![key as keyof typeof before.measurements];
        const afterValue = after.measurements![key as keyof typeof after.measurements];
        if (beforeValue && afterValue) {
          measurementChanges[key] = beforeValue - afterValue;
        }
      });
    }

    return {
      before: {
        date: before.date,
        weight: before.weight,
        measurements: before.measurements,
      },
      after: {
        date: after.date,
        weight: after.weight,
        measurements: after.measurements,
      },
      improvements: {
        weightLoss,
        weightLossPercent,
        measurementChanges,
      },
    };
  }

  /**
   * Calcula composição corporal estimada
   */
  estimateBodyComposition(
    user: User,
    currentWeight: number
  ): BodyComposition {
    // Fórmulas simplificadas (em produção, usar fórmulas mais precisas)
    const bmi = currentWeight / Math.pow(user.altura / 100, 2);

    // Estimativa de gordura corporal (fórmula simplificada)
    let bodyFat = 0;
    if (user.genero === 'Masculino') {
      bodyFat = 1.20 * bmi + 0.23 * user.idade - 16.2;
    } else {
      bodyFat = 1.20 * bmi + 0.23 * user.idade - 5.4;
    }
    bodyFat = Math.max(5, Math.min(50, bodyFat)); // Limitar entre 5% e 50%

    const fatMass = (currentWeight * bodyFat) / 100;
    const muscleMass = currentWeight * 0.4; // Estimativa simplificada
    const water = currentWeight * 0.6; // Estimativa
    const bone = currentWeight * 0.15; // Estimativa

    return {
      bodyFat: Math.round(bodyFat * 10) / 10,
      muscleMass: Math.round(muscleMass * 10) / 10,
      water: Math.round(water * 10) / 10,
      bone: Math.round(bone * 10) / 10,
      visceralFat: Math.round((bodyFat * 0.1) * 10) / 10,
    };
  }

  /**
   * Gera dados para gráfico de progresso
   */
  generateChartData(
    dataPoints: ProgressDataPoint[],
    includePredictions: boolean = false
  ): {
    historical: Array<{ date: string; weight: number; label?: string }>;
    predictions?: Array<{ date: string; weight: number; confidence: number; scenario: string }>;
  } {
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const historical = sorted.map(point => ({
      date: point.date,
      weight: point.weight,
      label: new Date(point.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      }),
    }));

    if (!includePredictions) {
      return { historical };
    }

    const predictions = this.generatePrediction(sorted, 30);
    const predictionData = predictions
      .filter(p => p.scenario === 'realistic')
      .map(p => ({
        date: p.date,
        weight: p.predictedWeight,
        confidence: p.confidence,
        scenario: p.scenario,
      }));

    return {
      historical,
      predictions: predictionData,
    };
  }

  /**
   * Calcula estatísticas de progresso
   */
  calculateProgressStats(dataPoints: ProgressDataPoint[]): {
    totalDays: number;
    totalChange: number;
    averageWeeklyChange: number;
    bestWeek: { start: string; end: string; change: number };
    consistency: number; // 0-1, quanto mais próximo de 1, mais consistente
  } {
    if (dataPoints.length < 2) {
      return {
        totalDays: 0,
        totalChange: 0,
        averageWeeklyChange: 0,
        bestWeek: { start: '', end: '', change: 0 },
        consistency: 0,
      };
    }

    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalChange = last.weight - first.weight;

    const daysDiff = Math.ceil(
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const averageWeeklyChange = (totalChange / daysDiff) * 7;

    // Encontrar melhor semana
    let bestWeek = { start: first.date, end: first.date, change: 0 };
    for (let i = 0; i < sorted.length - 7; i++) {
      const weekStart = sorted[i];
      const weekEnd = sorted[Math.min(i + 7, sorted.length - 1)];
      const weekChange = weekStart.weight - weekEnd.weight;
      if (weekChange > bestWeek.change) {
        bestWeek = {
          start: weekStart.date,
          end: weekEnd.date,
          change: weekChange,
        };
      }
    }

    // Calcular consistência (baseado na variância)
    const weights = sorted.map(p => p.weight);
    const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
    const variance =
      weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, Math.min(1, 1 - stdDev / mean)); // Quanto menor a variância, maior a consistência

    return {
      totalDays: daysDiff,
      totalChange,
      averageWeeklyChange: Math.round(averageWeeklyChange * 10) / 10,
      bestWeek,
      consistency: Math.round(consistency * 100) / 100,
    };
  }
}

// Instância singleton
export const progressVisualizationService = new ProgressVisualizationService();


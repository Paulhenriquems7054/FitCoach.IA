/**
 * Serviço de Análise de Nutrição Avançada
 * Micronutrientes, deficiências, suplementos
 */

import { logger } from '../utils/logger';

export interface Micronutrient {
  name: string;
  amount: number;
  unit: string;
  dailyValue: number;
  percentage: number;
}

export interface NutritionDeficiency {
  nutrient: string;
  current: number;
  recommended: number;
  severity: 'low' | 'moderate' | 'high';
  symptoms?: string[];
}

export interface SupplementRecommendation {
  name: string;
  reason: string;
  dosage: string;
  timing: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AdvancedNutritionAnalysis {
  totalCalories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  micronutrients: Micronutrient[];
  deficiencies: NutritionDeficiency[];
  supplements: SupplementRecommendation[];
  score: number; // 0-100
}

class NutritionAnalysisService {
  /**
   * Analisa nutrição avançada
   */
  async analyzeNutrition(meals: any[]): Promise<AdvancedNutritionAnalysis> {
    // Calcular totais
    const totals = this.calculateTotals(meals);
    
    // Analisar micronutrientes
    const micronutrients = this.analyzeMicronutrients(meals);
    
    // Identificar deficiências
    const deficiencies = this.identifyDeficiencies(micronutrients);
    
    // Recomendar suplementos
    const supplements = this.recommendSupplements(deficiencies);
    
    // Calcular score
    const score = this.calculateScore(totals, micronutrients, deficiencies);

    return {
      totalCalories: totals.calories,
      macronutrients: {
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        fiber: totals.fiber,
      },
      micronutrients,
      deficiencies,
      supplements,
      score,
    };
  }

  /**
   * Calcula totais de macronutrientes
   */
  private calculateTotals(meals: any[]): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  } {
    return meals.reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fats += meal.fats || 0;
      acc.fiber += meal.fiber || 0;
      return acc;
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
    });
  }

  /**
   * Analisa micronutrientes
   */
  private analyzeMicronutrients(meals: any[]): Micronutrient[] {
    const micronutrients: Record<string, { amount: number; dailyValue: number; unit: string }> = {
      vitaminA: { amount: 0, dailyValue: 900, unit: 'mcg' },
      vitaminC: { amount: 0, dailyValue: 90, unit: 'mg' },
      vitaminD: { amount: 0, dailyValue: 20, unit: 'mcg' },
      vitaminE: { amount: 0, dailyValue: 15, unit: 'mg' },
      vitaminK: { amount: 0, dailyValue: 120, unit: 'mcg' },
      thiamin: { amount: 0, dailyValue: 1.2, unit: 'mg' },
      riboflavin: { amount: 0, dailyValue: 1.3, unit: 'mg' },
      niacin: { amount: 0, dailyValue: 16, unit: 'mg' },
      vitaminB6: { amount: 0, dailyValue: 1.7, unit: 'mg' },
      folate: { amount: 0, dailyValue: 400, unit: 'mcg' },
      vitaminB12: { amount: 0, dailyValue: 2.4, unit: 'mcg' },
      calcium: { amount: 0, dailyValue: 1000, unit: 'mg' },
      iron: { amount: 0, dailyValue: 18, unit: 'mg' },
      magnesium: { amount: 0, dailyValue: 400, unit: 'mg' },
      phosphorus: { amount: 0, dailyValue: 700, unit: 'mg' },
      potassium: { amount: 0, dailyValue: 4700, unit: 'mg' },
      zinc: { amount: 0, dailyValue: 11, unit: 'mg' },
    };

    // Em produção, calcular baseado nos alimentos reais
    meals.forEach(meal => {
      // Simulação - em produção, buscar valores nutricionais reais
    });

    return Object.entries(micronutrients).map(([name, data]) => ({
      name: name.replace(/([A-Z])/g, ' $1').trim(),
      amount: data.amount,
      unit: data.unit,
      dailyValue: data.dailyValue,
      percentage: (data.amount / data.dailyValue) * 100,
    }));
  }

  /**
   * Identifica deficiências
   */
  private identifyDeficiencies(micronutrients: Micronutrient[]): NutritionDeficiency[] {
    const deficiencies: NutritionDeficiency[] = [];

    micronutrients.forEach(nutrient => {
      if (nutrient.percentage < 50) {
        deficiencies.push({
          nutrient: nutrient.name,
          current: nutrient.amount,
          recommended: nutrient.dailyValue,
          severity: nutrient.percentage < 25 ? 'high' : nutrient.percentage < 40 ? 'moderate' : 'low',
        });
      }
    });

    return deficiencies;
  }

  /**
   * Recomenda suplementos
   */
  private recommendSupplements(deficiencies: NutritionDeficiency[]): SupplementRecommendation[] {
    const recommendations: SupplementRecommendation[] = [];

    deficiencies.forEach(deficiency => {
      if (deficiency.severity === 'high' || deficiency.severity === 'moderate') {
        recommendations.push({
          name: this.getSupplementName(deficiency.nutrient),
          reason: `Deficiência de ${deficiency.nutrient}`,
          dosage: this.getSupplementDosage(deficiency.nutrient),
          timing: 'Com as refeições',
          priority: deficiency.severity === 'high' ? 'high' : 'medium',
        });
      }
    });

    return recommendations;
  }

  /**
   * Obtém nome do suplemento
   */
  private getSupplementName(nutrient: string): string {
    const mapping: Record<string, string> = {
      'vitamin A': 'Vitamina A',
      'vitamin C': 'Vitamina C',
      'vitamin D': 'Vitamina D3',
      'vitamin E': 'Vitamina E',
      'vitamin K': 'Vitamina K',
      'calcium': 'Cálcio',
      'iron': 'Ferro',
      'magnesium': 'Magnésio',
      'zinc': 'Zinco',
    };
    return mapping[nutrient] || nutrient;
  }

  /**
   * Obtém dosagem do suplemento
   */
  private getSupplementDosage(nutrient: string): string {
    // Em produção, calcular baseado na deficiência
    return 'Conforme orientação médica';
  }

  /**
   * Calcula score nutricional
   */
  private calculateScore(
    totals: any,
    micronutrients: Micronutrient[],
    deficiencies: NutritionDeficiency[]
  ): number {
    let score = 100;

    // Penalizar deficiências
    deficiencies.forEach(def => {
      if (def.severity === 'high') score -= 10;
      else if (def.severity === 'moderate') score -= 5;
      else score -= 2;
    });

    // Penalizar desbalanceamento de macronutrientes
    const totalMacros = totals.protein + totals.carbs + totals.fats;
    if (totalMacros > 0) {
      const proteinPercent = (totals.protein * 4) / totals.calories;
      const carbsPercent = (totals.carbs * 4) / totals.calories;
      const fatsPercent = (totals.fats * 9) / totals.calories;

      // Valores ideais: 30% proteína, 40% carboidratos, 30% gorduras
      if (proteinPercent < 0.2 || proteinPercent > 0.4) score -= 5;
      if (carbsPercent < 0.3 || carbsPercent > 0.5) score -= 5;
      if (fatsPercent < 0.2 || fatsPercent > 0.4) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

// Instância singleton
export const nutritionAnalysisService = new NutritionAnalysisService();


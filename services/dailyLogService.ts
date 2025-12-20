/**
 * Serviço para gerenciar o diário de refeições do usuário
 * Armazena refeições consumidas durante o dia
 */

export interface MealItem {
  id: string;
  foodName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string;
  timestamp: string; // ISO date string
}

const STORAGE_KEY = 'fitcoach.dailyLog';

/**
 * Obtém todas as refeições do dia atual
 */
export function getTodayMeals(): MealItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allMeals: MealItem[] = JSON.parse(stored);
    return allMeals.filter(meal => meal.timestamp.startsWith(today));
  } catch (error) {
    console.error('Erro ao carregar refeições do dia:', error);
    return [];
  }
}

/**
 * Adiciona uma refeição ao diário
 */
export function addMealToLog(meal: Omit<MealItem, 'id' | 'timestamp'>): MealItem {
  if (typeof window === 'undefined') {
    throw new Error('localStorage não disponível');
  }
  
  const newMeal: MealItem = {
    ...meal,
    id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allMeals: MealItem[] = stored ? JSON.parse(stored) : [];
    allMeals.push(newMeal);
    
    // Manter apenas os últimos 1000 registros
    const recentMeals = allMeals.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentMeals));
    
    return newMeal;
  } catch (error) {
    console.error('Erro ao salvar refeição:', error);
    throw error;
  }
}

/**
 * Remove uma refeição do diário
 */
export function removeMealFromLog(mealId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const allMeals: MealItem[] = JSON.parse(stored);
    const filtered = allMeals.filter(meal => meal.id !== mealId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao remover refeição:', error);
  }
}

/**
 * Obtém resumo nutricional do dia
 */
export function getTodayNutritionSummary(): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
} {
  const todayMeals = getTodayMeals();
  
  return todayMeals.reduce(
    (acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.calories || 0),
      totalProtein: acc.totalProtein + (meal.protein || 0),
      totalCarbs: acc.totalCarbs + (meal.carbs || 0),
      totalFats: acc.totalFats + (meal.fats || 0),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
  );
}

/**
 * Formata resumo do dia para exibição
 */
export function formatDailyLogSummary(): string {
  const meals = getTodayMeals();
  const summary = getTodayNutritionSummary();
  
  if (meals.length === 0) {
    return 'Nenhuma refeição registrada hoje.';
  }
  
  const mealTypes = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche',
  };
  
  const mealsByType = meals.reduce((acc, meal) => {
    const type = mealTypes[meal.mealType] || meal.mealType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, MealItem[]>);
  
  let text = `Refeições de hoje:\n`;
  for (const [type, typeMeals] of Object.entries(mealsByType)) {
    text += `\n${type}:\n`;
    typeMeals.forEach(meal => {
      text += `- ${meal.foodName}`;
      if (meal.calories) text += ` (${meal.calories} kcal)`;
      text += '\n';
    });
  }
  
  text += `\nResumo do dia:\n`;
  text += `- Calorias: ${summary.totalCalories} kcal\n`;
  text += `- Proteínas: ${summary.totalProtein}g\n`;
  text += `- Carboidratos: ${summary.totalCarbs}g\n`;
  text += `- Gorduras: ${summary.totalFats}g`;
  
  return text;
}


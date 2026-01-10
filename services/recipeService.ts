/**
 * Serviço de Receitas Completo
 * Sistema completo de biblioteca de receitas, busca, filtros e lista de compras
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number; // minutos
  cookTime: number; // minutos
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink';
  cuisine?: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition: NutritionInfo;
  dietaryTags: DietaryTag[];
  rating?: number;
  ratingCount?: number;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface Instruction {
  step: number;
  description: string;
  imageUrl?: string;
  duration?: number; // minutos
}

export interface NutritionInfo {
  calories: number;
  protein: number; // gramas
  carbs: number; // gramas
  fat: number; // gramas
  fiber?: number; // gramas
  sugar?: number; // gramas
  sodium?: number; // mg
}

export type DietaryTag = 
  | 'vegan'
  | 'vegetarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'low-carb'
  | 'high-protein'
  | 'keto'
  | 'paleo'
  | 'low-fat'
  | 'sugar-free'
  | 'nut-free'
  | 'soy-free';

export interface RecipeFilter {
  category?: Recipe['category'];
  difficulty?: Recipe['difficulty'];
  dietaryTags?: DietaryTag[];
  maxPrepTime?: number;
  maxCookTime?: number;
  maxCalories?: number;
  minProtein?: number;
  cuisine?: string;
  searchQuery?: string;
}

export interface ShoppingListItem {
  id: string;
  ingredient: Ingredient;
  recipeId?: string;
  recipeTitle?: string;
  checked: boolean;
  addedAt: string;
}

class RecipeService {
  private recipes: Recipe[] = [];
  private shoppingList: ShoppingListItem[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadRecipes();
    await this.loadShoppingList();
  }

  /**
   * Carrega receitas (em produção, viria do backend)
   */
  private async loadRecipes(): Promise<void> {
    try {
      const saved = await getAppSetting<Recipe[]>('recipes');
      if (saved) {
        this.recipes = saved;
        return;
      }
    } catch (error) {
      logger.warn('Erro ao carregar receitas', 'recipeService', error);
    }

    // Receitas de exemplo
    this.recipes = this.getDefaultRecipes();
  }

  /**
   * Obtém receitas padrão
   */
  private getDefaultRecipes(): Recipe[] {
    return [
      {
        id: 'recipe-1',
        title: 'Omelete de Claras com Espinafre',
        description: 'Omelete rico em proteínas e baixo em calorias',
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'easy',
        category: 'breakfast',
        tags: ['proteína', 'rápido', 'saudável'],
        ingredients: [
          { name: 'Claras de ovo', amount: 4, unit: 'unidades' },
          { name: 'Espinafre', amount: 50, unit: 'g' },
          { name: 'Azeite', amount: 1, unit: 'colher de chá' },
          { name: 'Sal', amount: 1, unit: 'pitada' },
        ],
        instructions: [
          { step: 1, description: 'Bata as claras em uma tigela' },
          { step: 2, description: 'Aqueça o azeite em uma frigideira' },
          { step: 3, description: 'Adicione o espinafre e refogue por 2 minutos' },
          { step: 4, description: 'Despeje as claras e cozinhe até ficar firme' },
        ],
        nutrition: {
          calories: 150,
          protein: 20,
          carbs: 5,
          fat: 6,
          fiber: 2,
        },
        dietaryTags: ['high-protein', 'low-carb', 'gluten-free'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'recipe-2',
        title: 'Frango Grelhado com Batata Doce',
        description: 'Refeição completa e nutritiva',
        prepTime: 15,
        cookTime: 30,
        servings: 2,
        difficulty: 'medium',
        category: 'dinner',
        tags: ['proteína', 'carboidrato', 'completo'],
        ingredients: [
          { name: 'Peito de frango', amount: 200, unit: 'g' },
          { name: 'Batata doce', amount: 200, unit: 'g' },
          { name: 'Brócolis', amount: 100, unit: 'g' },
          { name: 'Azeite', amount: 1, unit: 'colher de sopa' },
          { name: 'Temperos', amount: 1, unit: 'pitada' },
        ],
        instructions: [
          { step: 1, description: 'Tempere o frango com sal e pimenta' },
          { step: 2, description: 'Corte a batata doce em cubos' },
          { step: 3, description: 'Grelhe o frango por 6 minutos de cada lado' },
          { step: 4, description: 'Asse a batata doce por 25 minutos' },
          { step: 5, description: 'Cozinhe o brócolis no vapor' },
        ],
        nutrition: {
          calories: 450,
          protein: 45,
          carbs: 40,
          fat: 12,
          fiber: 8,
        },
        dietaryTags: ['high-protein', 'gluten-free', 'dairy-free'],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Busca receitas com filtros
   */
  async searchRecipes(filter: RecipeFilter = {}): Promise<Recipe[]> {
    let results = [...this.recipes];

    // Filtro por categoria
    if (filter.category) {
      results = results.filter(r => r.category === filter.category);
    }

    // Filtro por dificuldade
    if (filter.difficulty) {
      results = results.filter(r => r.difficulty === filter.difficulty);
    }

    // Filtro por tags dietéticas
    if (filter.dietaryTags && filter.dietaryTags.length > 0) {
      results = results.filter(r =>
        filter.dietaryTags!.some(tag => r.dietaryTags.includes(tag))
      );
    }

    // Filtro por tempo de preparo
    if (filter.maxPrepTime) {
      results = results.filter(r => r.prepTime <= filter.maxPrepTime!);
    }

    // Filtro por tempo de cozimento
    if (filter.maxCookTime) {
      results = results.filter(r => r.cookTime <= filter.maxCookTime!);
    }

    // Filtro por calorias
    if (filter.maxCalories) {
      results = results.filter(r => r.nutrition.calories <= filter.maxCalories!);
    }

    // Filtro por proteína
    if (filter.minProtein) {
      results = results.filter(r => r.nutrition.protein >= filter.minProtein!);
    }

    // Filtro por culinária
    if (filter.cuisine) {
      results = results.filter(r => r.cuisine === filter.cuisine);
    }

    // Busca por texto
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.tags.some(tag => tag.toLowerCase().includes(query)) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(query))
      );
    }

    return results;
  }

  /**
   * Obtém receita por ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    return this.recipes.find(r => r.id === id) || null;
  }

  /**
   * Salva uma receita
   */
  async saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    this.recipes.push(newRecipe);
    await saveAppSetting('recipes', this.recipes);

    logger.info(`Receita salva: ${newRecipe.title}`, 'recipeService');
    return newRecipe;
  }

  /**
   * Adiciona ingredientes à lista de compras
   */
  async addToShoppingList(
    ingredients: Ingredient[],
    recipeId?: string,
    recipeTitle?: string
  ): Promise<void> {
    const userId = 'current-user'; // Em produção, usar userId real

    for (const ingredient of ingredients) {
      const item: ShoppingListItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ingredient,
        recipeId,
        recipeTitle,
        checked: false,
        addedAt: new Date().toISOString(),
      };

      this.shoppingList.push(item);
    }

    await this.saveShoppingList();
    logger.info('Ingredientes adicionados à lista de compras', 'recipeService');
  }

  /**
   * Obtém lista de compras
   */
  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.shoppingList;
  }

  /**
   * Atualiza item da lista de compras
   */
  async updateShoppingListItem(
    itemId: string,
    updates: Partial<ShoppingListItem>
  ): Promise<boolean> {
    const index = this.shoppingList.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this.shoppingList[index] = { ...this.shoppingList[index], ...updates };
    await this.saveShoppingList();
    return true;
  }

  /**
   * Remove item da lista de compras
   */
  async removeShoppingListItem(itemId: string): Promise<boolean> {
    const index = this.shoppingList.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this.shoppingList.splice(index, 1);
    await this.saveShoppingList();
    return true;
  }

  /**
   * Limpa lista de compras
   */
  async clearShoppingList(): Promise<void> {
    this.shoppingList = [];
    await this.saveShoppingList();
  }

  /**
   * Agrupa ingredientes da lista de compras
   */
  async getGroupedShoppingList(): Promise<Map<string, ShoppingListItem[]>> {
    const grouped = new Map<string, ShoppingListItem[]>();

    for (const item of this.shoppingList) {
      const key = item.ingredient.name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }

    return grouped;
  }

  /**
   * Carrega lista de compras
   */
  private async loadShoppingList(): Promise<void> {
    try {
      const saved = await getAppSetting<ShoppingListItem[]>('shoppingList');
      if (saved) {
        this.shoppingList = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar lista de compras', 'recipeService', error);
    }
  }

  /**
   * Salva lista de compras
   */
  private async saveShoppingList(): Promise<void> {
    try {
      await saveAppSetting('shoppingList', this.shoppingList);
    } catch (error) {
      logger.error('Erro ao salvar lista de compras', 'recipeService', error);
    }
  }

  /**
   * Obtém categorias disponíveis
   */
  getCategories(): Recipe['category'][] {
    return ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'];
  }

  /**
   * Obtém tags dietéticas disponíveis
   */
  getDietaryTags(): DietaryTag[] {
    return [
      'vegan',
      'vegetarian',
      'gluten-free',
      'dairy-free',
      'low-carb',
      'high-protein',
      'keto',
      'paleo',
      'low-fat',
      'sugar-free',
      'nut-free',
      'soy-free',
    ];
  }
}

// Instância singleton
export const recipeService = new RecipeService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  recipeService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de receitas', 'recipeService', error);
  });
}


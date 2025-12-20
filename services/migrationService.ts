/**
 * Serviço de Migração: IndexedDB → Supabase
 * 
 * Migra dados do armazenamento local para o Supabase
 * Prioridade: ALTA (segurança e LGPD)
 */

import { getSupabaseClient } from './supabaseService';
import { 
  getUser,
  getWellnessPlan,
  getWeightHistory,
  getChatMessages,
  getMealPlans,
  getMealAnalyses,
  getRecipes,
  initDatabase
} from './databaseService';
import { logger } from '../utils/logger';
import { logAuditEvent } from './auditService';

export interface MigrationResult {
  success: boolean;
  migrated: {
    weightHistory: number;
    chatMessages: number;
    wellnessPlans: number;
    mealPlans: number;
    mealAnalyses: number;
    recipes: number;
  };
  errors: string[];
}

/**
 * Migra todos os dados do IndexedDB para Supabase
 */
export async function migrateAllDataToSupabase(
  userId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: {
      weightHistory: 0,
      chatMessages: 0,
      wellnessPlans: 0,
      mealPlans: 0,
      mealAnalyses: 0,
      recipes: 0,
    },
    errors: [],
  };

  try {
    const supabase = getSupabaseClient();

    // 1. Migrar histórico de peso
    try {
      const weightHistory = await getWeightHistory();
      if (weightHistory && weightHistory.length > 0) {
        const weightData = weightHistory.map(entry => ({
          date: entry.date,
          weight: entry.weight,
        }));

        const { data, error } = await supabase.rpc('migrate_weight_history_from_local', {
          p_user_id: userId,
          p_weight_data: weightData,
        });

        if (error) {
          result.errors.push(`Erro ao migrar weight_history: ${error.message}`);
        } else {
          result.migrated.weightHistory = data || 0;
          logger.info(`Migrados ${result.migrated.weightHistory} registros de peso`, 'migrationService');
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar weight_history: ${error.message}`);
    }

    // 2. Migrar mensagens de chat
    try {
      const chatMessages = await getChatMessages();
      if (chatMessages && chatMessages.length > 0) {
        const messagesData = chatMessages.map(msg => ({
          ...msg.message,
          timestamp: msg.createdAt,
        }));

        const { data, error } = await supabase.rpc('migrate_chat_messages_from_local', {
          p_user_id: userId,
          p_messages: messagesData,
        });

        if (error) {
          result.errors.push(`Erro ao migrar chat_messages: ${error.message}`);
        } else {
          result.migrated.chatMessages = data || 0;
          logger.info(`Migradas ${result.migrated.chatMessages} mensagens`, 'migrationService');
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar chat_messages: ${error.message}`);
    }

    // 3. Migrar planos de bem-estar
    try {
      const user = await getUser();
      const wellnessPlan = await getWellnessPlan();
      if (wellnessPlan) {
        const { error } = await supabase
          .from('wellness_plans')
          .insert({
            user_id: userId,
            plan_data: wellnessPlan as any,
            gym_id: user?.gymId || null,
          });

        if (error) {
          result.errors.push(`Erro ao migrar wellness_plans: ${error.message}`);
        } else {
          result.migrated.wellnessPlans = 1;
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar wellness_plans: ${error.message}`);
    }

    // 4. Migrar planos alimentares
    try {
      const user = await getUser();
      if (user) {
        const mealPlans = await getMealPlans(userId, 100); // Limite alto para migrar tudo
        if (mealPlans && mealPlans.length > 0) {
          for (const mealPlan of mealPlans) {
            const { error } = await supabase
              .from('meal_plans')
              .insert({
                user_id: userId,
                plan_data: mealPlan as any,
                gym_id: user.gymId || null,
              });

            if (error) {
              result.errors.push(`Erro ao migrar meal_plan: ${error.message}`);
            } else {
              result.migrated.mealPlans++;
            }
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar meal_plans: ${error.message}`);
    }

    // 5. Migrar análises de refeições
    try {
      const mealAnalyses = await getMealAnalyses();
      if (mealAnalyses && mealAnalyses.length > 0) {
        const user = await getUser();
        for (const analysis of mealAnalyses) {
          const { error } = await supabase
            .from('meal_analyses')
            .insert({
              user_id: userId,
              analysis_data: analysis.analysis as any,
              image_data: analysis.imageData,
              gym_id: user?.gymId || null,
            });

          if (error) {
            result.errors.push(`Erro ao migrar meal_analysis: ${error.message}`);
          } else {
            result.migrated.mealAnalyses++;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar meal_analyses: ${error.message}`);
    }

    // 6. Migrar receitas
    try {
      const recipes = await getRecipes();
      if (recipes && recipes.length > 0) {
        const user = await getUser();
        for (const recipe of recipes) {
          const { error } = await supabase
            .from('recipes')
            .insert({
              user_id: userId,
              recipe_data: recipe as any,
              favorited: recipe.favorited,
              gym_id: user?.gymId || null,
            });

          if (error) {
            result.errors.push(`Erro ao migrar recipe: ${error.message}`);
          } else {
            result.migrated.recipes++;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Erro ao migrar recipes: ${error.message}`);
    }

    // Marcar como sucesso se pelo menos uma migração funcionou
    result.success = Object.values(result.migrated).some(count => count > 0);

    // Registrar auditoria
    await logAuditEvent('data_migrated', {
      userId,
      migrated: result.migrated,
      errorsCount: result.errors.length,
    }, userId);

    return result;
  } catch (error: any) {
    logger.error('Erro geral na migração', 'migrationService', error);
    result.errors.push(`Erro geral: ${error.message}`);
    return result;
  }
}

/**
 * Limpa dados do IndexedDB após migração bem-sucedida
 * ATENÇÃO: Esta função é destrutiva!
 */
export async function clearIndexedDBAfterMigration(): Promise<void> {
  try {
    // Limpar cada object store
    const db = await initDatabase();
    const stores = [
      'weightHistory',
      'chatMessages',
      'wellnessPlans',
      'mealPlans',
      'mealAnalyses',
      'recipes',
    ];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }

    logger.info('IndexedDB limpo após migração', 'migrationService');
  } catch (error) {
    logger.error('Erro ao limpar IndexedDB', 'migrationService', error);
    throw error;
  }
}


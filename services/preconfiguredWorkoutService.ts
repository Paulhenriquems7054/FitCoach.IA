/**
 * Serviço para gerenciar treinos pré-configurados no Supabase
 */

import { getSupabaseClient } from './supabaseService';
import type { PreconfiguredWorkout } from '../types';
import { logger } from '../utils/logger';

/**
 * Salva um treino pré-configurado criado pelo usuário no Supabase
 */
export async function savePreconfiguredWorkout(
    workout: PreconfiguredWorkout,
    userId: string,
    gymId?: string | null
): Promise<string> {
    try {
        const supabase = getSupabaseClient();

        // Preparar dados para inserção
        const workoutData = {
            user_id: userId,
            gym_id: gymId || null,
            nome: workout.nome,
            categoria: workout.categoria,
            nivel: workout.nivel,
            objetivo: workout.objetivo,
            genero: workout.genero || 'unisex',
            duracao_semanas: workout.duracao_semanas || null,
            mes: workout.mes || null,
            workout_data: workout, // Dados completos serializados
            arquivo_origem: workout.arquivo_origem || 'criado-pelo-usuario',
            data_importacao: workout.data_importacao || new Date().toISOString(),
            versao: workout.versao || 1,
        };

        const { data, error } = await supabase
            .from('preconfigured_workouts')
            .insert(workoutData as any)
            .select('id')
            .single();

        if (error) {
            logger.error('Erro ao salvar treino pré-configurado', 'preconfiguredWorkoutService', error);
            throw error;
        }

        if (!data || !('id' in data)) {
            throw new Error('Nenhum dado retornado ao salvar treino');
        }

        const workoutId = (data as any).id;
        logger.info(`Treino pré-configurado salvo com sucesso: ${workoutId}`, 'preconfiguredWorkoutService');
        return workoutId;
    } catch (error) {
        logger.error('Erro ao salvar treino pré-configurado', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

/**
 * Busca todos os treinos pré-configurados criados pelo usuário
 */
export async function getUserPreconfiguredWorkouts(userId: string): Promise<PreconfiguredWorkout[]> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('preconfigured_workouts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Erro ao buscar treinos pré-configurados', 'preconfiguredWorkoutService', error);
            throw error;
        }

        // Converter dados do Supabase para PreconfiguredWorkout
        const workouts: PreconfiguredWorkout[] = (data || []).map((row: any) => {
            // Se workout_data já contém o objeto completo, usar ele
            if (row.workout_data && typeof row.workout_data === 'object') {
                return row.workout_data as PreconfiguredWorkout;
            }
            
            // Caso contrário, reconstruir do formato do banco
            return {
                id: row.id,
                nome: row.nome,
                categoria: row.categoria,
                nivel: row.nivel,
                objetivo: row.objetivo,
                genero: row.genero,
                duracao_semanas: row.duracao_semanas,
                mes: row.mes,
                arquivo_origem: row.arquivo_origem,
                data_importacao: row.data_importacao,
                versao: row.versao,
                plano: row.workout_data?.plano || {
                    plano_treino_semanal: [],
                    recomendacoes_suplementos: [],
                    dicas_adicionais: '',
                    data_geracao: row.created_at,
                },
                metadata: row.workout_data?.metadata,
            } as PreconfiguredWorkout;
        });

        return workouts;
    } catch (error) {
        logger.error('Erro ao buscar treinos pré-configurados', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

/**
 * Busca treinos pré-configurados de uma academia (para trainers/admins)
 */
export async function getGymPreconfiguredWorkouts(gymId: string): Promise<PreconfiguredWorkout[]> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('preconfigured_workouts')
            .select('*')
            .eq('gym_id', gymId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Erro ao buscar treinos da academia', 'preconfiguredWorkoutService', error);
            throw error;
        }

        // Converter dados do Supabase para PreconfiguredWorkout
        const workouts: PreconfiguredWorkout[] = (data || []).map((row: any) => {
            if (row.workout_data && typeof row.workout_data === 'object') {
                return row.workout_data as PreconfiguredWorkout;
            }
            
            return {
                id: row.id,
                nome: row.nome,
                categoria: row.categoria,
                nivel: row.nivel,
                objetivo: row.objetivo,
                genero: row.genero,
                duracao_semanas: row.duracao_semanas,
                mes: row.mes,
                arquivo_origem: row.arquivo_origem,
                data_importacao: row.data_importacao,
                versao: row.versao,
                plano: row.workout_data?.plano || {
                    plano_treino_semanal: [],
                    recomendacoes_suplementos: [],
                    dicas_adicionais: '',
                    data_geracao: row.created_at,
                },
                metadata: row.workout_data?.metadata,
            } as PreconfiguredWorkout;
        });

        return workouts;
    } catch (error) {
        logger.error('Erro ao buscar treinos da academia', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

/**
 * Atualiza um treino pré-configurado
 */
export async function updatePreconfiguredWorkout(
    workoutId: string,
    workout: PreconfiguredWorkout,
    userId: string
): Promise<void> {
    try {
        const supabase = getSupabaseClient();

        const { error } = await (supabase
            .from('preconfigured_workouts') as any)
            .update({
                nome: workout.nome,
                categoria: workout.categoria,
                nivel: workout.nivel,
                objetivo: workout.objetivo,
                genero: workout.genero || 'unisex',
                duracao_semanas: workout.duracao_semanas || null,
                mes: workout.mes || null,
                workout_data: workout,
                versao: (workout.versao || 1) + 1,
            })
            .eq('id', workoutId)
            .eq('user_id', userId); // Garantir que só o dono pode atualizar

        if (error) {
            logger.error('Erro ao atualizar treino pré-configurado', 'preconfiguredWorkoutService', error);
            throw error;
        }

        logger.info(`Treino pré-configurado atualizado: ${workoutId}`, 'preconfiguredWorkoutService');
    } catch (error) {
        logger.error('Erro ao atualizar treino pré-configurado', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

/**
 * Deleta um treino pré-configurado
 */
export async function deletePreconfiguredWorkout(workoutId: string, userId: string): Promise<void> {
    try {
        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('preconfigured_workouts')
            .delete()
            .eq('id', workoutId)
            .eq('user_id', userId); // Garantir que só o dono pode deletar

        if (error) {
            logger.error('Erro ao deletar treino pré-configurado', 'preconfiguredWorkoutService', error);
            throw error;
        }

        logger.info(`Treino pré-configurado deletado: ${workoutId}`, 'preconfiguredWorkoutService');
    } catch (error) {
        logger.error('Erro ao deletar treino pré-configurado', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

/**
 * Importa todos os PDFs da pasta TREINOS e salva na tabela
 */
export async function importWorkoutsFromPdfs(
    userId: string,
    gymId?: string | null,
    onProgress?: (current: number, total: number, filename: string) => void
): Promise<{ success: number; errors: number; details: Array<{ filename: string; success: boolean; error?: string }> }> {
    try {
        // Importar funções necessárias
        const { processWorkoutDocument } = await import('./workoutCatalogService');
        const { listAvailableWorkouts } = await import('./workoutCatalogService');
        
        const files = await listAvailableWorkouts();
        const results: Array<{ filename: string; success: boolean; error?: string }> = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const filename = files[i];
            
            if (onProgress) {
                onProgress(i + 1, files.length, filename);
            }

            try {
                // Processar o documento PDF
                const workout = await processWorkoutDocument(filename);
                
                // Verificar se o treino já existe (pelo nome do arquivo)
                const supabase = getSupabaseClient();
                const { data: existing } = await (supabase
                    .from('preconfigured_workouts') as any)
                    .select('id')
                    .eq('user_id', userId)
                    .eq('arquivo_origem', filename)
                    .maybeSingle();

                if (existing && 'id' in existing) {
                    const existingId = (existing as any).id;
                    // Atualizar treino existente
                    const { error: updateError } = await (supabase
                        .from('preconfigured_workouts') as any)
                        .update({
                            nome: workout.nome,
                            categoria: workout.categoria,
                            nivel: workout.nivel,
                            objetivo: workout.objetivo,
                            genero: workout.genero || 'unisex',
                            duracao_semanas: workout.duracao_semanas || null,
                            mes: workout.mes || null,
                            workout_data: workout,
                            versao: (workout.versao || 1) + 1,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existingId);

                    if (updateError) {
                        throw updateError;
                    }

                    results.push({ filename, success: true });
                    successCount++;
                    logger.info(`Treino atualizado: ${filename}`, 'preconfiguredWorkoutService');
                } else {
                    // Criar novo treino
                    await savePreconfiguredWorkout(workout, userId, gymId);
                    results.push({ filename, success: true });
                    successCount++;
                    logger.info(`Treino importado: ${filename}`, 'preconfiguredWorkoutService');
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'Erro desconhecido';
                results.push({ filename, success: false, error: errorMessage });
                errorCount++;
                logger.error(`Erro ao importar treino ${filename}`, 'preconfiguredWorkoutService', error);
            }
        }

        return {
            success: successCount,
            errors: errorCount,
            details: results
        };
    } catch (error) {
        logger.error('Erro ao importar treinos dos PDFs', 'preconfiguredWorkoutService', error);
        throw error;
    }
}

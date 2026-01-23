import React, { useState } from 'react';
import type { Exercise, WorkoutDay } from '../../types';

interface WorkoutExerciseTableProps {
    workoutDay: WorkoutDay;
    editable?: boolean;
    onUpdate?: (exercises: Exercise[]) => void;
}

/**
 * Componente para exibir exercícios em formato de tabela
 * REGRAS RÍGIDAS:
 * - A tabela contém EXCLUSIVAMENTE exercícios
 * - Cada exercício ocupa UMA linha completa
 * - Colunas fixas: EXERCÍCIO | SET | REPS | OBS | INTERVALO
 * - Nenhuma informação adicional dentro da tabela
 */
export const WorkoutExerciseTable: React.FC<WorkoutExerciseTableProps> = ({ 
    workoutDay,
    editable = false,
    onUpdate
}) => {
    const [exercises, setExercises] = useState<Exercise[]>(() => {
        const exs = workoutDay.exercicios || [];
        // Filtrar exercícios válidos (não incluir nomes de dias, cabeçalhos, etc.)
        const filtered = exs
            .map(ex => {
                const name = ex.name || ex.nome || '';
                const nameTrimmed = name.trim();
                // Filtrar nomes de dias, cabeçalhos, etc.
                if (!nameTrimmed || 
                    nameTrimmed.length < 3 ||
                    nameTrimmed.match(/^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo|segunda-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado-feira|domingo-feira|SEGUNDA|TERÇA|QUARTA|QUINTA|SEXTA|SÁBADO|DOMINGO|EXERCICIO|EXERCÍCIO|SET|REPS|OBS|INTERVALO|TREINO|NOME|DATA)/i)) {
                    return null;
                }
                return {
                    name: nameTrimmed,
                    sets: ex.sets || '',
                    reps: ex.reps || '',
                    tips: ex.tips || '',
                    rest: ex.rest || '',
                    calories: ex.calories
                };
            })
            .filter((ex): ex is Exercise => ex !== null);
        
        // Se for editável e não houver exercícios, criar um exercício vazio para começar
        if (editable && filtered.length === 0) {
            return [{ name: '', sets: '', reps: '', tips: '', rest: '' }];
        }
        
        return filtered;
    });
    // Normalizar exercícios para garantir formato consistente
    const normalizeExercise = (ex: any): Exercise | null => {
        // Ignorar strings vazias, null, undefined
        if (!ex) return null;
        
        // Se for string, verificar se não é um cabeçalho ou informação adicional
        if (typeof ex === 'string') {
            const trimmed = ex.trim();
            // Ignorar se for cabeçalho, título, ou informação não-exercício
            // Incluir nomes de dias da semana e variações
            if (trimmed.length < 3 || 
                trimmed.match(/^(?:exercício|exercicio|set|reps|obs|intervalo|nome|data|categoria|nível|duração|dia|foco|treino|TREINO|PRESCRIÇÃO|ESTRUTURA|Esteira|QUARTA-FEIRA|DESCANSO|NOME:|DATA|segunda|terça|quarta|quinta|sexta|sábado|domingo|segunda-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado-feira|domingo-feira|SEGUNDA|TERÇA|QUARTA|QUINTA|SEXTA|SÁBADO|DOMINGO)/i) ||
                trimmed.match(/^[•\-\*]/) ||
                trimmed.match(/^\d+$/) ||
                trimmed === '' ||
                trimmed.match(/^[A-Z\s]{1,15}$/)) { // Cabeçalhos em maiúsculas muito curtos
                return null;
            }
            return { name: trimmed };
        }
        
        // Se for objeto, normalizar
        const name = ex.name || ex.nome;
        if (!name || name.trim() === '') return null;
        
        // Validar nome (não deve ser cabeçalho ou nome de dia)
        const nameTrimmed = name.trim();
        if (nameTrimmed.match(/^(?:EXERCICIO|EXERCÍCIO|SET|REPS|OBS|INTERVALO|TREINO|Treino|NOME|DATA|PRESCRIÇÃO|ESTRUTURA|segunda|terça|quarta|quinta|sexta|sábado|domingo|segunda-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado-feira|domingo-feira|SEGUNDA|TERÇA|QUARTA|QUINTA|SEXTA|SÁBADO|DOMINGO)/i) ||
            nameTrimmed.length < 3) {
            return null;
        }
        
        return {
            name: nameTrimmed,
            reps: ex.reps || ex.repeticoes || ex.repetitions,
            sets: ex.sets || ex.series,
            tips: ex.tips || ex.dicas || ex.tip || ex.obs,
            rest: ex.rest || ex.descanso || ex.restTime || ex.intervalo,
            calories: ex.calories || ex.calorias,
        };
    };

    // Se for dia de descanso, não renderizar tabela
    const isRestDay = workoutDay.foco_treino.toLowerCase().includes('descanso') || 
                     workoutDay.foco_treino.toLowerCase().includes('rest');

    if (isRestDay) {
        return null; // Retornar null para não renderizar nada
    }

    // Se não for editável, normalizar exercícios do workoutDay
    // Se for editável, usar os exercícios do estado
    const normalizedExercises = editable 
        ? exercises.filter((ex): ex is Exercise => ex !== null && ex.name !== undefined)
        : (workoutDay.exercicios || [])
            .map(normalizeExercise)
            .filter((ex): ex is Exercise => ex !== null && ex.name.trim() !== '');

    // Função para atualizar um exercício
    const updateExercise = (index: number, field: keyof Exercise, value: string) => {
        const updated = [...exercises];
        updated[index] = { ...updated[index], [field]: value };
        setExercises(updated);
        if (onUpdate) {
            onUpdate(updated);
        }
    };

    // Função para adicionar novo exercício
    const addExercise = () => {
        const newExercise: Exercise = { name: '', sets: '', reps: '', tips: '', rest: '' };
        const updated = [...exercises, newExercise];
        setExercises(updated);
        if (onUpdate) {
            onUpdate(updated);
        }
    };

    // Função para remover exercício
    const removeExercise = (index: number) => {
        const updated = exercises.filter((_, i) => i !== index);
        setExercises(updated);
        if (onUpdate) {
            onUpdate(updated);
        }
    };

    // Se não for editável e não houver exercícios válidos, não renderizar tabela
    if (!editable && normalizedExercises.length === 0) {
        return null;
    }
    
    // Se for editável, usar o estado exercises (que já tem uma linha vazia se necessário)
    // Se não for editável, usar normalizedExercises
    const exercisesToRender = editable ? exercises : normalizedExercises;

    // Função para formatar valor - retorna string vazia se não houver valor
    const formatValue = (value: string | undefined | null): string => {
        if (!value || value.trim() === '' || value === '0' || value === '0x' || value === 'x0') {
            return '';
        }
        return value.trim();
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-black dark:border-slate-600 bg-white dark:bg-slate-900 text-sm sm:text-base" style={{ borderWidth: '1px' }}>
                <thead>
                    <tr className="bg-gray-200 dark:bg-slate-700">
                        <th className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-black dark:text-white text-xs sm:text-sm uppercase" style={{ borderWidth: '1px' }}>
                            EXERCÍCIO
                        </th>
                        <th className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-black dark:text-white text-xs sm:text-sm uppercase min-w-[70px]" style={{ borderWidth: '1px' }}>
                            SET
                        </th>
                        <th className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-black dark:text-white text-xs sm:text-sm uppercase min-w-[80px]" style={{ borderWidth: '1px' }}>
                            REPS
                        </th>
                        <th className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold text-black dark:text-white text-xs sm:text-sm uppercase" style={{ borderWidth: '1px' }}>
                            OBS
                        </th>
                        <th className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-black dark:text-white text-xs sm:text-sm uppercase min-w-[100px]" style={{ borderWidth: '1px' }}>
                            INTERVALO
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {exercisesToRender.map((exercise, index) => {
                        const sets = formatValue(exercise.sets);
                        const reps = formatValue(exercise.reps);
                        const obs = formatValue(exercise.tips);
                        const intervalo = formatValue(exercise.rest);

                        return (
                            <tr 
                                key={index}
                            >
                                <td className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-black dark:text-white font-normal text-sm sm:text-base text-left" style={{ borderWidth: '1px' }}>
                                    {editable ? (
                                        <input
                                            type="text"
                                            value={exercise.name || ''}
                                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white"
                                            placeholder="Nome do exercício"
                                        />
                                    ) : (
                                        exercise.name
                                    )}
                                </td>
                                <td className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-black dark:text-slate-300 text-sm sm:text-base text-center" style={{ borderWidth: '1px' }}>
                                    {editable ? (
                                        <input
                                            type="text"
                                            value={exercise.sets || ''}
                                            onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white text-center"
                                            placeholder="SET"
                                        />
                                    ) : (
                                        sets
                                    )}
                                </td>
                                <td className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-black dark:text-slate-300 text-sm sm:text-base text-center" style={{ borderWidth: '1px' }}>
                                    {editable ? (
                                        <input
                                            type="text"
                                            value={exercise.reps || ''}
                                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white text-center"
                                            placeholder="REPS"
                                        />
                                    ) : (
                                        reps
                                    )}
                                </td>
                                <td className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-black dark:text-slate-400 text-xs sm:text-sm text-left" style={{ borderWidth: '1px' }}>
                                    {editable ? (
                                        <input
                                            type="text"
                                            value={exercise.tips || ''}
                                            onChange={(e) => updateExercise(index, 'tips', e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white"
                                            placeholder="Observações"
                                        />
                                    ) : (
                                        obs
                                    )}
                                </td>
                                <td className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2.5 sm:py-3 text-black dark:text-slate-300 text-sm sm:text-base text-center" style={{ borderWidth: '1px' }}>
                                    {editable ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={exercise.rest || ''}
                                                onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                                                className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white text-center"
                                                placeholder="1 min"
                                            />
                                            {editable && (
                                                <button
                                                    onClick={() => removeExercise(index)}
                                                    className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Remover exercício"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        intervalo
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {editable && (
                        <tr>
                            <td colSpan={5} className="border border-black dark:border-slate-600 px-3 sm:px-4 py-2 text-center" style={{ borderWidth: '1px' }}>
                                <button
                                    onClick={addExercise}
                                    className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold"
                                >
                                    + Adicionar Exercício
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

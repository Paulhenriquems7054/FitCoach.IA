import React, { useState } from 'react';
import { Card } from '../ui/Card';
import type { WorkoutDay, Exercise } from '../../types';
import { getExerciseGif } from '../../services/exerciseGifService';

interface WorkoutDayCardProps {
    workoutDay: WorkoutDay;
    dayIndex: number;
    onComplete?: (dayIndex: number) => void;
    isCompleted?: boolean;
    onEdit?: (dayIndex: number) => void;
}

/**
 * Componente para exibir um dia de treino do plano semanal
 * Suporta tanto formato legado (exercícios como string[]) quanto novo (Exercise[])
 */
export const WorkoutDayCard: React.FC<WorkoutDayCardProps> = ({
    workoutDay,
    dayIndex,
    onComplete,
    isCompleted = false,
    onEdit,
}) => {
    const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
    
    const isRestDay = workoutDay.foco_treino.toLowerCase().includes('descanso') || 
                     workoutDay.foco_treino.toLowerCase().includes('rest');
    
    const toggleExerciseGif = (idx: number) => {
        const newExpanded = new Set(expandedExercises);
        if (newExpanded.has(idx)) {
            newExpanded.delete(idx);
        } else {
            newExpanded.add(idx);
        }
        setExpandedExercises(newExpanded);
    };

    // Verificar se exercícios são do tipo Exercise[] ou string[]
    const exercises = workoutDay.exercicios;
    
    // Verificar se é array de objetos (Exercise[]) - suporta múltiplos formatos
    const hasDetailedExercises = exercises.length > 0 && 
        typeof exercises[0] === 'object' && 
        exercises[0] !== null &&
        !Array.isArray(exercises[0]) &&
        ('name' in exercises[0] || 'nome' in exercises[0]);
    
    // Função auxiliar para normalizar exercício (suporta formatos diferentes da IA)
    const normalizeExercise = (ex: any): Exercise => {
        if (typeof ex === 'string') {
            return { name: ex };
        }
        
        // Suporta tanto formato em inglês quanto português
        return {
            name: ex.name || ex.nome || 'Exercício',
            reps: ex.reps || ex.repeticoes || ex.repetitions,
            sets: ex.sets || ex.series,
            tips: ex.tips || ex.dicas || ex.tip,
            calories: ex.calories || ex.calorias,
            rest: ex.rest || ex.descanso || ex.restTime,
        };
    };

    const intensityColors = {
        baixa: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        moderada: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        alta: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };

    return (
        <Card className={`transition-all ${isCompleted ? 'opacity-75' : ''}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {workoutDay.dia_semana}
                            </h3>
                            {workoutDay.intensidade && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    intensityColors[workoutDay.intensidade] || intensityColors.moderada
                                }`}>
                                    {workoutDay.intensidade.toUpperCase()}
                                </span>
                            )}
                            {isCompleted && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                    ✓ CONCLUÍDO
                                </span>
                            )}
                        </div>
                        <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            {workoutDay.foco_treino}
                        </p>
                        {workoutDay.duracao_estimada && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                ⏱️ Duração estimada: {workoutDay.duracao_estimada}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(dayIndex)}
                                className="px-4 py-2 rounded-lg font-semibold text-sm transition bg-primary-500 hover:bg-primary-600 text-white"
                            >
                                ✏️ Editar Plano
                            </button>
                        )}
                        {onComplete && !isRestDay && (
                            <button
                                onClick={() => onComplete(dayIndex)}
                                disabled={isCompleted}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                                    isCompleted
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                            >
                                {isCompleted ? 'Concluído' : 'Marcar como feito'}
                            </button>
                        )}
                    </div>
                </div>

                {isRestDay ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">😌</div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                            Dia de descanso ativo. Descanse, alongue-se ou faça uma caminhada leve.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hasDetailedExercises ? (
                            // Renderizar exercícios detalhados (Exercise[])
                            exercises.map((ex: any, idx: number) => {
                                const exercise = normalizeExercise(ex);
                                const gifPath = getExerciseGif(exercise.name);
                                const isGifExpanded = expandedExercises.has(idx);
                                
                                return (
                                    <div
                                        key={idx}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className={`flex items-stretch gap-4 ${isGifExpanded && gifPath ? 'flex-row flex-wrap sm:flex-nowrap' : 'flex-col'}`}>
                                            <div className={`${isGifExpanded && gifPath ? 'flex-1 min-w-0 sm:min-w-[200px] flex flex-col justify-center' : 'w-full'}`}>
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                                        {exercise.name}
                                                    </h4>
                                                    {gifPath && (
                                                        <button
                                                            onClick={() => toggleExerciseGif(idx)}
                                                            className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition font-medium"
                                                            type="button"
                                                        >
                                                            {isGifExpanded ? '👁️ Ocultar GIF' : '🎬 Ver GIF'}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                    {exercise.reps && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-medium">Repetições:</span> {exercise.reps}
                                                        </span>
                                                    )}
                                                    {exercise.sets && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-medium">Série:</span> {exercise.sets}
                                                        </span>
                                                    )}
                                                    {exercise.rest && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-medium">Descanso:</span> {exercise.rest}
                                                        </span>
                                                    )}
                                                    {exercise.calories && exercise.calories > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            🔥 ~{exercise.calories} kcal
                                                        </span>
                                                    )}
                                                </div>
                                                {exercise.tips && (
                                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                                        💡 {exercise.tips}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {gifPath && isGifExpanded && (
                                                <div className="flex-shrink-0 w-full sm:w-[280px] md:w-[320px] lg:w-[360px] rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center min-h-[150px] sm:min-h-[180px] md:min-h-[220px] lg:min-h-[250px] max-w-full">
                                                    <img
                                                        src={gifPath}
                                                        alt={`Demonstração de ${exercise.name}`}
                                                        className="w-full h-full object-contain"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            console.warn(`GIF não encontrado: ${gifPath}`);
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            // Renderizar exercícios simples (string[])
                            exercises.map((exercise: string | any, idx: number) => {
                                // Se for string, renderizar diretamente
                                if (typeof exercise === 'string') {
                                    const gifPath = getExerciseGif(exercise);
                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-primary-500"
                                        >
                                            <p className="text-slate-700 dark:text-slate-300">{exercise}</p>
                                        </div>
                                    );
                                }
                                
                                // Se for objeto mas não detectado antes, normalizar e renderizar
                                const normalized = normalizeExercise(exercise);
                                const gifPath = getExerciseGif(normalized.name);
                                return (
                                    <div
                                        key={idx}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {normalized.name}
                                            </h4>
                                            {normalized.reps && (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    {normalized.reps}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {workoutDay.observacoes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            📝 <strong>Observação:</strong> {workoutDay.observacoes}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};


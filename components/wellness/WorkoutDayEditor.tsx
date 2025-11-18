import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { XIcon } from '../icons/XIcon';
import type { WorkoutDay, Exercise } from '../../types';
import { getAllAvailableExercises, isExerciseAvailable } from '../../services/exerciseGifService';

interface WorkoutDayEditorProps {
    workoutDay: WorkoutDay;
    dayIndex: number;
    onSave: (dayIndex: number, updatedDay: WorkoutDay) => void;
    onCancel: () => void;
}

interface ExerciseFormData {
    name: string;
    reps: string;
    sets: string;
    rest: string;
    tips: string;
    calories: string;
}

const DAYS_OF_WEEK = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
];

const INTENSITY_OPTIONS: ('baixa' | 'moderada' | 'alta')[] = ['baixa', 'moderada', 'alta'];

/**
 * Componente modal para editar um dia específico do plano de treino
 */
export const WorkoutDayEditor: React.FC<WorkoutDayEditorProps> = ({
    workoutDay,
    dayIndex,
    onSave,
    onCancel,
}) => {
    const [editedDay, setEditedDay] = useState<WorkoutDay>({ ...workoutDay });
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
    const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
    const [exerciseForm, setExerciseForm] = useState<ExerciseFormData>({
        name: '',
        reps: '',
        sets: '',
        rest: '',
        tips: '',
        calories: '',
    });
    const [exerciseSearch, setExerciseSearch] = useState('');

    // Lista de exercícios disponíveis baseados nos GIFs
    const availableExercises = useMemo(() => getAllAvailableExercises(), []);

    // Filtrar exercícios baseado na busca
    const filteredExercises = useMemo(() => {
        if (!exerciseSearch.trim()) return availableExercises.slice(0, 20);
        
        const searchLower = exerciseSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return availableExercises.filter(ex => {
            const exLower = ex.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return exLower.includes(searchLower);
        }).slice(0, 20);
    }, [exerciseSearch, availableExercises]);

    /**
     * Normaliza exercício para garantir formato correto
     */
    const normalizeExercise = (ex: string | Exercise): Exercise => {
        if (typeof ex === 'string') {
            return { name: ex };
        }
        return ex;
    };

    /**
     * Adiciona um exercício ao dia
     */
    const handleAddExercise = () => {
        if (!exerciseForm.name.trim()) {
            alert('Por favor, selecione um exercício da lista');
            return;
        }

        if (!isExerciseAvailable(exerciseForm.name)) {
            alert('Este exercício não possui GIF disponível. Por favor, selecione um exercício da lista.');
            return;
        }

        const newExercise: Exercise = {
            name: exerciseForm.name,
            reps: exerciseForm.reps || undefined,
            sets: exerciseForm.sets || undefined,
            rest: exerciseForm.rest || undefined,
            tips: exerciseForm.tips || undefined,
            calories: exerciseForm.calories ? parseInt(exerciseForm.calories) : undefined,
        };

        const currentExercises = Array.isArray(editedDay.exercicios)
            ? [...editedDay.exercicios]
            : [];
        
        const exercises: Exercise[] = currentExercises.map(normalizeExercise);
        exercises.push(newExercise);

        setEditedDay({
            ...editedDay,
            exercicios: exercises,
        });

        // Reset form
        setExerciseForm({
            name: '',
            reps: '',
            sets: '',
            rest: '',
            tips: '',
            calories: '',
        });
        setExerciseSearch('');
        setShowAddExerciseForm(false);
    };

    /**
     * Remove um exercício
     */
    const handleDeleteExercise = (exerciseIndex: number) => {
        if (window.confirm('Tem certeza que deseja excluir este exercício?')) {
            const exercises = [...(editedDay.exercicios as Exercise[])].map(normalizeExercise);
            exercises.splice(exerciseIndex, 1);
            setEditedDay({
                ...editedDay,
                exercicios: exercises,
            });
        }
    };

    /**
     * Atualiza um exercício
     */
    const handleUpdateExercise = (exerciseIndex: number, updates: Partial<Exercise>) => {
        const exercises = [...(editedDay.exercicios as Exercise[])].map(normalizeExercise);
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
        setEditedDay({
            ...editedDay,
            exercicios: exercises,
        });
        setEditingExerciseIndex(null);
    };

    /**
     * Salva as alterações
     */
    const handleSave = () => {
        onSave(dayIndex, editedDay);
    };

    const exercises = editedDay.exercicios.map(normalizeExercise);
    const isEditingExercise = editingExerciseIndex !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" aria-modal="true" onClick={onCancel}>
            <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 sm:p-4 md:p-6">
                    {/* Cabeçalho */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                                ✏️ Editar {editedDay.dia_semana}
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Edite os exercícios e informações deste dia
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition self-end sm:self-auto flex-shrink-0"
                            aria-label="Fechar"
                        >
                            <XIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                        </button>
                    </div>

                    {/* Informações do dia */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Dia da Semana
                            </label>
                            <select
                                value={editedDay.dia_semana}
                                onChange={(e) => setEditedDay({ ...editedDay, dia_semana: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {DAYS_OF_WEEK.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Foco do Treino
                            </label>
                            <input
                                type="text"
                                value={editedDay.foco_treino}
                                onChange={(e) => setEditedDay({ ...editedDay, foco_treino: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="Ex: Corpo Inteiro, Pernas, Cardio..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Duração Estimada
                                </label>
                                <input
                                    type="text"
                                    value={editedDay.duracao_estimada || ''}
                                    onChange={(e) => setEditedDay({ ...editedDay, duracao_estimada: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Ex: 45 min"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Intensidade
                                </label>
                                <select
                                    value={editedDay.intensidade || 'moderada'}
                                    onChange={(e) => setEditedDay({ ...editedDay, intensidade: e.target.value as 'baixa' | 'moderada' | 'alta' })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    {INTENSITY_OPTIONS.map(intensity => (
                                        <option key={intensity} value={intensity}>
                                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={editedDay.observacoes || ''}
                                onChange={(e) => setEditedDay({ ...editedDay, observacoes: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                rows={3}
                                placeholder="Adicione observações sobre este dia de treino..."
                            />
                        </div>
                    </div>

                    {/* Lista de exercícios */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Exercícios ({exercises.length})
                            </h3>
                            <Button
                                onClick={() => setShowAddExerciseForm(!showAddExerciseForm)}
                                variant="secondary"
                                size="sm"
                            >
                                {showAddExerciseForm ? '❌ Cancelar' : '➕ Adicionar Exercício'}
                            </Button>
                        </div>

                        {/* Formulário de adicionar exercício */}
                        {showAddExerciseForm && (
                            <Card className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome do Exercício * (apenas exercícios com GIF disponível)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={exerciseSearch}
                                                onChange={(e) => {
                                                    const newName = e.target.value;
                                                    setExerciseSearch(newName);
                                                    setExerciseForm({ ...exerciseForm, name: newName });
                                                }}
                                                onFocus={() => setExerciseSearch(exerciseForm.name || '')}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Digite para buscar exercício..."
                                            />
                                            {exerciseSearch && filteredExercises.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredExercises.map((exercise, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setExerciseForm({ ...exerciseForm, name: exercise });
                                                                setExerciseSearch(exercise);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                                                        >
                                                            {exercise}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {exerciseForm.name && !isExerciseAvailable(exerciseForm.name) && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                ⚠️ Este exercício não possui GIF disponível. Selecione um da lista.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Repetições
                                            </label>
                                            <input
                                                type="text"
                                                value={exerciseForm.reps}
                                                onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Ex: 8-10"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Séries
                                            </label>
                                            <input
                                                type="text"
                                                value={exerciseForm.sets}
                                                onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Ex: 4"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Descanso
                                            </label>
                                            <input
                                                type="text"
                                                value={exerciseForm.rest}
                                                onChange={(e) => setExerciseForm({ ...exerciseForm, rest: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Ex: 60s"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Calorias (opcional)
                                            </label>
                                            <input
                                                type="number"
                                                value={exerciseForm.calories}
                                                onChange={(e) => setExerciseForm({ ...exerciseForm, calories: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Ex: 50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Dicas (opcional)
                                        </label>
                                        <textarea
                                            value={exerciseForm.tips}
                                            onChange={(e) => setExerciseForm({ ...exerciseForm, tips: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            rows={2}
                                            placeholder="Dicas para executar o exercício corretamente..."
                                        />
                                    </div>
                                    <Button onClick={handleAddExercise} variant="primary" size="sm">
                                        ➕ Adicionar Exercício
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Lista de exercícios */}
                        <div className="space-y-3">
                            {exercises.map((exercise, idx) => {
                                const isEditing = editingExerciseIndex === idx;
                                
                                return (
                                    <Card key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Nome do Exercício *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={exercise.name}
                                                        onChange={(e) => handleUpdateExercise(idx, { name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Repetições
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exercise.reps || ''}
                                                            onChange={(e) => handleUpdateExercise(idx, { reps: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Séries
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exercise.sets || ''}
                                                            onChange={(e) => handleUpdateExercise(idx, { sets: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Descanso
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exercise.rest || ''}
                                                            onChange={(e) => handleUpdateExercise(idx, { rest: e.target.value })}
                                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Calorias
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={exercise.calories || ''}
                                                            onChange={(e) => handleUpdateExercise(idx, { calories: parseInt(e.target.value) || undefined })}
                                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Dicas
                                                    </label>
                                                    <textarea
                                                        value={exercise.tips || ''}
                                                        onChange={(e) => handleUpdateExercise(idx, { tips: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => setEditingExerciseIndex(null)}
                                                        variant="primary"
                                                        size="sm"
                                                    >
                                                        ✓ Salvar
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteExercise(idx)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        🗑️ Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                                        {exercise.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                        {exercise.reps && (
                                                            <span>Repetições: {exercise.reps}</span>
                                                        )}
                                                        {exercise.sets && (
                                                            <span>Série: {exercise.sets}</span>
                                                        )}
                                                        {exercise.rest && (
                                                            <span>Descanso: {exercise.rest}</span>
                                                        )}
                                                        {exercise.calories && (
                                                            <span>🔥 ~{exercise.calories} kcal</span>
                                                        )}
                                                    </div>
                                                    {exercise.tips && (
                                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                                            💡 {exercise.tips}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <Button
                                                        onClick={() => setEditingExerciseIndex(idx)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        ✏️ Editar
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteExercise(idx)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-4">
                        <Button onClick={onCancel} variant="secondary" size="sm">
                            ❌ Cancelar
                        </Button>
                        <Button onClick={handleSave} variant="primary" size="sm">
                            💾 Salvar Alterações
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};


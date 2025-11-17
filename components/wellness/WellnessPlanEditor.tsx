import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { WellnessPlan, WorkoutDay, Exercise } from '../../types';
import { getExerciseGif, getAllAvailableExercises, isExerciseAvailable } from '../../services/exerciseGifService';

interface WellnessPlanEditorProps {
    plan: WellnessPlan;
    onSave: (editedPlan: WellnessPlan) => void;
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
 * Componente para edição manual do plano de bem-estar
 * Permite adicionar, editar e excluir dias de treino e exercícios
 */
export const WellnessPlanEditor: React.FC<WellnessPlanEditorProps> = ({
    plan,
    onSave,
    onCancel,
}) => {
    const [editedPlan, setEditedPlan] = useState<WellnessPlan>({ ...plan });
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
    const [showAddDayForm, setShowAddDayForm] = useState(false);
    const [showAddExerciseForm, setShowAddExerciseForm] = useState<number | null>(null);
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
        if (!exerciseSearch.trim()) return availableExercises.slice(0, 20); // Mostrar apenas os primeiros 20 se não houver busca
        
        const searchLower = exerciseSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return availableExercises.filter(ex => {
            const exLower = ex.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return exLower.includes(searchLower);
        }).slice(0, 20); // Limitar a 20 resultados
    }, [exerciseSearch, availableExercises]);

    /**
     * Adiciona um novo dia de treino
     */
    const handleAddDay = () => {
        const newDay: WorkoutDay = {
            dia_semana: DAYS_OF_WEEK[editedPlan.plano_treino_semanal.length] || 'Novo Dia',
            foco_treino: 'Novo Treino',
            exercicios: [],
            duracao_estimada: '45 min',
            intensidade: 'moderada',
        };
        setEditedPlan({
            ...editedPlan,
            plano_treino_semanal: [...editedPlan.plano_treino_semanal, newDay],
        });
        setShowAddDayForm(false);
    };

    /**
     * Remove um dia de treino
     */
    const handleDeleteDay = (dayIndex: number) => {
        if (window.confirm('Tem certeza que deseja excluir este dia de treino?')) {
            const newDays = editedPlan.plano_treino_semanal.filter((_, i) => i !== dayIndex);
            setEditedPlan({
                ...editedPlan,
                plano_treino_semanal: newDays,
            });
        }
    };

    /**
     * Atualiza um dia de treino
     */
    const handleUpdateDay = (dayIndex: number, updates: Partial<WorkoutDay>) => {
        const newDays = [...editedPlan.plano_treino_semanal];
        newDays[dayIndex] = { ...newDays[dayIndex], ...updates };
        setEditedPlan({
            ...editedPlan,
            plano_treino_semanal: newDays,
        });
        setEditingDayIndex(null);
    };

    /**
     * Adiciona um exercício a um dia
     */
    const handleAddExercise = (dayIndex: number) => {
        if (!exerciseForm.name.trim()) {
            alert('Por favor, selecione um exercício da lista');
            return;
        }

        // Verificar se o exercício está disponível
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

        const newDays = [...editedPlan.plano_treino_semanal];
        const currentExercises = Array.isArray(newDays[dayIndex].exercicios)
            ? [...newDays[dayIndex].exercicios]
            : [];
        
        // Converter strings para Exercise se necessário
        const exercises: Exercise[] = currentExercises.map(ex => {
            if (typeof ex === 'string') {
                return { name: ex };
            }
            return ex;
        });

        exercises.push(newExercise);
        newDays[dayIndex].exercicios = exercises;

        setEditedPlan({
            ...editedPlan,
            plano_treino_semanal: newDays,
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
        setShowAddExerciseForm(null);
    };

    /**
     * Remove um exercício de um dia
     */
    const handleDeleteExercise = (dayIndex: number, exerciseIndex: number) => {
        if (window.confirm('Tem certeza que deseja excluir este exercício?')) {
            const newDays = [...editedPlan.plano_treino_semanal];
            const exercises = [...(newDays[dayIndex].exercicios as Exercise[])];
            exercises.splice(exerciseIndex, 1);
            newDays[dayIndex].exercicios = exercises;
            setEditedPlan({
                ...editedPlan,
                plano_treino_semanal: newDays,
            });
        }
    };

    /**
     * Atualiza um exercício
     */
    const handleUpdateExercise = (dayIndex: number, exerciseIndex: number, updates: Partial<Exercise>) => {
        const newDays = [...editedPlan.plano_treino_semanal];
        const exercises = [...(newDays[dayIndex].exercicios as Exercise[])];
        exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
        newDays[dayIndex].exercicios = exercises;
        setEditedPlan({
            ...editedPlan,
            plano_treino_semanal: newDays,
        });
        setEditingExerciseIndex(null);
    };

    /**
     * Salva o plano editado
     */
    const handleSave = () => {
        if (window.confirm('Deseja salvar as alterações no plano?')) {
            onSave(editedPlan);
        }
    };

    /**
     * Normaliza exercício para garantir formato correto
     */
    const normalizeExercise = (ex: string | Exercise): Exercise => {
        if (typeof ex === 'string') {
            return { name: ex };
        }
        return ex;
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho com ações */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                ✏️ Editar Plano de Bem-Estar
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Adicione, edite ou remova dias de treino e exercícios
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleSave}
                                variant="primary"
                                size="sm"
                            >
                                💾 Salvar Plano
                            </Button>
                            <Button
                                onClick={onCancel}
                                variant="secondary"
                                size="sm"
                            >
                                ❌ Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Lista de dias de treino */}
            <div className="space-y-4">
                {editedPlan.plano_treino_semanal.map((day, dayIndex) => {
                    const exercises = day.exercicios.map(normalizeExercise);
                    const isEditingDay = editingDayIndex === dayIndex;
                    const isAddingExercise = showAddExerciseForm === dayIndex;

                    return (
                        <Card key={dayIndex}>
                            <div className="p-6">
                                {/* Cabeçalho do dia */}
                                {isEditingDay ? (
                                    <div className="space-y-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Dia da Semana
                                            </label>
                                            <select
                                                value={day.dia_semana}
                                                onChange={(e) => handleUpdateDay(dayIndex, { dia_semana: e.target.value })}
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
                                                value={day.foco_treino}
                                                onChange={(e) => handleUpdateDay(dayIndex, { foco_treino: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="Ex: Corpo Inteiro, Pernas, Cardio..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Duração
                                                </label>
                                                <input
                                                    type="text"
                                                    value={day.duracao_estimada || ''}
                                                    onChange={(e) => handleUpdateDay(dayIndex, { duracao_estimada: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Ex: 45 min"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Intensidade
                                                </label>
                                                <select
                                                    value={day.intensidade || 'moderada'}
                                                    onChange={(e) => handleUpdateDay(dayIndex, { intensidade: e.target.value as 'baixa' | 'moderada' | 'alta' })}
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                >
                                                    {INTENSITY_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Observações
                                            </label>
                                            <textarea
                                                value={day.observacoes || ''}
                                                onChange={(e) => handleUpdateDay(dayIndex, { observacoes: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                rows={2}
                                                placeholder="Observações sobre o treino..."
                                            />
                                        </div>
                                        <Button
                                            onClick={() => setEditingDayIndex(null)}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            ✓ Concluir Edição
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {day.dia_semana}
                                            </h3>
                                            <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                                {day.foco_treino}
                                            </p>
                                            {day.duracao_estimada && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    ⏱️ {day.duracao_estimada}
                                                </p>
                                            )}
                                            {day.intensidade && (
                                                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                                    {day.intensidade.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setEditingDayIndex(dayIndex)}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                ✏️ Editar
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteDay(dayIndex)}
                                                variant="secondary"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                            >
                                                🗑️ Excluir
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de exercícios */}
                                <div className="space-y-3 mt-4">
                                    {exercises.map((exercise, exerciseIndex) => {
                                        const isEditingExercise = editingExerciseIndex === exerciseIndex;
                                        const gifPath = getExerciseGif(exercise.name);

                                        return (
                                            <div
                                                key={exerciseIndex}
                                                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                                            >
                                                {isEditingExercise ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                Nome do Exercício (apenas exercícios com GIF disponível)
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={exerciseSearch || exercise.name}
                                                                    onChange={(e) => {
                                                                        const newName = e.target.value;
                                                                        setExerciseSearch(newName);
                                                                        handleUpdateExercise(dayIndex, exerciseIndex, { name: newName });
                                                                    }}
                                                                    onFocus={() => setExerciseSearch(exercise.name)}
                                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                    placeholder="Digite para buscar exercício..."
                                                                />
                                                                {exerciseSearch && exerciseSearch !== exercise.name && filteredExercises.length > 0 && (
                                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                        {filteredExercises.map((ex, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    handleUpdateExercise(dayIndex, exerciseIndex, { name: ex });
                                                                                    setExerciseSearch(ex);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                                                                            >
                                                                                {ex}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {exercise.name && !isExerciseAvailable(exercise.name) && (
                                                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                                    ⚠️ Este exercício não possui GIF disponível. Selecione um da lista.
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                    Repetições
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={exercise.reps || ''}
                                                                    onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, { reps: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                    placeholder="Ex: 3x12"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                    Séries
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={exercise.sets || ''}
                                                                    onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, { sets: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                    placeholder="Ex: 3"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                    Descanso
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={exercise.rest || ''}
                                                                    onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, { rest: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                    placeholder="Ex: 60s"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                    Calorias
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={exercise.calories || ''}
                                                                    onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, { calories: parseInt(e.target.value) || undefined })}
                                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                    placeholder="Ex: 150"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                                Dicas
                                                            </label>
                                                            <textarea
                                                                value={exercise.tips || ''}
                                                                onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, { tips: e.target.value })}
                                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                rows={2}
                                                                placeholder="Dicas para executar o exercício..."
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={() => {
                                                                setEditingExerciseIndex(null);
                                                                setExerciseSearch('');
                                                            }}
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            ✓ Concluir
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                                                    {exercise.name}
                                                                </h4>
                                                                {gifPath && (
                                                                    <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                                        🎬 GIF disponível
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                                {exercise.reps && (
                                                                    <span>Reps: {exercise.reps}</span>
                                                                )}
                                                                {exercise.sets && (
                                                                    <span>Séries: {exercise.sets}</span>
                                                                )}
                                                                {exercise.rest && (
                                                                    <span>Descanso: {exercise.rest}</span>
                                                                )}
                                                                {exercise.calories && (
                                                                    <span>🔥 {exercise.calories} kcal</span>
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
                                                                onClick={() => setEditingExerciseIndex(exerciseIndex)}
                                                                variant="secondary"
                                                                size="sm"
                                                            >
                                                                ✏️
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteExercise(dayIndex, exerciseIndex)}
                                                                variant="secondary"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                            >
                                                                🗑️
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Formulário para adicionar exercício */}
                                {isAddingExercise ? (
                                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                                            ➕ Adicionar Exercício
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Nome do Exercício * (apenas exercícios com GIF disponível)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={exerciseSearch}
                                                        onChange={(e) => {
                                                            setExerciseSearch(e.target.value);
                                                            if (e.target.value.trim() && filteredExercises.length > 0) {
                                                                // Auto-selecionar se houver apenas um resultado
                                                                if (filteredExercises.length === 1) {
                                                                    setExerciseForm({ ...exerciseForm, name: filteredExercises[0] });
                                                                }
                                                            }
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
                                                                    className="w-full text-left px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                                                                >
                                                                    {exercise}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {exerciseForm.name && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Selecionado: <strong>{exerciseForm.name}</strong>
                                                    </p>
                                                )}
                                                {exerciseSearch && filteredExercises.length === 0 && (
                                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                        Nenhum exercício encontrado. Digite outro nome.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Repetições
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={exerciseForm.reps}
                                                        onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        placeholder="Ex: 3x12"
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
                                                        placeholder="Ex: 3"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
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
                                                        Calorias
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={exerciseForm.calories}
                                                        onChange={(e) => setExerciseForm({ ...exerciseForm, calories: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        placeholder="Ex: 150"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Dicas
                                                </label>
                                                <textarea
                                                    value={exerciseForm.tips}
                                                    onChange={(e) => setExerciseForm({ ...exerciseForm, tips: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    rows={2}
                                                    placeholder="Dicas para executar o exercício..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAddExercise(dayIndex)}
                                                    variant="primary"
                                                    size="sm"
                                                >
                                                    ✓ Adicionar
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setShowAddExerciseForm(null);
                                                        setExerciseForm({
                                                            name: '',
                                                            reps: '',
                                                            sets: '',
                                                            rest: '',
                                                            tips: '',
                                                            calories: '',
                                                        });
                                                        setExerciseSearch('');
                                                    }}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    ❌ Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setShowAddExerciseForm(dayIndex)}
                                        variant="secondary"
                                        size="sm"
                                        className="mt-4"
                                    >
                                        ➕ Adicionar Exercício
                                    </Button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Botão para adicionar novo dia */}
            {!showAddDayForm ? (
                <Button
                    onClick={() => setShowAddDayForm(true)}
                    variant="primary"
                    size="lg"
                    className="w-full"
                >
                    ➕ Adicionar Novo Dia de Treino
                </Button>
            ) : (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            ➕ Adicionar Novo Dia
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Um novo dia de treino será adicionado ao plano.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAddDay}
                                variant="primary"
                                size="sm"
                            >
                                ✓ Adicionar
                            </Button>
                            <Button
                                onClick={() => setShowAddDayForm(false)}
                                variant="secondary"
                                size="sm"
                            >
                                ❌ Cancelar
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};


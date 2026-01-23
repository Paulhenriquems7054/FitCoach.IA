import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { WorkoutExerciseTable } from './WorkoutExerciseTable';
import type { PreconfiguredWorkout, WellnessPlan, WorkoutDay, Exercise, WorkoutCategory } from '../../types';
import { Goal } from '../../types';
import { useToast } from '../ui/Toast';
import { saveWellnessPlan } from '../../services/databaseService';

interface CreateWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workout: PreconfiguredWorkout) => void;
}

const CATEGORIES: WorkoutCategory[] = ['corpo-inteiro', 'hipertrofia', 'emagrecimento', 'definicao', 'forca'];
const LEVELS = ['iniciante', 'intermediario', 'avancado'];
const GOALS = [Goal.PERDER_PESO, Goal.MANTER_PESO, Goal.GANHAR_MASSA];

export const CreateWorkoutModal: React.FC<CreateWorkoutModalProps> = ({
    isOpen,
    onClose,
    onSave,
}) => {
    const { showSuccess, showError } = useToast();
    
    const [workoutName, setWorkoutName] = useState('');
    const [categoria, setCategoria] = useState<WorkoutCategory>('corpo-inteiro');
    const [nivel, setNivel] = useState('intermediario');
    const [objetivo, setObjetivo] = useState<Goal[]>([Goal.GANHAR_MASSA]);
    const [duracaoSemanas, setDuracaoSemanas] = useState(12);
    const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
        {
            dia_semana: 'Segunda-feira',
            foco_treino: 'Treino A',
            exercicios: [],
            duracao_estimada: '60-75 minutos',
            intensidade: 'moderada'
        }
    ]);

    const getGoalLabel = (goal: Goal) => {
        const labels: Record<Goal, string> = {
            [Goal.PERDER_PESO]: 'Emagrecimento',
            [Goal.MANTER_PESO]: 'Manter Peso',
            [Goal.GANHAR_MASSA]: 'Hipertrofia',
        };
        return labels[goal] || goal;
    };

    const handleAddDay = () => {
        const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
        const nextDayIndex = workoutDays.length;
        if (nextDayIndex < dayNames.length) {
            setWorkoutDays([...workoutDays, {
                dia_semana: dayNames[nextDayIndex],
                foco_treino: `Treino ${String.fromCharCode(65 + nextDayIndex)}`,
                exercicios: [],
                duracao_estimada: '60-75 minutos',
                intensidade: 'moderada'
            }]);
        }
    };

    const handleRemoveDay = (index: number) => {
        if (workoutDays.length > 1) {
            setWorkoutDays(workoutDays.filter((_, i) => i !== index));
        }
    };

    const handleUpdateDayExercises = (dayIndex: number, exercises: Exercise[]) => {
        const updatedDays = [...workoutDays];
        updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            exercicios: exercises
        };
        setWorkoutDays(updatedDays);
    };

    const handleToggleGoal = (goal: Goal) => {
        if (objetivo.includes(goal)) {
            if (objetivo.length > 1) {
                setObjetivo(objetivo.filter(g => g !== goal));
            }
        } else {
            setObjetivo([...objetivo, goal]);
        }
    };

    const handleSave = async () => {
        if (!workoutName.trim()) {
            showError('Por favor, informe o nome do treino');
            return;
        }

        if (workoutDays.length === 0) {
            showError('Adicione pelo menos um dia de treino');
            return;
        }

        // Criar plano de bem-estar
        const plan: WellnessPlan = {
            plano_treino_semanal: workoutDays,
            recomendacoes_suplementos: [],
            dicas_adicionais: 'Mantenha boa forma em todos os exercícios. Aumente a carga progressivamente.',
            data_geracao: new Date().toISOString(),
        };

        // Salvar plano
        try {
            await saveWellnessPlan(plan);
        } catch (error) {
            console.error('Erro ao salvar plano:', error);
        }

        // Criar treino pré-configurado
        const newWorkout: PreconfiguredWorkout = {
            id: `custom-${Date.now()}`,
            nome: workoutName,
            categoria,
            nivel,
            objetivo,
            genero: 'unisex',
            duracao_semanas: duracaoSemanas,
            arquivo_origem: 'criado-pelo-usuario',
            data_importacao: new Date().toISOString(),
            versao: 1,
            plano: plan,
        };

        onSave(newWorkout);
        showSuccess('Treino criado com sucesso!');
        
        // Resetar formulário
        setWorkoutName('');
        setCategoria('corpo-inteiro');
        setNivel('intermediario');
        setObjetivo([Goal.GANHAR_MASSA]);
        setDuracaoSemanas(12);
        setWorkoutDays([{
            dia_semana: 'Segunda-feira',
            foco_treino: 'Treino A',
            exercicios: [],
            duracao_estimada: '60-75 minutos',
            intensidade: 'moderada'
        }]);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Criar Novo Treino"
            size="lg"
        >
            <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                        📋 Informações do Treino
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome do Treino *
                            </label>
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                placeholder="Ex: Treino Fullbody"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Categoria
                                </label>
                                <select
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.replace('-', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nível
                                </label>
                                <select
                                    value={nivel}
                                    onChange={(e) => setNivel(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white"
                                >
                                    {LEVELS.map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Objetivo
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GOALS.map(goal => (
                                    <button
                                        key={goal}
                                        type="button"
                                        onClick={() => handleToggleGoal(goal)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                            objetivo.includes(goal)
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {getGoalLabel(goal)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Duração (semanas)
                            </label>
                            <input
                                type="number"
                                value={duracaoSemanas}
                                onChange={(e) => setDuracaoSemanas(parseInt(e.target.value) || 12)}
                                min="1"
                                max="52"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Dias de Treino */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            📅 Dias de Treino
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddDay}
                            disabled={workoutDays.length >= 7}
                        >
                            + Adicionar Dia
                        </Button>
                    </div>
                    <div className="space-y-6">
                        {workoutDays.map((day, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">
                                        {day.dia_semana} - {day.foco_treino}
                                    </h4>
                                    {workoutDays.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveDay(index)}
                                            className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                                <WorkoutExerciseTable
                                    workoutDay={day}
                                    editable={true}
                                    onUpdate={(exercises) => handleUpdateDayExercises(index, exercises)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="flex-1"
                    >
                        ✅ Salvar Treino
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

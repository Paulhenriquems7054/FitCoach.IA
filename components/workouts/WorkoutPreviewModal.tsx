import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { WorkoutExerciseTable } from './WorkoutExerciseTable';
import type { PreconfiguredWorkout } from '../../types';
import { Goal } from '../../types';
import { useToast } from '../ui/Toast';

interface WorkoutPreviewModalProps {
    workout: PreconfiguredWorkout;
    isOpen: boolean;
    onClose: () => void;
    onApply: (workout: PreconfiguredWorkout) => void;
}

export const WorkoutPreviewModal: React.FC<WorkoutPreviewModalProps> = ({
    workout,
    isOpen,
    onClose,
    onApply,
}) => {
    const { showSuccess, showError } = useToast();
    
    // Estados para os campos editáveis
    const [workoutName, setWorkoutName] = useState('');
    const [startDate, setStartDate] = useState('');
    
    // Carregar dados salvos quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            const savedData = loadWorkoutData(workout.id);
            setWorkoutName(savedData.name || '');
            setStartDate(savedData.startDate || '');
        }
    }, [isOpen, workout.id]);
    
    // Função para carregar dados salvos do localStorage
    const loadWorkoutData = (workoutId: string) => {
        try {
            const saved = localStorage.getItem(`workout_${workoutId}_data`);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do treino:', error);
        }
        return { name: '', startDate: '' };
    };
    
    // Função para salvar dados no localStorage
    const handleSave = () => {
        try {
            const dataToSave = {
                name: workoutName,
                startDate: startDate,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(`workout_${workout.id}_data`, JSON.stringify(dataToSave));
            showSuccess('Dados salvos com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar dados do treino:', error);
            showError('Erro ao salvar dados. Tente novamente.');
        }
    };
    const getGoalLabel = (goal: Goal) => {
        const labels: Record<Goal, string> = {
            [Goal.PERDER_PESO]: 'Emagrecimento',
            [Goal.MANTER_PESO]: 'Manter Peso',
            [Goal.GANHAR_MASSA]: 'Hipertrofia',
        };
        return labels[goal] || goal;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={workout.nome}
            size="lg"
        >
            <div className="space-y-6">
                {/* Informações do Treino - Apenas uma vez no topo */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                        📊 Informações do Treino
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-600 dark:text-slate-400">Categoria:</span>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {workout.categoria.replace('-', ' ')}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-600 dark:text-slate-400">Nível:</span>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {workout.nivel}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-600 dark:text-slate-400">Objetivo:</span>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {workout.objetivo.map(getGoalLabel).join(', ')}
                            </p>
                        </div>
                        {workout.duracao_semanas && (
                            <div>
                                <span className="text-slate-600 dark:text-slate-400">Duração:</span>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {workout.duracao_semanas} semanas
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Campos NOME e DATA DE INÍCIO - Apenas uma vez no topo */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-sm font-semibold text-black dark:text-white mb-1">
                            NOME:
                        </label>
                        <input
                            type="text"
                            value={workoutName}
                            onChange={(e) => setWorkoutName(e.target.value)}
                            placeholder="Digite seu nome"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-sm font-semibold text-black dark:text-white mb-1">
                            DATA DE INÍCIO:
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div className="w-full sm:w-auto flex items-end">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            className="w-full sm:w-auto"
                        >
                            💾 Salvar
                        </Button>
                    </div>
                </div>

                {/* Plano Semanal - Exibido em formato de tabela */}
                <div>
                    <div className="space-y-8">
                        {workout.plano.plano_treino_semanal.map((day, index) => {
                            const isRestDay = day.foco_treino.toLowerCase().includes('descanso') || 
                                             day.foco_treino.toLowerCase().includes('rest');
                            
                            // Título do treino baseado no foco ou nome do treino
                            const workoutTitle = day.foco_treino 
                                ? day.foco_treino.toUpperCase()
                                : workout.nome.toUpperCase();
                            
                            // Identificador do treino (ex: "TREINO A")
                            const workoutId = `TREINO ${String.fromCharCode(65 + index)}`; // A, B, C, etc.
                            
                            return (
                                <div 
                                    key={day.dia_semana || index}
                                    className="bg-white dark:bg-slate-800"
                                >
                                    {/* Cabeçalho FORA da tabela - estilo ficha impressa */}
                                    <div className="mb-4">
                                        {/* Título do Treino - estilo ficha impressa */}
                                        <div className="mb-2">
                                            <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                                                {workoutId} - ({day.dia_semana.toLowerCase()})
                                            </h3>
                                        </div>
                                        
                                        {/* Instruções de aquecimento (se houver) */}
                                        {day.duracao_estimada && (
                                            <div className="text-sm text-black dark:text-slate-300 mb-2">
                                                {day.duracao_estimada}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tabela de Exercícios - APENAS exercícios */}
                                    {isRestDay ? (
                                        <div className="text-center py-6 text-slate-600 dark:text-slate-400">
                                            <p className="text-base">Dia de descanso ativo. Descanse, alongue-se ou faça uma caminhada leve.</p>
                                        </div>
                                    ) : (
                                        <WorkoutExerciseTable workoutDay={day} editable={true} />
                                    )}

                                    {/* Notas adicionais abaixo da tabela (se houver) */}
                                    {day.observacoes && (
                                        <div className="mt-4 text-sm text-black dark:text-slate-300">
                                            {day.observacoes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dicas Adicionais */}
                {workout.plano.dicas_adicionais && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-primary-900 dark:text-primary-300 mb-2">
                            💡 Dicas
                        </h3>
                        <p className="text-sm text-primary-700 dark:text-primary-400">
                            {workout.plano.dicas_adicionais}
                        </p>
                    </div>
                )}

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
                        onClick={() => onApply(workout)}
                        className="flex-1"
                    >
                        ✅ Aplicar este Treino
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

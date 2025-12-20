/**
 * Página para Trainer Adicionar Treinos para Alunos
 * Permite que trainers criem e atribuam planos de treino para alunos específicos
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useUser } from '../context/UserContext';
import { useToast } from '../components/ui/Toast';
import { usePermissions } from '../hooks/usePermissions';
import { getStudentsByGymId } from '../services/databaseService';
import { getSupabaseClient } from '../services/supabaseService';
import type { User, WellnessPlan, WorkoutDay, Exercise } from '../types';
import { WellnessPlanEditor } from '../components/wellness/WellnessPlanEditor';
import { logger } from '../utils/logger';

const TrainerWorkoutPage: React.FC = () => {
    const { user: currentUser } = useUser();
    const { showSuccess, showError } = useToast();
    const permissions = usePermissions();
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [workoutPlan, setWorkoutPlan] = useState<WellnessPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Verificar se é trainer
    const isTrainer = currentUser.gymRole === 'trainer';
    const isAdmin = currentUser.gymRole === 'admin' || currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';

    useEffect(() => {
        if (!isTrainer && !isAdmin) {
            setIsLoading(false);
            return;
        }

        loadStudents();
    }, [currentUser.gymId, isTrainer, isAdmin]);

    const loadStudents = async () => {
        if (!currentUser.gymId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const studentsList = await getStudentsByGymId(currentUser.gymId);
            setStudents(studentsList);
        } catch (error) {
            logger.error('Erro ao carregar alunos', 'TrainerWorkoutPage', error);
            showError('Erro ao carregar lista de alunos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        setIsEditing(false);

        // Carregar plano de treino do aluno (se existir)
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('wellness_plans')
                .select('plan_data')
                .eq('user_id', student.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                logger.error('Erro ao carregar plano do aluno', 'TrainerWorkoutPage', error);
            }

            if (data && data.plan_data) {
                setWorkoutPlan(data.plan_data as WellnessPlan);
            } else {
                // Criar plano vazio
                setWorkoutPlan({
                    plano_treino_semanal: [],
                    recomendacoes_suplementos: [],
                    dicas_inteligentes: {},
                });
            }
        } catch (error) {
            logger.error('Erro ao carregar plano', 'TrainerWorkoutPage', error);
            // Criar plano vazio em caso de erro
            setWorkoutPlan({
                plano_treino_semanal: [],
                recomendacoes_suplementos: [],
                dicas_inteligentes: {},
            });
        }
    };

    const handleSaveWorkout = async (plan: WellnessPlan) => {
        if (!selectedStudent) {
            showError('Selecione um aluno primeiro');
            return;
        }

        setIsSaving(true);
        try {
            const supabase = getSupabaseClient();

            // Verificar se já existe plano
            const { data: existingPlan } = await supabase
                .from('wellness_plans')
                .select('id')
                .eq('user_id', selectedStudent.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingPlan) {
                // Atualizar plano existente
                const { error } = await supabase
                    .from('wellness_plans')
                    .update({
                        plan_data: plan,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingPlan.id);

                if (error) throw error;
            } else {
                // Criar novo plano
                const { error } = await supabase
                    .from('wellness_plans')
                    .insert({
                        user_id: selectedStudent.id,
                        plan_data: plan,
                        gym_id: currentUser.gymId || null,
                    });

                if (error) throw error;
            }

            setWorkoutPlan(plan);
            setIsEditing(false);
            showSuccess(`Plano de treino salvo para ${selectedStudent.nome}!`);
        } catch (error: any) {
            logger.error('Erro ao salvar plano de treino', 'TrainerWorkoutPage', error);
            showError(error.message || 'Erro ao salvar plano de treino');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateNewPlan = () => {
        setWorkoutPlan({
            plano_treino_semanal: [],
            recomendacoes_suplementos: [],
            dicas_inteligentes: {},
        });
        setIsEditing(true);
    };

    if (!isTrainer && !isAdmin) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Alert type="error" title="Acesso Negado">
                    Você não tem permissão para acessar esta página. Apenas treinadores e administradores podem criar planos de treino.
                </Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Card>
                    <div className="p-6 text-center">
                        <p className="text-slate-600 dark:text-slate-400">Carregando alunos...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    💪 Criar Plano de Treino para Aluno
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Selecione um aluno e crie um plano de treino personalizado
                </p>
            </div>

            {/* Lista de Alunos */}
            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Selecione um Aluno
                    </h2>
                    {students.length === 0 ? (
                        <Alert type="info" title="Nenhum aluno encontrado">
                            Não há alunos cadastrados na sua academia ainda.
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {students.map((student) => (
                                <button
                                    key={student.id || student.username}
                                    onClick={() => handleSelectStudent(student)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                        selectedStudent?.id === student.id || selectedStudent?.username === student.username
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                                    }`}
                                >
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                        {student.nome}
                                    </div>
                                    {student.matricula && (
                                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Matrícula: {student.matricula}
                                        </div>
                                    )}
                                    {student.objetivo && (
                                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                            Objetivo: {student.objetivo}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Editor de Plano de Treino */}
            {selectedStudent && (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Plano de Treino: {selectedStudent.nome}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {workoutPlan && workoutPlan.plano_treino_semanal.length > 0
                                        ? 'Plano existente - Clique em Editar para modificar'
                                        : 'Nenhum plano criado ainda'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={handleCreateNewPlan}
                                        >
                                            {workoutPlan && workoutPlan.plano_treino_semanal.length > 0
                                                ? '✏️ Editar Plano'
                                                : '➕ Criar Novo Plano'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isEditing && workoutPlan ? (
                            <WellnessPlanEditor
                                plan={workoutPlan}
                                onSave={handleSaveWorkout}
                                onCancel={() => {
                                    setIsEditing(false);
                                    // Recarregar plano original
                                    handleSelectStudent(selectedStudent);
                                }}
                            />
                        ) : workoutPlan && workoutPlan.plano_treino_semanal.length > 0 ? (
                            <div className="space-y-4">
                                {workoutPlan.plano_treino_semanal.map((day, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                                    >
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                            {day.dia_semana} - {day.foco_treino}
                                        </h3>
                                        {day.duracao_estimada && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                                Duração: {day.duracao_estimada}
                                            </p>
                                        )}
                                        <ul className="list-disc list-inside space-y-1">
                                            {Array.isArray(day.exercicios) && day.exercicios.map((exercise, exIndex) => {
                                                if (typeof exercise === 'string') {
                                                    return (
                                                        <li key={exIndex} className="text-slate-700 dark:text-slate-300">
                                                            {exercise}
                                                        </li>
                                                    );
                                                } else {
                                                    return (
                                                        <li key={exIndex} className="text-slate-700 dark:text-slate-300">
                                                            <strong>{exercise.name}</strong>
                                                            {exercise.reps && ` - ${exercise.reps}`}
                                                            {exercise.tips && ` (${exercise.tips})`}
                                                        </li>
                                                    );
                                                }
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Alert type="info" title="Nenhum plano criado">
                                Clique em "Criar Novo Plano" para começar a criar um plano de treino para este aluno.
                            </Alert>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TrainerWorkoutPage;


import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';
import { WorkoutGrid } from '../components/workouts/WorkoutGrid';
import { WorkoutFilters } from '../components/workouts/WorkoutFilters';
import { WorkoutPreviewModal } from '../components/workouts/WorkoutPreviewModal';
import { CreateWorkoutModal } from '../components/workouts/CreateWorkoutModal';
import { buildWorkoutCatalog, filterWorkouts } from '../services/workoutCatalogService';
import { 
    saveWellnessPlan,
    addFavoriteWorkout,
    removeFavoriteWorkout,
    isFavoriteWorkout,
    getFavoriteWorkouts,
    addWorkoutToHistory,
    getWorkoutHistory,
    initDatabase
} from '../services/databaseService';
import { getUserPreconfiguredWorkouts } from '../services/preconfiguredWorkoutService';
import { useToast } from '../components/ui/Toast';
import { useRouter } from '../hooks/useRouter';
import { useUser } from '../context/UserContext';
import type { PreconfiguredWorkout, WorkoutFilters as WorkoutFiltersType } from '../types';
import { logger } from '../utils/logger';

const PreconfiguredWorkoutsPage: React.FC = () => {
    const { navigate } = useRouter();
    const { showSuccess, showError, showWarning } = useToast();
    const { user } = useUser();
    const [workouts, setWorkouts] = useState<PreconfiguredWorkout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<PreconfiguredWorkout | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filters, setFilters] = useState<WorkoutFiltersType>({});
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<Array<{ workoutId: string; workoutName: string; appliedAt: string }>>([]);

    // Carregar catálogo, favoritos e histórico
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Garantir que o banco está inicializado
                await initDatabase();
                
                // Carregar catálogo de treinos padrão
                const catalog = await buildWorkoutCatalog();
                let allWorkouts = [...catalog.treinos];
                
                // Carregar treinos criados pelo usuário do Supabase
                try {
                    if (user?.id) {
                        const userWorkouts = await getUserPreconfiguredWorkouts(user.id);
                        // Adicionar treinos do usuário ao início da lista
                        allWorkouts = [...userWorkouts, ...allWorkouts];
                        logger.info(`Carregados ${userWorkouts.length} treinos criados pelo usuário`, 'PreconfiguredWorkoutsPage');
                    }
                } catch (supabaseError) {
                    logger.warn('Erro ao carregar treinos do Supabase, continuando apenas com catálogo', 'PreconfiguredWorkoutsPage', supabaseError);
                    // Continuar mesmo se falhar ao carregar do Supabase
                }
                
                setWorkouts(allWorkouts);

                // Carregar favoritos
                try {
                    const favorites = await getFavoriteWorkouts();
                    const favoriteSet = new Set<string>();
                    for (const fav of favorites) {
                        const workout = fav as PreconfiguredWorkout;
                        if (workout?.id) {
                            favoriteSet.add(workout.id);
                        }
                    }
                    setFavoriteIds(favoriteSet);
                } catch (favError) {
                    logger.warn('Erro ao carregar favoritos', 'PreconfiguredWorkoutsPage', favError);
                    // Continuar mesmo se favoritos falharem
                }

                // Carregar histórico
                try {
                    const historyData = await getWorkoutHistory(10);
                    setHistory(historyData.map(h => ({
                        workoutId: h.workoutId,
                        workoutName: h.workoutName,
                        appliedAt: h.appliedAt
                    })));
                } catch (historyError) {
                    logger.warn('Erro ao carregar histórico', 'PreconfiguredWorkoutsPage', historyError);
                    // Continuar mesmo se histórico falhar
                }
            } catch (err) {
                logger.error('Erro ao carregar dados', 'PreconfiguredWorkoutsPage', err);
                // Mesmo com erro, tentar carregar favoritos e histórico
                try {
                    const favorites = await getFavoriteWorkouts();
                    const favoriteSet = new Set<string>();
                    for (const fav of favorites) {
                        const workout = fav as PreconfiguredWorkout;
                        if (workout?.id) {
                            favoriteSet.add(workout.id);
                        }
                    }
                    setFavoriteIds(favoriteSet);
                } catch (favError) {
                    logger.warn('Erro ao carregar favoritos', 'PreconfiguredWorkoutsPage', favError);
                }
                
                // Se não conseguiu carregar treinos, mostrar erro mas permitir tentar novamente
                setError('Erro ao carregar treinos. Clique em "Tentar Novamente" para recarregar.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Filtrar treinos
    const filteredWorkouts = useMemo(() => {
        let filtered = filterWorkouts(workouts, filters);
        
        // Filtrar por favoritos se ativo
        if (showFavoritesOnly) {
            filtered = filtered.filter(w => favoriteIds.has(w.id));
        }
        
        return filtered;
    }, [workouts, filters, showFavoritesOnly, favoriteIds]);

    // Handlers
    const handlePreview = (workout: PreconfiguredWorkout) => {
        setSelectedWorkout(workout);
        setShowPreviewModal(true);
    };

    const handleApply = async (workout: PreconfiguredWorkout) => {
        try {
            // Confirmar antes de aplicar
            const confirmed = window.confirm(
                'Deseja substituir seu plano atual por este treino?'
            );

            if (!confirmed) {
                return;
            }

            // Salvar plano
            await saveWellnessPlan(workout.plano);
            
            // Adicionar ao histórico
            try {
                await addWorkoutToHistory(workout.id, workout.nome, workout);
                // Atualizar histórico local
                setHistory(prev => [
                    { workoutId: workout.id, workoutName: workout.nome, appliedAt: new Date().toISOString() },
                    ...prev.slice(0, 9)
                ]);
            } catch (historyError) {
                logger.warn('Erro ao salvar histórico', 'PreconfiguredWorkoutsPage', historyError);
            }
            
            showSuccess('Treino aplicado com sucesso!');
            setShowPreviewModal(false);
            
            // Redirecionar para página de treino
            setTimeout(() => {
                navigate('/wellness');
            }, 1000);
        } catch (err) {
            logger.error('Erro ao aplicar treino', 'PreconfiguredWorkoutsPage', err);
            showError('Erro ao aplicar treino. Tente novamente.');
        }
    };

    const handleToggleFavorite = async (workout: PreconfiguredWorkout) => {
        try {
            const isFavorite = favoriteIds.has(workout.id);
            
            if (isFavorite) {
                await removeFavoriteWorkout(workout.id);
                setFavoriteIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(workout.id);
                    return newSet;
                });
                showSuccess('Treino removido dos favoritos');
            } else {
                await addFavoriteWorkout(workout.id, workout);
                setFavoriteIds(prev => new Set(prev).add(workout.id));
                showSuccess('Treino adicionado aos favoritos');
            }
        } catch (err) {
            logger.error('Erro ao atualizar favorito', 'PreconfiguredWorkoutsPage', err);
            showError('Erro ao atualizar favorito. Tente novamente.');
        }
    };

    const handleSelect = (workout: PreconfiguredWorkout) => {
        handleApply(workout);
    };

    const handleCreateWorkout = async (newWorkout: PreconfiguredWorkout) => {
        try {
            let savedWorkout = newWorkout;
            
            // Salvar no Supabase se o usuário estiver autenticado
            if (user?.id) {
                try {
                    const { savePreconfiguredWorkout } = await import('../services/preconfiguredWorkoutService');
                    const workoutId = await savePreconfiguredWorkout(
                        newWorkout,
                        user.id,
                        user.gymId || null
                    );
                    // Atualizar o ID do treino com o UUID retornado do Supabase
                    savedWorkout = {
                        ...newWorkout,
                        id: workoutId
                    };
                    logger.info('Treino salvo no Supabase com sucesso', 'PreconfiguredWorkoutsPage');
                } catch (supabaseError) {
                    logger.error('Erro ao salvar treino no Supabase', 'PreconfiguredWorkoutsPage', supabaseError);
                    // Continuar mesmo se falhar ao salvar no Supabase (salvar localmente)
                    showWarning('Treino criado localmente, mas houve erro ao salvar na nuvem.');
                }
            } else {
                logger.warn('Usuário não autenticado, treino salvo apenas localmente', 'PreconfiguredWorkoutsPage');
            }
            
            // Adicionar o novo treino à lista
            setWorkouts(prev => [savedWorkout, ...prev]);
            setShowCreateModal(false);
            showSuccess('Treino criado com sucesso!');
        } catch (err) {
            logger.error('Erro ao criar treino', 'PreconfiguredWorkoutsPage', err);
            showError('Erro ao criar treino. Tente novamente.');
        }
    };


    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="p-6">
                                <Skeleton className="h-6 w-2/3 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6 mb-4" />
                                <Skeleton className="h-10 w-full" />
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="error" title="Erro">
                    {error}
                </Alert>
                <div className="mt-4 flex gap-3">
                    <Button onClick={() => {
                        setError(null);
                        setIsLoading(true);
                        // Recarregar dados
                        const loadData = async () => {
                            try {
                                const catalog = await buildWorkoutCatalog();
                                let allWorkouts = [...catalog.treinos];
                                
                                // Carregar treinos criados pelo usuário do Supabase
                                if (user?.id) {
                                    try {
                                        const userWorkouts = await getUserPreconfiguredWorkouts(user.id);
                                        allWorkouts = [...userWorkouts, ...allWorkouts];
                                    } catch (supabaseError) {
                                        logger.warn('Erro ao carregar treinos do Supabase', 'PreconfiguredWorkoutsPage', supabaseError);
                                    }
                                }
                                
                                setWorkouts(allWorkouts);
                                setError(null);
                            } catch (err) {
                                logger.error('Erro ao recarregar dados', 'PreconfiguredWorkoutsPage', err);
                                setError('Erro ao carregar treinos. Tente novamente mais tarde.');
                            } finally {
                                setIsLoading(false);
                            }
                        };
                        loadData();
                    }}>
                        Tentar Novamente
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/wellness')}>
                        Voltar para Meu Plano
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            📚 Treinos Pré-Configurados
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Escolha um treino pronto e aplique ao seu plano
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowCreateModal(true)}
                        >
                            ➕ Criar Novo Treino
                        </Button>
                        <Button
                            variant={showFavoritesOnly ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        >
                            ⭐ {showFavoritesOnly ? 'Todos' : 'Favoritos'} ({favoriteIds.size})
                        </Button>
                        <Button
                            variant={showHistory ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            📜 Histórico ({history.length})
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/wellness')}
                        >
                            ← Voltar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filtros */}
                <div className="lg:col-span-1">
                    <WorkoutFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        availableCategories={Array.from(new Set(workouts.map(w => w.categoria)))}
                    />
                </div>

                {/* Grid de Treinos ou Histórico */}
                <div className="lg:col-span-3">
                    {showHistory ? (
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                📜 Histórico de Treinos Aplicados
                            </h2>
                            {history.length === 0 ? (
                                <p className="text-slate-600 dark:text-slate-400">
                                    Nenhum treino aplicado ainda.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => {
                                        const workout = workouts.find(w => w.id === item.workoutId);
                                        if (!workout) return null;
                                        
                                        return (
                                            <div
                                                key={item.workoutId}
                                                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                                onClick={() => handlePreview(workout)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                                            {item.workoutName}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            Aplicado em {new Date(item.appliedAt).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePreview(workout);
                                                        }}
                                                    >
                                                        Ver
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    ) : (
                        <>
                            <div className="mb-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'treino encontrado' : 'treinos encontrados'}
                                </p>
                            </div>
                            <WorkoutGrid
                                workouts={filteredWorkouts}
                                onSelect={handleSelect}
                                onPreview={handlePreview}
                                favoriteIds={favoriteIds}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Preview */}
            {selectedWorkout && (
                <WorkoutPreviewModal
                    workout={selectedWorkout}
                    isOpen={showPreviewModal}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedWorkout(null);
                    }}
                    onApply={handleApply}
                />
            )}

            {/* Modal de Criar Novo Treino */}
            <CreateWorkoutModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateWorkout}
            />
        </div>
    );
};

export default PreconfiguredWorkoutsPage;

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { getAvailableExercisesByGroup, getAvailableExercisesWithGifPaths } from '../services/exerciseGifService';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { ExerciseGrid } from '../components/exercises/ExerciseGrid';
import { ExerciseDetailsModal } from '../components/exercises/ExerciseDetailsModal';
import { SimpleGifDisplay } from '../components/ui/SimpleGifDisplay';
import type { ExerciseInfo } from '../types/exercise';

const LibraryPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Log sempre que a página é montada
    React.useEffect(() => {
        console.log('[LibraryPage] 🎯 Página Biblioteca foi montada/carregada');
    }, []);

    // Obter exercícios agrupados por grupo muscular (para filtros)
    const exercisesByGroup = useMemo(() => {
        try {
            console.log('[LibraryPage] 🔄 Chamando getAvailableExercisesByGroup()...');
            const result = getAvailableExercisesByGroup();
            console.log('[LibraryPage] ✅ getAvailableExercisesByGroup() retornou:', Object.keys(result).length, 'grupos');
            return result;
        } catch (error) {
            console.error('[LibraryPage] ❌ Erro ao chamar getAvailableExercisesByGroup():', error);
            return {} as Record<string, string[]>;
        }
    }, []) as Record<string, string[]>;
    
    // NOVA ABORDAGEM: Obter exercícios com GIFs já construídos diretamente
    // Isso garante que TODOS os GIFs sejam encontrados, sem depender de matching inteligente
    const allExercises = useMemo(() => {
        try {
            console.log('[LibraryPage] 🔄 Chamando getAvailableExercisesWithGifPaths()...');
            const exercises = getAvailableExercisesWithGifPaths();
            
            if (import.meta.env.DEV) {
                console.log(`[LibraryPage] ✅ Total de exercícios obtidos: ${exercises.length}`);
                const exercisesWithGif = exercises.filter(ex => ex.gifPath).length;
                const exercisesWithoutGif = exercises.filter(ex => !ex.gifPath).length;
                console.log(`[LibraryPage] Exercícios com GIF: ${exercisesWithGif}, sem GIF: ${exercisesWithoutGif}`);
                
                if (exercisesWithoutGif > 0) {
                    console.warn(`[LibraryPage] ⚠️ ${exercisesWithoutGif} exercícios sem GIF!`);
                } else {
                    console.log(`[LibraryPage] 🎉 Todos os exercícios têm GIF!`);
                }
            }
            
            return exercises;
        } catch (error) {
            console.error('[LibraryPage] ❌ Erro ao obter exercícios:', error);
            return [];
        }
    }, []);

    // Filtrar exercícios
    const filteredExercises = useMemo(() => {
        let filtered = allExercises;

        // Filtro por grupo muscular (se selecionado)
        if (selectedGroup && selectedGroup.trim() !== '') {
            filtered = filtered.filter(ex => ex.muscleGroup === selectedGroup);
        }

        // Filtro por busca (funciona mesmo sem grupo selecionado)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            filtered = filtered.filter(ex => {
                const name = ex.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const group = ex.muscleGroup.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return name.includes(query) || group.includes(query);
            });
        }

        return filtered;
    }, [allExercises, selectedGroup, searchQuery]);

    // Obter lista de grupos musculares
    const muscleGroups = useMemo(() => {
        const groups: string[] = Array.from(new Set(allExercises.map(ex => ex.muscleGroup)));
        return groups.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [allExercises]);

    // Quando um grupo é selecionado, selecionar automaticamente o primeiro exercício
    useEffect(() => {
        if (selectedGroup && selectedGroup.trim() !== '' && filteredExercises.length > 0) {
            // Se não há exercício selecionado ou o exercício selecionado não está na lista filtrada
            const isSelectedInList = selectedExercise && filteredExercises.some(ex => ex.name === selectedExercise.name);
            if (!isSelectedInList) {
                setSelectedExercise(filteredExercises[0]);
            }
        } else {
            setSelectedExercise(null);
        }
    }, [selectedGroup, filteredExercises]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    💪 Biblioteca de Exercícios
                </h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">
                    Explore {allExercises.length} exercícios com GIFs animados e explicações detalhadas
                </p>
            </div>

            {/* Filtros */}
            <div className="mb-6 sm:mb-8 space-y-4">
                {/* Busca */}
                <div className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                // Se houver busca e não houver grupo selecionado, selecionar o primeiro grupo dos resultados
                                if (searchQuery.trim() && filteredExercises.length > 0 && !selectedGroup) {
                                    const firstGroup = filteredExercises[0].muscleGroup;
                                    setSelectedGroup(firstGroup);
                                }
                            }
                        }}
                        placeholder="Buscar exercício por nome..."
                        className="w-full pl-12 pr-4 py-3 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {/* Botão de Lupa */}
                    <button
                        type="button"
                        onClick={() => {
                            // Se houver busca e não houver grupo selecionado, selecionar o primeiro grupo dos resultados
                            if (searchQuery.trim() && filteredExercises.length > 0 && !selectedGroup) {
                                const firstGroup = filteredExercises[0].muscleGroup;
                                setSelectedGroup(firstGroup);
                            }
                        }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                        aria-label="Buscar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>

                {/* Filtro por grupo muscular */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {muscleGroups.map(group => {
                        const count = allExercises.filter(ex => ex.muscleGroup === group).length;
                        return (
                            <button
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    selectedGroup === group
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {group} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Resultados */}
            {(!selectedGroup || selectedGroup.trim() === '') && !searchQuery.trim() ? (
                /* Mensagem inicial quando nenhum grupo está selecionado e não há busca */
                <Card>
                    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                        <BookOpenIcon className="w-20 h-20 text-primary-500 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Selecione um Grupo Muscular
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">
                            Clique em um dos grupos musculares acima para visualizar os exercícios disponíveis com seus GIFs animados e descrições detalhadas.
                        </p>
                    </div>
                </Card>
            ) : (
                /* Lista única de exercícios quando um grupo específico está selecionado ou há busca */
                filteredExercises.length > 0 ? (
                    <div className="max-w-4xl mx-auto">
                        <Card className="overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {selectedGroup || 'Resultados da Busca'} ({filteredExercises.length})
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Clique em um exercício para ver o GIF animado
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[600px]">
                                <div className="space-y-2 p-4">
                                    {filteredExercises.map((exercise, index) => (
                                        <button
                                            key={`${exercise.name}-${index}`}
                                            onClick={() => {
                                                setSelectedExercise(exercise);
                                                // Abrir modal automaticamente ao clicar no exercício
                                                setShowModal(true);
                                            }}
                                            disabled={showModal}
                                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                                                showModal 
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : selectedExercise?.name === exercise.name
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* GIF Thumbnail - oculto quando modal está aberto */}
                                                {exercise.gifPath && !showModal && (
                                                    <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                                                        <SimpleGifDisplay
                                                            src={exercise.gifPath}
                                                            alt={exercise.name}
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                )}
                                                {/* Placeholder quando modal está aberto */}
                                                {showModal && (
                                                    <div className="flex-shrink-0 w-16 h-16 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                {/* Nome do Exercício */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                        {exercise.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {exercise.muscleGroup}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
                            <BookOpenIcon className="w-16 h-16 text-primary-500" />
                            <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
                                Nenhum exercício encontrado
                            </h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">
                                Tente ajustar os filtros ou fazer uma nova busca.
                            </p>
                        </div>
                    </Card>
                )
            )}

            {/* Modal de detalhes do exercício com GIF - abre apenas quando o botão "Ver GIF Animado" é clicado */}
            {selectedExercise && (
                <ExerciseDetailsModal
                    exercise={selectedExercise}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        // Não limpar selectedExercise para manter a seleção na lista
                    }}
                />
            )}
        </div>
    );
};

export default LibraryPage;

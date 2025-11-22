import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { getAvailableExercisesByGroup, getExerciseGif } from '../services/exerciseGifService';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';

interface ExerciseInfo {
    name: string;
    gifPath: string | null;
    muscleGroup: string;
}

const ExerciseCard: React.FC<{ exercise: ExerciseInfo }> = ({ exercise }) => {
    const [showGif, setShowGif] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    // Debug: verificar se gifPath está definido
    // console.log('Exercise:', exercise.name, 'GIF Path:', exercise.gifPath);

    // Gerar descrição básica baseada no nome do exercício
    // IMPORTANTE: Verificar keywords mais específicas primeiro
    const getExerciseDescription = (name: string): string => {
        const lower = name.toLowerCase();
        
        // Verificar panturrilha PRIMEIRO (antes de "elevação" genérica)
        if (lower.includes('panturrilha') || lower.includes('panturrinha') || 
            lower.includes('flexão plantar') || lower.includes('flexao plantar') ||
            lower.includes('elevação de panturrilha') || lower.includes('elevacao de panturrilha') ||
            lower.includes('levantamento de panturrilha') || lower.includes('gêmeos') || lower.includes('gemeos')) {
            return 'Exercício de isolamento para desenvolvimento das panturrilhas (gêmeos). Essencial para completar o desenvolvimento das pernas e melhorar estabilidade.';
        } else if (lower.includes('agachamento')) {
            return 'Exercício composto que trabalha principalmente quadríceps, glúteos e posterior de coxa. Excelente para desenvolvimento de força e massa muscular nas pernas.';
        } else if (lower.includes('supino')) {
            return 'Exercício fundamental para desenvolvimento do peitoral, além de trabalhar tríceps e deltoides anteriores. Pode ser executado com barra ou halteres.';
        } else if (lower.includes('remada') || lower.includes('remo')) {
            return 'Exercício essencial para desenvolvimento das costas, trabalhando latíssimo do dorso, romboides e trapézio. Melhora a postura e força de tração.';
        } else if (lower.includes('puxada')) {
            return 'Exercício de puxada vertical que desenvolve principalmente o latíssimo do dorso e bíceps. Fundamental para largura das costas.';
        } else if (lower.includes('rosca')) {
            return 'Exercício de isolamento para desenvolvimento dos bíceps. Pode ser executado com barra, halteres ou cabo em diferentes variações.';
        } else if (lower.includes('tríceps')) {
            return 'Exercício de isolamento para desenvolvimento dos tríceps. Essencial para volume e definição dos braços.';
        } else if (lower.includes('desenvolvimento')) {
            return 'Exercício para desenvolvimento dos deltoides (ombros). Pode ser executado sentado ou em pé, com barra ou halteres.';
        } else if (lower.includes('elevação pélvica') || lower.includes('elevacao pelvica')) {
            return 'Exercício para desenvolvimento dos glúteos e posterior de coxa. Melhora força e estabilidade do quadril.';
        } else if (lower.includes('elevação') || lower.includes('elevacao')) {
            // Verificar se não é panturrilha (já verificado acima)
            if (!lower.includes('panturrilha') && !lower.includes('panturrinha')) {
                return 'Exercício de isolamento para ombros, trabalhando deltoides anterior, lateral ou posterior dependendo da variação.';
            }
        } else if (lower.includes('abdominal') || lower.includes('prancha')) {
            return 'Exercício para fortalecimento do core (abdômen). Melhora estabilidade, postura e força funcional.';
        } else if (lower.includes('leg press')) {
            return 'Exercício de pernas realizado em máquina. Trabalha quadríceps, glúteos e posterior de coxa com segurança e controle.';
        } else if (lower.includes('cardio') || lower.includes('esteira') || lower.includes('bicicleta')) {
            return 'Exercício cardiovascular que melhora condicionamento físico, queima calorias e fortalece o sistema cardiovascular.';
        } else if (lower.includes('stiff') || lower.includes('levantamento terra')) {
            return 'Exercício composto que trabalha posterior de coxa, glúteos e eretores da espinha. Excelente para força e desenvolvimento posterior.';
        } else if (lower.includes('crucifixo')) {
            return 'Exercício de isolamento para o peitoral, trabalhando principalmente as fibras internas do músculo.';
        } else if (lower.includes('voador')) {
            return 'Exercício de isolamento para peitoral realizado em máquina ou com halteres. Trabalha principalmente a parte interna do peito.';
        } else if (lower.includes('barra fixa')) {
            return 'Exercício de peso corporal para desenvolvimento das costas e bíceps. Desafio fundamental para força de tração.';
        } else {
            return 'Exercício de musculação que contribui para o desenvolvimento muscular e força. Execute com técnica adequada para melhores resultados.';
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-primary-700 dark:text-primary-400 flex-1">
                        {exercise.name}
                    </h3>
                    {exercise.gifPath && (
                        <button
                            onClick={() => setShowGif(!showGif)}
                            className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                            type="button"
                        >
                            {showGif ? '👁️ Ocultar GIF' : '🎬 Ver GIF'}
                        </button>
                    )}
                </div>
                
                <div className="mb-3">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {exercise.muscleGroup}
                    </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {getExerciseDescription(exercise.name)}
                </p>

                {exercise.gifPath && showGif && !imageError && (
                    <div className="mt-4 rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-900 shadow-lg">
                        <img
                            src={exercise.gifPath}
                            alt={`Demonstração de ${exercise.name}`}
                            className="w-full h-auto max-h-[300px] object-contain"
                            loading="lazy"
                            onError={() => {
                                setImageError(true);
                            }}
                        />
                    </div>
                )}

                {imageError && exercise.gifPath && (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 text-center">
                        GIF não disponível no momento
                    </div>
                )}
            </div>
        </Card>
    );
};

const LibraryPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');

    // Obter exercícios agrupados por grupo muscular
    const exercisesByGroup = useMemo(() => getAvailableExercisesByGroup(), []);
    
    // Preparar lista de exercícios com informações completas
    const allExercises = useMemo(() => {
        const exercises: ExerciseInfo[] = [];
        
        for (const [groupName, exerciseNames] of Object.entries(exercisesByGroup)) {
            for (const exerciseName of exerciseNames) {
                const gifPath = getExerciseGif(exerciseName);
                exercises.push({
                    name: exerciseName,
                    gifPath,
                    muscleGroup: groupName,
                });
            }
        }
        
        return exercises.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }, [exercisesByGroup]);

    // Filtrar exercícios
    const filteredExercises = useMemo(() => {
        let filtered = allExercises;

        // Filtro por grupo muscular
        if (selectedGroup !== 'all') {
            filtered = filtered.filter(ex => ex.muscleGroup === selectedGroup);
        }

        // Filtro por busca
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
        const groups = Array.from(new Set(allExercises.map(ex => ex.muscleGroup)));
        return groups.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [allExercises]);

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
                <div className="max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar exercício por nome..."
                        className="w-full px-4 py-3 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                {/* Filtro por grupo muscular */}
                <div className="flex flex-wrap gap-2 justify-center">
                    <button
                        onClick={() => setSelectedGroup('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            selectedGroup === 'all'
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        Todos ({allExercises.length})
                    </button>
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
            <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    {filteredExercises.length === 0 
                        ? 'Nenhum exercício encontrado'
                        : `Mostrando ${filteredExercises.length} exercício${filteredExercises.length !== 1 ? 's' : ''}`
                    }
                </p>
            </div>

            {/* Grid de exercícios */}
            {filteredExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredExercises.map((exercise, index) => (
                        <ExerciseCard key={`${exercise.name}-${index}`} exercise={exercise} />
                    ))}
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
            )}
        </div>
    );
};

export default LibraryPage;

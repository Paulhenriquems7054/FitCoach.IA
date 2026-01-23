import React from 'react';
import { Card } from '../ui/Card';
import type { WorkoutFilters as WorkoutFiltersType, WorkoutCategory, Goal } from '../../types';
import { Goal as GoalEnum } from '../../types';

interface WorkoutFiltersProps {
    filters: WorkoutFiltersType;
    onFilterChange: (filters: WorkoutFiltersType) => void;
    availableCategories: WorkoutCategory[];
}

export const WorkoutFilters: React.FC<WorkoutFiltersProps> = ({
    filters,
    onFilterChange,
    availableCategories,
}) => {
    const updateFilter = <K extends keyof WorkoutFiltersType>(
        key: K,
        value: WorkoutFiltersType[K]
    ) => {
        onFilterChange({
            ...filters,
            [key]: value,
        });
    };

    const clearFilters = () => {
        onFilterChange({
            categoria: undefined,
            objetivo: undefined,
            genero: undefined,
            nivel: undefined,
            busca: undefined,
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

    return (
        <Card className="p-4 sm:p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        🔍 Filtros
                    </h3>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* Busca */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Buscar
                    </label>
                    <input
                        type="text"
                        value={filters.busca || ''}
                        onChange={(e) => updateFilter('busca', e.target.value)}
                        placeholder="Nome do treino, categoria..."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Categoria */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Categoria
                    </label>
                    <select
                        value={filters.categoria || ''}
                        onChange={(e) => updateFilter('categoria', e.target.value as WorkoutCategory | undefined)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Todas</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.replace('-', ' ')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Objetivo */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Objetivo
                    </label>
                    <select
                        value={filters.objetivo || ''}
                        onChange={(e) => updateFilter('objetivo', e.target.value as Goal | undefined)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Todos</option>
                        <option value={GoalEnum.PERDER_PESO}>Emagrecimento</option>
                        <option value={GoalEnum.MANTER_PESO}>Manter Peso</option>
                        <option value={GoalEnum.GANHAR_MASSA}>Hipertrofia</option>
                    </select>
                </div>

                {/* Gênero */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Gênero
                    </label>
                    <select
                        value={filters.genero || ''}
                        onChange={(e) => updateFilter('genero', e.target.value as 'masculino' | 'feminino' | 'unisex' | undefined)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Todos</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="unisex">Unisex</option>
                    </select>
                </div>

                {/* Nível */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nível
                    </label>
                    <select
                        value={filters.nivel || ''}
                        onChange={(e) => updateFilter('nivel', e.target.value as 'iniciante' | 'intermediario' | 'avancado' | undefined)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="">Todos</option>
                        <option value="iniciante">Iniciante</option>
                        <option value="intermediario">Intermediário</option>
                        <option value="avancado">Avançado</option>
                    </select>
                </div>
            </div>
        </Card>
    );
};

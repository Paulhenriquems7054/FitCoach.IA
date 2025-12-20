import React from 'react';
import { Card } from '../ui/Card';
import type { WellnessTips } from '../../types';

interface WellnessTipsCardProps {
    tips: WellnessTips;
}

/**
 * Componente para exibir dicas inteligentes geradas pela IA
 * Inclui hidratação, horário de treino, descanso, sono e nutrição
 */
export const WellnessTipsCard: React.FC<WellnessTipsCardProps> = ({ tips }) => {
    const tipSections = [
        { key: 'hidratacao', icon: '💧', label: 'Hidratação', value: tips.hidratacao },
        { key: 'horario_treino', icon: '⏰', label: 'Horário Ideal de Treino', value: tips.horario_treino },
        { key: 'descanso', icon: '😴', label: 'Descanso', value: tips.descanso },
        { key: 'sono', icon: '🌙', label: 'Sono', value: tips.sono },
        { key: 'nutricao', icon: '🥗', label: 'Nutrição', value: tips.nutricao },
    ].filter(section => section.value); // Filtrar apenas seções com valor

    if (tipSections.length === 0) {
        return null;
    }

    return (
        <Card>
            <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">🧠</span>
                    <span className="break-words">Dicas Inteligentes Personalizadas</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {tipSections.map((section) => (
                        <div
                            key={section.key}
                            className="p-3 sm:p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl sm:text-2xl flex-shrink-0">{section.icon}</span>
                                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 break-words">
                                    {section.label}
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                                {section.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};


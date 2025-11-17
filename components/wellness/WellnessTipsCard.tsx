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
            <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    Dicas Inteligentes Personalizadas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tipSections.map((section) => (
                        <div
                            key={section.key}
                            className="p-4 bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{section.icon}</span>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                    {section.label}
                                </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {section.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};


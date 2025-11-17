import React from 'react';
import { Card } from '../ui/Card';
import type { Supplement } from '../../types';

interface SupplementCardProps {
    supplement: Supplement;
    index: number;
}

/**
 * Componente para exibir uma recomendação de suplemento
 * Mostra nome, dosagem, horário, justificativa e benefícios
 */
export const SupplementCard: React.FC<SupplementCardProps> = ({ supplement, index }) => {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {supplement.nome}
                    </h3>
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                        #{index + 1}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">💊 Dosagem:</span>
                        <span className="text-slate-700 dark:text-slate-300">{supplement.dosagem_sugerida}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">⏰ Horário:</span>
                        <span className="text-slate-700 dark:text-slate-300">{supplement.melhor_horario}</span>
                    </div>
                </div>

                <div className="mb-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {supplement.justificativa}
                    </p>
                </div>

                {supplement.beneficios && supplement.beneficios.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Benefícios principais:
                        </h4>
                        <ul className="space-y-1">
                            {supplement.beneficios.map((beneficio, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span>
                                    <span>{beneficio}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {supplement.contraindicacoes && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                            ⚠️ <strong>Atenção:</strong> {supplement.contraindicacoes}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};


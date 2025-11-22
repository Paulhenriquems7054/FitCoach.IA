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
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words flex-1 min-w-0">
                        {supplement.nome}
                    </h3>
                    <span className="px-2 sm:px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0">
                        #{index + 1}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">💊 Dosagem:</span>
                        <span className="text-slate-700 dark:text-slate-300 break-words">{supplement.dosagem_sugerida}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">⏰ Horário:</span>
                        <span className="text-slate-700 dark:text-slate-300 break-words">{supplement.melhor_horario}</span>
                    </div>
                </div>

                <div className="mb-3">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                        {supplement.justificativa}
                    </p>
                </div>

                {supplement.beneficios && supplement.beneficios.length > 0 && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Benefícios principais:
                        </h4>
                        <ul className="space-y-1">
                            {supplement.beneficios.map((beneficio, idx) => (
                                <li key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1 flex-shrink-0">✓</span>
                                    <span className="break-words">{beneficio}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {supplement.contraindicacoes && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-200 break-words">
                            ⚠️ <strong>Atenção:</strong> {supplement.contraindicacoes}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
};


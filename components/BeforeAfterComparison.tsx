/**
 * Componente de Comparação Antes/Depois
 */

import React from 'react';
import { Card } from './ui/Card';
import { BeforeAfterComparison } from '../services/progressVisualizationService';
import { TrendingDownIcon } from './icons/TrendingDownIcon';

export interface BeforeAfterComparisonProps {
  comparison: BeforeAfterComparison;
}

export const BeforeAfterComparisonComponent: React.FC<BeforeAfterComparisonProps> = ({
  comparison,
}) => {
  const { before, after, improvements } = comparison;

  return (
    <Card>
      <div className="p-6 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Comparação Antes/Depois
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Antes */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                ANTES
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(before.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {before.photoUrl && (
              <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                <img
                  src={before.photoUrl}
                  alt="Antes"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Peso:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {before.weight.toFixed(1)} kg
                </span>
              </div>
              {before.measurements && Object.entries(before.measurements).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {key}:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {(value as number).toFixed(1)} cm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Depois */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                DEPOIS
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(after.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {after.photoUrl && (
              <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                <img
                  src={after.photoUrl}
                  alt="Depois"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Peso:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {after.weight.toFixed(1)} kg
                </span>
              </div>
              {after.measurements && Object.entries(after.measurements).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {key}:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {(value as number).toFixed(1)} cm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Melhorias */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Melhorias Alcançadas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDownIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-200">
                  Perda de Peso
                </span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {improvements.weightLoss.toFixed(1)} kg
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {improvements.weightLossPercent.toFixed(1)}% do peso inicial
              </p>
            </div>

            {Object.keys(improvements.measurementChanges).length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Redução de Medidas:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(improvements.measurementChanges).map(([key, change]) => (
                    <div
                      key={key}
                      className="p-2 bg-slate-50 dark:bg-slate-800 rounded"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                        {key}:
                      </span>
                      <span className="ml-2 text-sm font-semibold text-slate-900 dark:text-white">
                        -{(change as number).toFixed(1)} cm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};


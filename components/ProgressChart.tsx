/**
 * Componente de Gráfico de Progresso Avançado
 */

import React from 'react';
import { Card } from './ui/Card';
import { ProgressDataPoint, ProgressPrediction } from '../services/progressVisualizationService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export interface ProgressChartProps {
  dataPoints: ProgressDataPoint[];
  predictions?: ProgressPrediction[];
  showPredictions?: boolean;
  height?: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  dataPoints,
  predictions = [],
  showPredictions = false,
  height = 300,
}) => {
  // Preparar dados para o gráfico
  const chartData = dataPoints.map(point => ({
    date: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    weight: point.weight,
    fullDate: point.date,
  }));

  // Adicionar previsões se habilitado
  const dataWithPredictions = showPredictions && predictions.length > 0
    ? [
        ...chartData,
        ...predictions
          .filter(p => p.scenario === 'realistic')
          .map(p => ({
            date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            weight: p.predictedWeight,
            fullDate: p.date,
            isPrediction: true,
          })),
      ]
    : chartData;

  const formatWeight = (value: number) => `${value.toFixed(1)} kg`;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Progresso de Peso
        </h3>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={dataWithPredictions}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatWeight(value)}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorWeight)"
              name="Peso"
            />
            {showPredictions && (
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Previsão"
                data={predictions
                  .filter(p => p.scenario === 'realistic')
                  .map(p => ({
                    date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    weight: p.predictedWeight,
                  }))}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};


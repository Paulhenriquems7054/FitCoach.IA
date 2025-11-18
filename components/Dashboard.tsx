
import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DailySummary } from '../types';
import { Card } from './ui/Card';
import { useUser } from '../context/UserContext';

const mockWeeklyProgress = [
  { name: 'Seg', calorias: 2200, meta: 2500 },
  { name: 'Ter', calorias: 2450, meta: 2500 },
  { name: 'Qua', calorias: 2550, meta: 2500 },
  { name: 'Qui', calorias: 2300, meta: 2500 },
  { name: 'Sex', calorias: 2600, meta: 2500 },
  { name: 'Sáb', calorias: 2800, meta: 2500 },
  { name: 'Dom', calorias: 2700, meta: 2500 },
];

interface DashboardProps {
  summary: DailySummary | null;
}

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
            <svg
                height={radius * 2}
                width={radius * 2}
                className="-rotate-90"
            >
                <circle
                    stroke="rgb(229 231 235)"
                    className="dark:stroke-slate-700"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="rgb(34 197 94)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-200">
                {progress}%
            </span>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = memo(({ summary }) => {
  const { user } = useUser();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      
      {summary && (
        <Card className="lg:col-span-3">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Resumo Diário</h3>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center">
              <div className="p-3 sm:p-4 bg-sky-100 dark:bg-sky-900/50 rounded-lg">
                <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-300">Calorias</p>
                <p className="text-xl sm:text-2xl font-bold text-sky-800 dark:text-sky-200">{summary.total_calorias}</p>
              </div>
              <div className="p-3 sm:p-4 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-300">Proteínas</p>
                <p className="text-xl sm:text-2xl font-bold text-rose-800 dark:text-rose-200">{summary.total_proteinas_g}g</p>
              </div>
              <div className="p-3 sm:p-4 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-300">Carboidratos</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-800 dark:text-amber-200">{summary.total_carboidratos_g}g</p>
              </div>
              <div className="p-3 sm:p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-300">Gorduras</p>
                <p className="text-xl sm:text-2xl font-bold text-indigo-800 dark:text-indigo-200">{summary.total_gorduras_g}g</p>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <Card>
        <div className="p-6 space-y-6 text-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Seu Progresso</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pontuação de Disciplina</p>
              <div className="flex items-center justify-center">
                <CircularProgress progress={user.disciplineScore} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pontos Acumulados</p>
              <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{user.points}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Progresso Semanal (Exemplo)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={mockWeeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                  <XAxis dataKey="name" stroke="rgb(100 116 139)" />
                  <YAxis stroke="rgb(100 116 139)" />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                      borderColor: 'rgb(51 65 85)',
                      color: '#fff',
                      borderRadius: '0.5rem'
                    }} 
                    cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}
                    />
                  <Legend />
                  <Bar dataKey="calorias" fill="rgb(34 197 94)" name="Consumido" />
                  <Bar dataKey="meta" fill="rgb(71 85 105)" name="Meta"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.summary?.total_calorias === nextProps.summary?.total_calorias;
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

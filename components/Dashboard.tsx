
import React, { memo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { useUser } from '../context/UserContext';
import { getWellnessPlan, getCompletedWorkouts } from '../services/databaseService';
import type { WellnessPlan } from '../types';

interface DashboardProps {
  summary?: null; // Mantido para compatibilidade, mas não usado mais
}

interface WeeklyWorkoutData {
  name: string;
  completos: number;
  total: number;
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
  const [workoutPlan, setWorkoutPlan] = useState<WellnessPlan | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set());
  const [weeklyData, setWeeklyData] = useState<WeeklyWorkoutData[]>([]);
  const [workoutStats, setWorkoutStats] = useState({
    totalTreinos: 0,
    treinosCompletos: 0,
    progressoPercentual: 0,
    treinosEstaSemana: 0,
  });

  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        const plan = await getWellnessPlan();
        const completed = await getCompletedWorkouts();
        
        setWorkoutPlan(plan);
        setCompletedWorkouts(completed);

        if (plan) {
          // Calcular estatísticas
          const totalTreinos = plan.plano_treino_semanal.filter(day => 
            !day.foco_treino.toLowerCase().includes('descanso')
          ).length;
          const treinosCompletos = completed.size;
          const progressoPercentual = totalTreinos > 0 
            ? Math.round((treinosCompletos / totalTreinos) * 100) 
            : 0;

          // Calcular treinos desta semana
          const hoje = new Date();
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - hoje.getDay());
          
          setWorkoutStats({
            totalTreinos,
            treinosCompletos,
            progressoPercentual,
            treinosEstaSemana: treinosCompletos,
          });

          // Preparar dados semanais para o gráfico
          const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
          const weekly = plan.plano_treino_semanal.map((day, index) => {
            const isRestDay = day.foco_treino.toLowerCase().includes('descanso');
            return {
              name: diasSemana[index] || day.dia_semana.substring(0, 3),
              completos: completed.has(index) ? 1 : 0,
              total: isRestDay ? 0 : 1,
            };
          });
          setWeeklyData(weekly);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de treino:', error);
      }
    };

    loadWorkoutData();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Estatísticas de Treino */}
      <Card>
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">📊 Estatísticas de Treino</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center">
            <div className="p-3 sm:p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-300">Treinos Completos</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {workoutStats.treinosCompletos}/{workoutStats.totalTreinos}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">Progresso Semanal</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-200">
                {workoutStats.progressoPercentual}%
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">Treinos Esta Semana</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-800 dark:text-purple-200">
                {workoutStats.treinosEstaSemana}
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-300">Pontos de Disciplina</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-800 dark:text-orange-200">
                {user.points}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <div className="p-6 space-y-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">💪 Seu Progresso</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">Progresso Semanal</p>
                <div className="flex items-center justify-center">
                  <CircularProgress progress={workoutStats.progressoPercentual} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Disciplina</p>
                <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{user.disciplineScore}%</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">📅 Progresso Semanal de Treinos</h3>
            {weeklyData.length > 0 ? (
              <div className="w-full h-[300px] sm:h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgb(100 116 139)" 
                      tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="rgb(100 116 139)" 
                      domain={[0, 1]} 
                      tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                        borderColor: 'rgb(51 65 85)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        padding: '8px',
                        fontSize: '12px'
                      }} 
                      cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}
                      formatter={(value: number) => value === 1 ? 'Completo ✓' : 'Pendente'}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}
                      iconType="rect"
                    />
                    <Bar 
                      dataKey="completos" 
                      fill="rgb(34 197 94)" 
                      name="Treinos Completos"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] sm:h-[350px] md:h-[400px] text-slate-500 dark:text-slate-400">
                <div className="text-center px-4">
                  <p className="text-base sm:text-lg mb-2">📋 Nenhum plano de treino ainda</p>
                  <p className="text-xs sm:text-sm">Gere um plano de treino para ver seu progresso aqui!</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.summary?.total_calorias === nextProps.summary?.total_calorias;
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

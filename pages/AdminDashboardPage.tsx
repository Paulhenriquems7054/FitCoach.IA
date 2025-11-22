import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import { getAllStudents, getAllTrainers, getAllUsers } from '../services/studentManagementService';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { Alert } from '../components/ui/Alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { User } from '../types';

interface DashboardStats {
  totalStudents: number;
  totalTrainers: number;
  blockedStudents: number;
  activeStudents: number;
  studentsByGoal: { name: string; value: number }[];
  recentActivity: { name: string; students: number; trainers: number }[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const AdminDashboardPage: React.FC = () => {
  const { user } = useUser();
  const permissions = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTrainers: 0,
    blockedStudents: 0,
    activeStudents: 0,
    studentsByGoal: [],
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user.gymId) {
        setError('Você não está associado a uma academia.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [students, trainers, allUsers] = await Promise.all([
          getAllStudents(user.gymId),
          getAllTrainers(user.gymId),
          getAllUsers(user.gymId),
        ]);

        // Calcular estatísticas
        const blockedStudents = students.filter(s => s.accessBlocked).length;
        const activeStudents = students.length - blockedStudents;

        // Agrupar alunos por objetivo
        const goalCounts: { [key: string]: number } = {};
        students.forEach(student => {
          const goal = student.objetivo || 'Não definido';
          goalCounts[goal] = (goalCounts[goal] || 0) + 1;
        });

        const studentsByGoal = Object.entries(goalCounts).map(([name, value]) => ({
          name,
          value,
        }));

        // Dados de atividade (exemplo - pode ser expandido com dados reais)
        const recentActivity = [
          { name: 'Esta Semana', students: activeStudents, trainers: trainers.length },
          { name: 'Este Mês', students: activeStudents, trainers: trainers.length },
        ];

        setStats({
          totalStudents: students.length,
          totalTrainers: trainers.length,
          blockedStudents,
          activeStudents,
          studentsByGoal,
          recentActivity,
        });
      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError(err.message || 'Erro ao carregar dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user.gymId]);

  // Verificar permissões
  if (!permissions.canViewAllData && !permissions.canManageGymSettings) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" title="Acesso Negado">
          Você não tem permissão para acessar o dashboard de administração.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" title="Erro">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard Administrativo
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Bem-vindo, {user.nome}! Gerencie sua academia de forma eficiente.
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Alunos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg">
                <UsersIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Alunos Ativos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats.activeStudents}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                <UsersIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Alunos Bloqueados</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats.blockedStudents}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                <ShieldCheckIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Treinadores</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stats.totalTrainers}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
                <UsersIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Alunos por Objetivo */}
        {stats.studentsByGoal.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Alunos por Objetivo
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stats.studentsByGoal}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.studentsByGoal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}

        {/* Gráfico de Atividade */}
        {stats.recentActivity.length > 0 && (
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Atividade Recente
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" stroke="rgb(100 116 139)" />
                    <YAxis stroke="rgb(100 116 139)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgb(51 65 85)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="students" fill="#10b981" name="Alunos" />
                    <Bar dataKey="trainers" fill="#3b82f6" name="Treinadores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Acesso Rápido */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.hash = '#/student-management'}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Gerenciar Alunos
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Criar, editar e gerenciar alunos
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.hash = '#/gym-admin'}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg">
                  <CogIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Configurações da Academia
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Personalizar branding e configurações
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.hash = '#/reports'}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Relatórios
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Visualizar relatórios e análises
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


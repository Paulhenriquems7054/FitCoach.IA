import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
      // Verificar se é administrador padrão (Administrador ou Desenvolvedor)
      const isDefaultAdmin = user.username === 'Administrador' || user.username === 'Desenvolvedor';
      
      // Determinar o gymId a usar
      let gymIdToUse = user.gymId;
      if (!gymIdToUse && isDefaultAdmin) {
        // Para administradores padrão, usar gymId padrão
        gymIdToUse = 'default-gym';
      }
      
      if (!gymIdToUse) {
        setError('Você não está associado a uma academia.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Tentar migrar alunos antigos primeiro (apenas uma vez)
        try {
          const { migrateOldStudents } = await import('../services/migrationService');
          const migrated = await migrateOldStudents(gymIdToUse);
          if (migrated > 0) {
            console.log(`Migrados ${migrated} alunos antigos`);
          }
        } catch (error) {
          console.warn('Erro ao migrar alunos antigos:', error);
        }
        
        // Debug: verificar dados antes da busca
        console.log('AdminDashboard - Buscando alunos:', {
          gymIdToUse,
          userGymId: user.gymId,
          username: user.username,
          isDefaultAdmin: user.username === 'Administrador' || user.username === 'Desenvolvedor'
        });
        
        const [students, trainers, allUsers] = await Promise.all([
          getAllStudents(gymIdToUse),
          getAllTrainers(gymIdToUse),
          getAllUsers(gymIdToUse),
        ]);

        // Debug: verificar resultados
        console.log('AdminDashboard - Resultados da busca:', {
          studentsCount: students.length,
          trainersCount: trainers.length,
          allUsersCount: allUsers.length,
          students: students.map(s => ({
            username: s.username,
            nome: s.nome,
            gymId: s.gymId,
            gymRole: s.gymRole,
            isGymManaged: s.isGymManaged
          }))
        });

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
  }, [user.gymId, user.username]);

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
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard Administrativo
        </h1>
        <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400">
          Bem-vindo, {user.nome}! Gerencie sua academia de forma eficiente.
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">Total de Alunos</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">Alunos Ativos</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                  {stats.activeStudents}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">Alunos Bloqueados</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                  {stats.blockedStudents}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/50 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">Treinadores</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                  {stats.totalTrainers}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/50 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico de Alunos por Objetivo */}
        {stats.studentsByGoal.length > 0 && (
          <Card>
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Alunos por Objetivo
              </h3>
              <div className="w-full h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.studentsByGoal}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius="70%"
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
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Atividade Recente
              </h3>
              <div className="w-full h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.recentActivity} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgb(100 116 139)" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="rgb(100 116 139)" 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgb(51 65 85)',
                        color: '#fff',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
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
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card: Gerenciar Alunos */}
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-md">
                  <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate mb-1">
                    Gerenciar Alunos
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    Criar, editar e gerenciar alunos
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {stats.totalStudents}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {stats.totalStudents === 1 ? 'aluno' : 'alunos'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#/student-management';
                  }}
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  Ver Todos
                </Button>
                {permissions.canCreateStudents && (
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.hash = '#/student-management?action=create';
                    }}
                    className="flex-1 text-xs sm:text-sm py-2"
                  >
                    ➕ Novo Aluno
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Card: Configurações da Academia */}
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-md">
                  <CogIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate mb-1">
                    Configurações da Academia
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    Personalizar branding e configurações
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                      Configurar
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#/gym-admin';
                  }}
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  Abrir Configurações
                </Button>
                {permissions.canManageGymSettings && (
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.hash = '#/gym-admin?tab=branding';
                    }}
                    className="flex-1 text-xs sm:text-sm py-2"
                  >
                    🎨 Branding
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Card: Relatórios */}
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-md">
                  <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate mb-1">
                    Relatórios
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    Visualizar relatórios e análises
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {stats.activeStudents}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {stats.activeStudents === 1 ? 'aluno ativo' : 'alunos ativos'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#/reports';
                  }}
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  Ver Relatórios
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#/analysis';
                  }}
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  📊 Análises
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


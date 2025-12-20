import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { useUser } from '../context/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  AiUsageDayFeature,
  AiUsageSummary,
  fetchAiUsageSummary,
} from '../services/aiUsageService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GymFinanceDashboardPage: React.FC = () => {
  const { user } = useUser();
  const permissions = usePermissions();
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gymId = user.gymId || (permissions.canViewAllData ? 'default-gym' : null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const summary = await fetchAiUsageSummary(gymId);
        setUsage(summary);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar uso de IA');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [gymId]);

  if (!permissions.canViewAllData && !permissions.canManageGymSettings) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert type="error" title="Acesso Negado">
          Você não tem permissão para visualizar o painel financeiro da academia.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Carregando uso de IA...
            </p>
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

  const totals = usage?.totals || {
    calls: 0,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
  };

  // Agrupar por dia somando todas as features para o gráfico principal
  const byDayAggregated: { date: string; calls: number; costUsd: number }[] = [];
  if (usage) {
    const map = new Map<string, { date: string; calls: number; costUsd: number }>();
    usage.byDay.forEach((item: AiUsageDayFeature) => {
      const existing = map.get(item.date) || {
        date: item.date,
        calls: 0,
        costUsd: 0,
      };
      existing.calls += item.calls;
      existing.costUsd += item.costUsd;
      map.set(item.date, existing);
    });
    byDayAggregated.push(...Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)));
  }

  const monthInfo = usage?.month;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 py-4 sm:py-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Painel Financeiro de IA
        </h1>
        <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400">
          Acompanhe o consumo de Gemini (tokens e custo estimado) da sua academia.
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Chamadas Gemini (período)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {totals.calls}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Tokens (entrada)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {totals.tokensIn}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Tokens (saída)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {totals.tokensOut}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Custo estimado (USD)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
              ${totals.costUsd.toFixed(4)}
            </p>
            {monthInfo && monthInfo.hardLimitUsd != null && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Mês {monthInfo.yearMonth}: ${monthInfo.totalCostUsd.toFixed(2)} /{' '}
                ${monthInfo.hardLimitUsd.toFixed(2)}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Gráfico por dia */}
      <Card>
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Consumo diário de IA (Chamadas x Custo)
          </h2>
          {byDayAggregated.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum uso de IA registrado no período.
            </p>
          ) : (
            <div className="w-full h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDayAggregated} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgb(100 116 139)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="rgb(100 116 139)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgb(100 116 139)"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: 'rgb(51 65 85)',
                      color: '#fff',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="calls"
                    name="Chamadas"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="costUsd"
                    name="Custo (USD)"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GymFinanceDashboardPage;



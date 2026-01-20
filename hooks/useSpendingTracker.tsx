import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useUser } from '../context/UserContext';

// Arquivo renomeado de .ts para .tsx para suportar JSX
// Se o Vite ainda estiver buscando .ts, reinicie o servidor

// Tipos básicos para o sistema de billing
type SpendingLog = {
  id: string;
  user_id: string;
  operation_type: string;
  tokens_used: number;
  estimated_cost: number;
  features_used: Record<string, any>;
  created_at: string;
};

type UsageTracking = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  period_start: string;
  period_end: string;
  api_calls_total: number;
  gemini_input_tokens: number;
  gemini_output_tokens: number;
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  renewal_type: 'monthly' | 'yearly' | 'lifetime';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stripe_price_id: string | null;
  requests_per_month: number;
  image_analysis_per_month: number;
  voice_messages_per_month: number;
  features: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

interface UsageStats {
  used: number;
  limit: number;
  percentage: number;
  daysLeft: number;
  nextReset: Date;
}

/**
 * Hook para rastrear uso e gastos do usuário
 * Integra automaticamente com o sistema de billing
 */
export function useSpendingTracker() {
  const { user } = useUser(); // Usar contexto de usuário
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Verificar se usuário está disponível no contexto
        if (!user || !user.id) {
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }

        // Obter UUID do usuário se user.id for string (username)
        // Se user.id já for UUID, usar diretamente
        let userIdForQuery: string | null = user.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        
        if (!isUUID) {
          // Buscar UUID do usuário na tabela users pelo username
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('username', user.id)
            .maybeSingle();
          
          if (userError) {
            console.warn('Erro ao buscar UUID do usuário:', userError);
          }
          
          if (userData?.id) {
            userIdForQuery = userData.id;
          } else {
            // Se não encontrou UUID, não podemos fazer queries que requerem UUID
            console.warn('Usuário não encontrado na tabela users para username:', user.id);
            // Se não há UUID, ainda podemos buscar planos padrão, mas não subscriptions/usage
            userIdForQuery = null;
          }
        }

        // Buscar assinatura ativa usando owner_id e owner_type (só se tivermos UUID)
        // A tabela subscriptions usa owner_id (não user_id) e owner_type
        let subscriptionData: any = null;
        if (userIdForQuery) {
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('owner_type', 'user')
            .eq('owner_id', userIdForQuery)
            .eq('status', 'active')
            .maybeSingle();

          if (subError && subError.code !== 'PGRST116') {
            throw subError;
          }
          subscriptionData = subData;
        }

        setSubscription(subscriptionData || null);

        let planDataToUse: Plan | null = null;

        if (subscriptionData) {
          // Buscar plano associado à subscription
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', subscriptionData.plan_id)
            .single();

          if (planError) {
            console.warn('Erro ao buscar plano da subscription:', planError);
            // Continuar sem plano se erro
          } else {
            planDataToUse = planData;
          }
        } else {
          // Se não há subscription, buscar plano Free como padrão
          try {
            const { data: freePlan } = await supabase
              .from('plans')
              .select('*')
              .eq('name', 'Free')
              .eq('is_active', true)
              .maybeSingle();

            if (freePlan) {
              planDataToUse = freePlan;
            } else {
              // Se não encontrou Free, buscar primeiro plano ativo
              const { data: plans } = await supabase
                .from('plans')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(1);

              if (plans && plans.length > 0) {
                planDataToUse = plans[0];
              }
            }
          } catch (planError) {
            console.warn('Erro ao buscar plano padrão:', planError);
            // Continuar sem plano se erro
          }
        }

        setPlan(planDataToUse || null);

        // Buscar uso do mês atual (mesmo sem subscription) - só se tivermos UUID
        if (planDataToUse && userIdForQuery) {
          const now = new Date();
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split('T')[0];
          const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0];

          // Usar userIdForQuery que foi calculado acima no início do useEffect
          const { data: usageData, error: usageError } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('user_id', userIdForQuery)
            .eq('period_start', periodStart)
            .maybeSingle();

          if (usageError && usageError.code !== 'PGRST116') {
            console.warn('Erro ao buscar uso:', usageError);
          }

          const used = usageData?.api_calls_total || 0;
          const limit = planDataToUse.requests_per_month || 100;
          const percentage = (used / limit) * 100;
          
          // Calcular dias restantes baseado no período atual (mês atual)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysLeft = subscriptionData 
            ? Math.ceil(
                (new Date(subscriptionData.current_period_end).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
              )
            : Math.ceil(
                (endOfMonth.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
              );

          setUsage({
            used,
            limit,
            percentage,
            daysLeft,
            nextReset: subscriptionData 
              ? new Date(subscriptionData.current_period_end)
              : endOfMonth
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados de uso:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    fetchUserData();
  }, [user?.id]); // Recarregar quando o usuário mudar

  /**
   * Rastrear uma operação de gasto
   */
  const trackOperation = async (
    operationType: 'text_analysis' | 'image_analysis' | 'voice_analysis',
    tokensUsed: number,
    estimatedCost: number = 0
  ) => {
    try {
      if (!user || !user.id) throw new Error('Usuário não autenticado');

      // Obter UUID do usuário se necessário
      let userIdForQuery = user.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (!isUUID) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('username', user.id)
          .maybeSingle();
        if (userData?.id) {
          userIdForQuery = userData.id;
        }
      }

      // 1. Inserir log de gasto
      const { error: logError } = await supabase
        .from('spending_logs')
        .insert({
          user_id: userIdForQuery,
          operation_type: operationType,
          tokens_used: tokensUsed,
          estimated_cost: estimatedCost,
          features_used: {}
        });

      if (logError) throw logError;

      // 2. Atualizar contador de uso
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      // Buscar registro de uso existente
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userIdForQuery)
        .eq('period_start', periodStart)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('usage_tracking')
          .update({
            api_calls_total: (existing.api_calls_total || 0) + 1,
            gemini_input_tokens: (existing.gemini_input_tokens || 0) + tokensUsed
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('usage_tracking')
          .insert({
            user_id: userIdForQuery,
            period_start: periodStart,
            period_end: periodEnd,
            api_calls_total: 1,
            gemini_input_tokens: tokensUsed
          });

        if (insertError) throw insertError;
      }

      // Atualizar estado local
      setUsage(prev => prev ? {
        ...prev,
        used: prev.used + 1,
        percentage: ((prev.used + 1) / prev.limit) * 100
      } : null);

    } catch (err) {
      console.error('Erro ao rastrear operação:', err);
      throw err;
    }
  };

  /**
   * Verificar se o usuário ultrapassou o limite
   */
  const isLimitExceeded = () => {
    return usage ? usage.percentage >= 100 : false;
  };

  /**
   * Verificar se está próximo do limite (80%+)
   */
  const isNearLimit = () => {
    return usage ? usage.percentage >= 80 : false;
  };

  return {
    usage,
    subscription,
    plan,
    loading,
    error,
    trackOperation,
    isLimitExceeded,
    isNearLimit
  };
}

/**
 * Componente para exibir indicador de uso
 */
export function UsageIndicator() {
  const { usage, plan, isLimitExceeded, isNearLimit, loading } = useSpendingTracker();

  if (loading || !usage || !plan) {
    return <div className="text-gray-500">Carregando...</div>;
  }

  const bgColor = isLimitExceeded() 
    ? 'bg-red-500' 
    : isNearLimit() 
    ? 'bg-yellow-500' 
    : 'bg-green-500';

  const textColor = isLimitExceeded() 
    ? 'text-red-600' 
    : isNearLimit() 
    ? 'text-yellow-600' 
    : 'text-green-600';

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Uso do Plano</h3>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full ${bgColor} transition-all`}
          style={{ width: `${Math.min(usage.percentage, 100)}%` }}
        />
      </div>

      {/* Texto de uso */}
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${textColor}`}>
          {usage.used} / {usage.limit} requisições
        </span>
        <span className="text-xs text-gray-500">
          {usage.percentage.toFixed(0)}%
        </span>
      </div>

      {/* Aviso se próximo do limite */}
      {isNearLimit() && !isLimitExceeded() && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-700">
            ⚠️ Você está próximo do limite. Reseta em {usage.daysLeft} dias.
          </p>
          <a href="#/plans" className="text-xs text-yellow-600 hover:underline">
            Upgrade para plano superior →
          </a>
        </div>
      )}

      {/* Erro se ultrapassou limite */}
      {isLimitExceeded() && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-700 font-medium">
            ❌ Você atingiu o limite do plano
          </p>
          <a href="#/plans" className="text-xs text-red-600 hover:underline">
            Faça upgrade agora →
          </a>
        </div>
      )}

      {/* Info do plano */}
      <div className="mt-3 text-xs text-gray-600">
        <p>Plano: <span className="font-medium">{plan.name}</span></p>
        <p>Próximo reset: {usage.nextReset.toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
}

/**
 * Hook para carregar análise de gastos
 */
export function useSpendingAnalysis() {
  const { user } = useUser(); // Usar contexto de usuário
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        if (!user || !user.id) return;

        // Obter UUID do usuário se necessário
        let userIdForQuery = user.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        if (!isUUID) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('username', user.id)
            .maybeSingle();
          if (userData?.id) {
            userIdForQuery = userData.id;
          } else {
            return; // Não encontrou UUID, não buscar análise
          }
        }

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { data, error } = await supabase
          .from('spending_analysis')
          .select('*')
          .eq('user_id', userIdForQuery)
          .ilike('period_month', `${currentMonth}%`)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        setAnalysis(data);
      } catch (err) {
        console.error('Erro ao carregar análise:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    fetchAnalysis();
  }, [user?.id]); // Recarregar quando o usuário mudar

  return { analysis, loading };
}

/**
 * Componente para exibir relatório de gasto
 */
export function SpendingReport() {
  const { analysis, loading } = useSpendingAnalysis();

  if (loading) {
    return <div className="text-center text-gray-500">Carregando relatório...</div>;
  }

  if (!analysis) {
    return <div className="text-center text-gray-500">Nenhum relatório disponível</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">📊 Análise de Gastos</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Custo do Mês</p>
          <p className="text-2xl font-bold text-blue-600">
            R$ {analysis.total_cost?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Economia Possível</p>
          <p className="text-2xl font-bold text-green-600">
            R$ {analysis.saving_opportunity?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Insights IA */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 Insights</h3>
        <p className="text-sm text-gray-600">
          {analysis.ai_insights || 'Análise em processamento...'}
        </p>
      </div>

      {/* Recomendações */}
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">✅ Recomendações</h3>
        <p className="text-sm text-yellow-700">
          {analysis.ai_recommendations || 'Recomendações em processamento...'}
        </p>
      </div>
    </div>
  );
}

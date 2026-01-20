import React, { useState, useEffect } from 'react';
import { useSpendingTracker, UsageIndicator, SpendingReport } from '../hooks/useSpendingTracker';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
// Router navigation via window.location.hash
import { supabase } from '../services/supabaseClient';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { LimitesUsageIndicator } from '../components/LimitesUsageIndicator';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

// Interface para planos da tabela app_plans (usada pela página de vendas)
interface AppPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  plan_group: string; // 'b2c', 'b2b_academia', 'recarga', 'personal'
  billing_type: string; // 'recorrente', 'one_time'
  billing_period: string | null; // 'mensal', 'anual', null
  price: number;
  total_checkout_price: number | null;
  cakto_checkout_id: string | null;
  max_licenses: number | null;
  minutes_voice_per_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para compatibilidade com useSpendingTracker (usa tabela 'plans')
interface Plan {
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
}

const BillingPage: React.FC = () => {
  const { user } = useUser();
  const { usage, subscription, plan, loading, error, isLimitExceeded, isNearLimit } = useSpendingTracker();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [plans, setPlans] = useState<AppPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) return;

      try {
        // Obter UUID do usuário se user.id for string (username)
        let userIdForQuery = user.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        
        if (!isUUID) {
          // Buscar UUID do usuário na tabela users pelo username
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('username', user.id)
            .maybeSingle();
          
          if (userData?.id) {
            userIdForQuery = userData.id;
          } else {
            // Se não encontrou UUID, não buscar invoices (user_id requer UUID)
            console.warn('Usuário não encontrado na tabela users para buscar invoices');
            setLoadingInvoices(false);
            return;
          }
        }

        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userIdForQuery)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        console.error('Erro ao carregar faturas:', err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [user?.id]);

  // Buscar planos disponíveis da tabela app_plans (página de vendas)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Buscar apenas planos recorrentes (assinaturas), excluir recargas
        const { data, error } = await supabase
          .from('app_plans')
          .select('*')
          .eq('is_active', true)
          .eq('billing_type', 'recorrente') // Apenas assinaturas, não recargas
          .order('plan_group', { ascending: true })
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Função para rolar até a seção de planos
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Função para selecionar plano
  const handleSelectPlan = (selectedPlan: AppPlan) => {
    // Se já está no plano selecionado, apenas rolar para o topo
    if (plan && plan.name === selectedPlan.name) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Se tem checkout_id, redirecionar para checkout Cakto
    if (selectedPlan.cakto_checkout_id) {
      // Construir URL do checkout Cakto (ajustar conforme sua configuração)
      const checkoutUrl = `https://checkout.cakto.com.br/checkout/${selectedPlan.cakto_checkout_id}`;
      window.open(checkoutUrl, '_blank');
    } else {
      // TODO: Implementar checkout/upgrade alternativo
      alert(`Funcionalidade de upgrade para o plano ${selectedPlan.name} em desenvolvimento.`);
    }
  };

  const formatPrice = (plan: AppPlan) => {
    if (plan.price === 0) return 'Grátis';
    
    // Formatar preço baseado no período
    if (plan.billing_period === 'anual') {
      return `R$ ${plan.price.toFixed(2)}/ano`;
    } else if (plan.billing_period === 'mensal') {
      return `R$ ${plan.price.toFixed(2)}/mês`;
    }
    
    // Fallback
    return `R$ ${plan.price.toFixed(2)}`;
  };

  const getFeatureList = (plan: AppPlan) => {
    const featureList: string[] = [];
    
    // Features baseadas no tipo de plano
    if (plan.plan_group === 'b2c') {
      featureList.push('Análise com IA');
      featureList.push('Chat ilimitado');
      featureList.push('Análise de refeições');
      if (plan.billing_period === 'anual') {
        featureList.push('Suporte Prioritário');
        featureList.push('Economia de R$ 121,80');
      }
    } else if (plan.plan_group === 'b2b_academia') {
      featureList.push(`${plan.max_licenses || 0} licenças`);
      featureList.push('Gestão de alunos');
      featureList.push('Relatórios avançados');
      if (plan.minutes_voice_per_day) {
        featureList.push(`${plan.minutes_voice_per_day} min voz/dia`);
      }
    } else if (plan.plan_group === 'personal') {
      featureList.push(`${plan.max_licenses || 0} licenças`);
      featureList.push('Gestão de clientes');
      featureList.push('Planos personalizados');
    }

    return featureList;
  };

  // Mostrar loading apenas inicialmente
  if (loading && !error && !plan && !subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Carregando informações de billing...</div>
      </div>
    );
  }

  // Mostrar erro apenas se for crítico e não houver nenhum dado
  if (error && !plan && !subscription && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <Button onClick={scrollToPlans}>
              Ver Planos Disponíveis
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          💳 Gerenciar Assinatura
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Acompanhe seu uso, gastos e faça upgrade do seu plano
        </p>
      </div>

      {/* Alertas de Limite */}
      {isLimitExceeded() && (
        <Card className="mb-6 p-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">
                ❌ Limite Excedido
              </h3>
              <p className="text-red-600">
                Você atingiu o limite do seu plano atual. Faça upgrade para continuar usando.
              </p>
            </div>
            <Button
              onClick={scrollToPlans}
              className="bg-red-600 hover:bg-red-700"
            >
              Fazer Upgrade
            </Button>
          </div>
        </Card>
      )}

      {isNearLimit() && !isLimitExceeded() && (
        <Card className="mb-6 p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-1">
                ⚠️ Próximo do Limite
              </h3>
              <p className="text-yellow-600">
                Você está usando {usage?.percentage.toFixed(0)}% do seu limite mensal.
              </p>
            </div>
            <Button
              onClick={scrollToPlans}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Ver Planos
            </Button>
          </div>
        </Card>
      )}

      {/* Mensagem se não houver assinatura */}
      {!subscription && plan && (
        <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-1">
                📋 Você ainda não tem uma assinatura ativa
              </h3>
              <p className="text-blue-600">
                Plano padrão: <strong>{plan.name}</strong> (R$ {plan.price.toFixed(2)}/mês)
              </p>
              <p className="text-sm text-blue-500 mt-2">
                Selecione um plano para começar a usar todas as funcionalidades.
              </p>
            </div>
            <Button
              onClick={scrollToPlans}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ver Planos
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Uso e Relatórios */}
        <div className="lg:col-span-2 space-y-6">
          {/* NOVO MODELO: Indicador de Limites (substitui ou complementa UsageIndicator) */}
          <LimitesUsageIndicator />

          {/* Indicador de Uso Antigo (manter para compatibilidade) */}
          {plan && <UsageIndicator />}

          {/* Relatório de Gastos */}
          <SpendingReport />

          {/* Informações da Assinatura - Mostrar mesmo sem subscription se houver plano */}
          {(subscription || plan) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                📋 Detalhes da Assinatura
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-slate-600 dark:text-slate-400">Plano Atual</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {plan?.name || 'Não definido'}
                  </span>
                </div>

                {subscription && (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.status === 'active' ? 'Ativa' : subscription.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Período Atual</span>
                      <span className="text-slate-900 dark:text-white">
                        {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')} - {' '}
                        {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {usage && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span className="text-slate-600 dark:text-slate-400">Próxima Renovação</span>
                        <span className="text-slate-900 dark:text-white">
                          {usage.nextReset?.toLocaleDateString('pt-BR') || 'N/A'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Renovação Automática</span>
                      <span className="text-slate-900 dark:text-white">
                        {subscription.auto_renew ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </>
                )}

                {!subscription && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ℹ️ Você está usando o plano padrão sem assinatura ativa. 
                      Assine um plano para ter controle completo sobre seu uso.
                    </p>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={scrollToPlans}
                    className="flex-1"
                  >
                    {subscription ? 'Alterar Plano' : 'Assinar Plano'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Faturas */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              📄 Histórico de Faturas
            </h2>

            {loadingInvoices ? (
              <div className="text-center text-gray-500 py-4">Carregando...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Nenhuma fatura disponível
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status === 'paid' ? 'Pago' : 
                         invoice.status === 'pending' ? 'Pendente' : invoice.status}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      R$ {invoice.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Período: {new Date(invoice.period_start).toLocaleDateString('pt-BR')} - {' '}
                      {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              ⚡ Ações Rápidas
            </h2>
            <div className="space-y-2">
              <Button
                onClick={scrollToPlans}
                className="w-full"
                variant="outline"
              >
                Ver Planos Disponíveis
              </Button>
              <Button
                onClick={() => window.location.hash = '#/perfil'}
                className="w-full"
                variant="outline"
              >
                Configurações da Conta
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Seção de Planos - Unificada na página */}
      <div id="plans-section" className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Escolha seu Plano
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Selecione o plano que melhor se adequa às suas necessidades.
            Todos os planos incluem acesso completo à plataforma.
          </p>
        </div>

        {/* Planos */}
        {loadingPlans ? (
          <div className="text-center text-gray-500 py-8">Carregando planos...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {plans.map((planItem) => {
                // Comparar por nome ou slug (plan vem de 'plans', planItem vem de 'app_plans')
                const isCurrentPlan = plan && (plan.name === planItem.name || plan.id === planItem.id);
                // Destacar plano Anual VIP (mais popular B2C) ou planos específicos
                const isFeatured = planItem.plan_group === 'b2c' && planItem.billing_period === 'anual';
                const features = getFeatureList(planItem);

                return (
                  <Card
                    key={planItem.id}
                    className={`relative p-8 ${
                      isFeatured
                        ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                        : ''
                    } ${
                      isCurrentPlan
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300'
                        : ''
                    }`}
                  >
                    {/* Badge Destaque */}
                    {isFeatured && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Mais Popular
                        </span>
                      </div>
                    )}

                    {/* Badge Plano Atual */}
                    {isCurrentPlan && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Seu Plano
                        </span>
                      </div>
                    )}

                    {/* Header do Plano */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {planItem.name}
                      </h3>
                      {planItem.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                          {planItem.description}
                        </p>
                      )}
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                        {formatPrice(planItem.price)}
                      </div>
                      {planItem.price === 0 && (
                        <p className="text-sm text-slate-500">para sempre</p>
                      )}
                    </div>

                    {/* Limites */}
                    <div className="mb-6 space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Requisições/mês</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {planItem.requests_per_month.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Análises de Imagem</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {planItem.image_analysis_per_month.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {planItem.voice_messages_per_month > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-slate-600 dark:text-slate-400">Mensagens de Voz</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {planItem.voice_messages_per_month.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                          Recursos Incluídos:
                        </h4>
                        <ul className="space-y-2">
                          {features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Botão de Ação */}
                    <Button
                      onClick={() => handleSelectPlan(planItem)}
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-gray-400 hover:bg-gray-500'
                          : isFeatured
                          ? 'bg-primary-600 hover:bg-primary-700'
                          : ''
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan
                        ? 'Plano Atual'
                        : plan && plan.price && planItem.price > plan.price
                        ? 'Fazer Upgrade'
                        : 'Selecionar Plano'}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {/* Informações Adicionais */}
            <Card className="p-6 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                ℹ️ Informações Importantes
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  • Todos os planos são renovados automaticamente no final de cada período.
                </li>
                <li>
                  • Você pode cancelar ou alterar seu plano a qualquer momento.
                </li>
                <li>
                  • Os limites são resetados no início de cada período de cobrança.
                </li>
                <li>
                  • Você receberá alertas por email ao atingir 80% e 100% do limite.
                </li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingPage;

import React, { useState, useEffect } from 'react';
import { useSpendingTracker, UsageIndicator, SpendingReport } from '../hooks/useSpendingTracker';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useUser } from '../context/UserContext';
// Router navigation via window.location.hash
import { supabase } from '../services/supabaseClient';
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
  const [pageError, setPageError] = useState<string | null>(null);

  // Tratamento de erro do hook useSpendingTracker
  useEffect(() => {
    if (error) {
      console.error('Erro no useSpendingTracker:', error);
      setPageError(error);
    }
  }, [error]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) {
        setLoadingInvoices(false);
        return;
      }

      try {
        // Obter UUID do usuário se user.id for string (username)
        let userIdForQuery = user.id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        
        if (!isUUID) {
          // Buscar UUID do usuário na tabela users pelo username
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('username', user.id)
            .maybeSingle();
          
          if (userError) {
            console.warn('Erro ao buscar UUID do usuário para invoices:', userError);
            setLoadingInvoices(false);
            return;
          }
          
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

        if (error) {
          // Erro 406 ou similar não é crítico - apenas não há invoices
          if (error.code === 'PGRST116' || error.status === 406) {
            setInvoices([]);
          } else {
            throw error;
          }
        } else {
          setInvoices(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar faturas:', err);
        setPageError('Erro ao carregar faturas. Tente recarregar a página.');
        setInvoices([]); // Definir array vazio em caso de erro
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [user?.id]);

  // Função para redirecionar para a página de vendas externa
  const redirectToSalesPage = () => {
    window.open('https://pagina-de-vendas-fit-coach-ai.vercel.app/', '_blank');
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
            <Button onClick={redirectToSalesPage}>
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

      {/* Mostrar erro da página se houver */}
      {pageError && (
        <div className="mb-6">
          <Alert type="error" title="Atenção">
            {pageError}
          </Alert>
        </div>
      )}

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
              onClick={redirectToSalesPage}
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
                Você está usando {(usage?.percentage ?? 0).toFixed(0)}% do seu limite mensal.
              </p>
            </div>
            <Button
              onClick={redirectToSalesPage}
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
                Plano padrão: <strong>{plan.name}</strong> (R$ {(plan.price ?? 0).toFixed(2)}/mês)
              </p>
              <p className="text-sm text-blue-500 mt-2">
                Selecione um plano para começar a usar todas as funcionalidades.
              </p>
            </div>
            <Button
              onClick={redirectToSalesPage}
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
                    onClick={redirectToSalesPage}
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
                      R$ {(invoice.amount ?? 0).toFixed(2)}
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
                onClick={redirectToSalesPage}
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

    </div>
  );
};

export default BillingPage;

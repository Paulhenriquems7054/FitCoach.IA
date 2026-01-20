import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
// Router navigation via window.location.hash
import { supabase } from '../services/supabaseClient';
import { useSpendingTracker } from '../hooks/useSpendingTracker';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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

const PlansPage: React.FC = () => {
  const { user } = useUser();
  const { plan: currentPlan, subscription } = useSpendingTracker();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (selectedPlan: Plan) => {
    // Se já está no plano selecionado, redirecionar para billing
    if (currentPlan?.id === selectedPlan.id) {
      window.location.hash = '#/billing';
      return;
    }

    // TODO: Implementar checkout/upgrade
    // Por enquanto, redirecionar para página de billing com modal de upgrade
    window.location.hash = `#/billing?upgrade=${selectedPlan.id}`;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `R$ ${price.toFixed(2)}/mês`;
  };

  const getFeatureList = (features: Record<string, any>) => {
    const featureList: string[] = [];
    
    if (features?.ai_analysis) featureList.push('Análise com IA');
    if (features?.export_pdf) featureList.push('Exportar PDF');
    if (features?.advanced_reports) featureList.push('Relatórios Avançados');
    if (features?.priority_support) featureList.push('Suporte Prioritário');
    if (features?.custom_diet) featureList.push('Dieta Personalizada');

    return featureList;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Carregando planos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro</h2>
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Escolha seu Plano
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Selecione o plano que melhor se adequa às suas necessidades.
          Todos os planos incluem acesso completo à plataforma.
        </p>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const isFeatured = plan.is_featured;
          const features = getFeatureList(plan.features);

          return (
            <Card
              key={plan.id}
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
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    {plan.description}
                  </p>
                )}
                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {formatPrice(plan.price)}
                </div>
                {plan.price === 0 && (
                  <p className="text-sm text-slate-500">para sempre</p>
                )}
              </div>

              {/* Limites */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Requisições/mês</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {plan.requests_per_month.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Análises de Imagem</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {plan.image_analysis_per_month.toLocaleString('pt-BR')}
                  </span>
                </div>
                {plan.voice_messages_per_month > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Mensagens de Voz</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.voice_messages_per_month.toLocaleString('pt-BR')}
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
                onClick={() => handleSelectPlan(plan)}
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
                  : currentPlan && plan.price > (currentPlan.price || 0)
                  ? 'Fazer Upgrade'
                  : 'Selecionar Plano'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Informações Adicionais */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          ℹ️ Informações Importantes
        </h2>
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

      {/* Link para Billing */}
      {currentPlan && (
        <div className="text-center mt-8">
          <Button
            onClick={() => window.location.hash = '#/billing'}
            variant="outline"
          >
            Gerenciar Assinatura Atual
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlansPage;

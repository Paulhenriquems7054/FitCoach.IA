/**
 * Página de Planos de IA para Alunos (B2B2C)
 * Exibe planos individuais de uso da IA (chat, voz, visão)
 */

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
// import { useRouter } from '../hooks/useRouter';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { SparklesIcon, ChatBubbleLeftRightIcon, MicrophoneIcon, PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getAiAccessStatus } from '../services/aiAccessService';
import { logger } from '../utils/logger';

interface AiPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'annual';
  checkoutUrl: string;
  checkoutPrice: number;
  features: {
    chat: boolean;
    voice: boolean;
    vision: boolean;
    plan: boolean;
  };
  limits: {
    chatMessages?: number; // -1 = ilimitado
    voiceMinutes?: number; // minutos por dia
    visionScans?: number; // -1 = ilimitado
    plans?: number; // -1 = ilimitado
  };
  popular?: boolean;
  description?: string;
  savings?: number;
  installments?: { count: number; value: number };
}

const AI_PLANS: AiPlan[] = [
  {
    id: 'ai_monthly',
    name: 'Plano Mensal',
    price: 34.90,
    period: 'monthly',
    checkoutUrl: 'https://pay.cakto.com.br/3ujuqzz_703304',
    checkoutPrice: 35.89,
    features: {
      chat: true,
      voice: true,
      vision: true,
      plan: true,
    },
    limits: {
      chatMessages: -1, // Ilimitado
      voiceMinutes: 15, // 15 min/dia
      visionScans: -1, // Ilimitado
      plans: -1, // Ilimitado
    },
    description: 'Análise de fotos e treinos com IA, treinos personalizados sob demanda, chat de texto ilimitado, 15 min/dia de consultoria de voz (Live). Cobrança individual, cancelamento a qualquer momento.',
  },
  {
    id: 'ai_annual_vip',
    name: 'Plano Anual VIP',
    price: 297.00,
    period: 'annual',
    checkoutUrl: 'https://pay.cakto.com.br/xphpm5f_703310',
    checkoutPrice: 297.99,
    features: {
      chat: true,
      voice: true,
      vision: true,
      plan: true,
    },
    limits: {
      chatMessages: -1, // Ilimitado
      voiceMinutes: 15, // 15 min/dia
      visionScans: -1, // Ilimitado
      plans: -1, // Ilimitado
    },
    popular: true,
    description: 'Tudo do plano mensal + economia de R$ 200,00 + acesso imediato + garantia de satisfação. Pagamento: à vista ou 12x de R$ 34,53.',
    savings: 200.00,
    installments: { count: 12, value: 34.53 },
  },
];

export const StudentAiPlansPage: React.FC = () => {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é aluno
  if (!user || user.tenantRole !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Alert type="error" title="Acesso Negado">
            Esta página é apenas para alunos.
          </Alert>
        </Card>
      </div>
    );
  }

  const handleSelectPlan = async (plan: AiPlan) => {
    setSelectedPlan(plan.id);
    setError(null);
    
    try {
      setIsProcessing(true);
      
      // Redirecionar para checkout Cakto diretamente
      if (plan.checkoutUrl) {
        logger.info(`Redirecionando para checkout: ${plan.checkoutUrl}`, 'StudentAiPlansPage');
        window.open(plan.checkoutUrl, '_blank');
      } else {
        // Fallback: redirecionar para página de vendas externa (seção B2C)
        const { redirectToSalesPage } = await import('../constants/salesPage');
        redirectToSalesPage('B2C_PRICING');
      }
    } catch (err: any) {
      logger.error('Erro ao selecionar plano', 'StudentAiPlansPage', err);
      setError('Erro ao processar seleção. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Planos Individuais - Uso da IA
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Escolha o plano ideal para continuar usando todas as funcionalidades de IA
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" title="Erro">
              {error}
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {AI_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'ring-2 ring-emerald-500 scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Vantajoso
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    {plan.period === 'annual' ? (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-4xl font-bold text-emerald-600">
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-slate-600">/ano</span>
                        </div>
                        {plan.savings && (
                          <div className="mt-2">
                            <span className="text-sm text-green-600 font-semibold">
                              Economia de R$ {plan.savings.toFixed(2).replace('.', ',')}
                            </span>
                        {plan.installments && (
                          <p className="text-sm text-slate-500 mt-1">
                            ou {plan.installments.count}x de R$ {plan.installments.value.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-emerald-600">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-slate-600 ml-2">/mês</span>
                        <p className="text-xs text-slate-500 mt-1">
                          Checkout: R$ {plan.checkoutPrice.toFixed(2).replace('.', ',')}
                        </p>
                      </>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-slate-600 text-left mt-4">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">chat_ilimitado</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">voz_15min_dia</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">analise_fotos_ilimitada</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">treinos_personalizados</span>
                  </div>
                  
                  {plan.period === 'annual' && (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">garantia_satisfacao</span>
                    </div>
                  )}
                  
                  {plan.period === 'monthly' && (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">cancelamento_qualquer_momento</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isProcessing && selectedPlan === plan.id
                    ? 'Processando...'
                    : 'Assinar Agora'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600">
            Todos os planos incluem suporte e atualizações. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentAiPlansPage;


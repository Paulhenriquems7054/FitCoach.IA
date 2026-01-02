import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { XIcon } from './icons/XIcon';

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export const SubscriptionSuccessModal: React.FC<SubscriptionSuccessModalProps> = ({
  isOpen,
  onClose,
  planName
}) => {
  if (!isOpen) return null;

  // Formatar nome do plano para exibição
  const formatPlanName = (plan: string): string => {
    const planNames: Record<string, string> = {
      ai_monthly: 'Plano Mensal de IA',
      ai_annual_vip: 'Plano Anual VIP de IA',
      monthly: 'Plano Mensal',
      annual_vip: 'Plano Anual VIP',
    };
    return planNames[plan] || plan;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-modal="true">
      <Card className="w-full max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              aria-label="Fechar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              🎉 Assinatura Ativada!
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-1">
              Seu plano foi ativado com sucesso
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {formatPlanName(planName)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 p-4 sm:p-6 rounded-lg border-2 border-green-300 dark:border-green-700 mb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 text-center mb-3">
              ✅ Todas as funcionalidades Premium foram desbloqueadas!
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Relatórios semanais de IA</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Gerador de planos alimentares</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Análise de pratos por foto</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Acesso completo às funcionalidades Premium</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={onClose}
            className="w-full"
            variant="primary"
          >
            Começar a Usar
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
            💡 As funcionalidades já estão disponíveis. Você pode começar a usar agora mesmo!
          </p>
        </div>
      </Card>
    </div>
  );
};

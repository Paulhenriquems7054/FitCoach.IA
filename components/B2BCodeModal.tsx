import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from './ui/Toast';
import { XIcon } from './icons/XIcon';

interface B2BCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  planName: string;
  maxActivations: number;
}

export const B2BCodeModal: React.FC<B2BCodeModalProps> = ({
  isOpen,
  onClose,
  code,
  planName,
  maxActivations
}) => {
  const { showSuccess } = useToast();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      showSuccess('Código copiado para a área de transferência!');
    }).catch(() => {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('Código copiado!');
    });
  };

  // Formatar nome do plano para exibição
  const formatPlanName = (plan: string): string => {
    const planNames: Record<string, string> = {
      academy_starter: 'Academy Starter',
      academy_growth: 'Academy Growth',
      academy_pro: 'Academy Pro',
      personal_team_5: 'Personal Team 5',
      personal_team_15: 'Personal Team 15',
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
              🎉 Pagamento Confirmado!
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-1">
              Seu código de ativação foi gerado com sucesso
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Plano: {formatPlanName(planName)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 sm:p-6 rounded-lg border-2 border-primary-300 dark:border-primary-700 mb-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
              Compartilhe este código com seus alunos
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 font-mono text-center mb-2 tracking-wider">
              {code}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
              Até {maxActivations} ativações disponíveis
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopy}
              className="flex-1"
              variant="primary"
            >
              📋 Copiar Código
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
              variant="secondary"
            >
              Fechar
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-4">
            💡 Você também pode acessar este código a qualquer momento na página Premium
          </p>
        </div>
      </Card>
    </div>
  );
};

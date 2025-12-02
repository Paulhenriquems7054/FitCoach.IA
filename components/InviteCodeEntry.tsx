import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { couponService, type CouponValidationError } from '../services/supabaseService';
import { useToast } from './ui/Toast';

interface InviteCodeEntryProps {
  onCodeValidated: (couponCode: string) => void;
  onSkip?: () => void; // Opção para pular e ir direto para login
}

export const InviteCodeEntry: React.FC<InviteCodeEntryProps> = ({ onCodeValidated, onSkip }) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const errorMessages: Record<CouponValidationError, string> = {
    CUPOM_INEXISTENTE: 'Código de convite não encontrado',
    CUPOM_INATIVO: 'Este código de convite não está mais ativo',
    CUPOM_ESGOTADO: 'Este código de convite já foi usado o máximo de vezes',
    CUPOM_EXPIRADO: 'Este código de convite expirou',
    CUPOM_NAO_VALIDO: 'Este código de convite ainda não está válido',
    LIMITE_CONTAS_ATINGIDO: 'Limite de contas vinculadas atingido para este pagamento',
    PAGAMENTO_INATIVO: 'O pagamento vinculado a este código não está ativo',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Por favor, digite um código de convite');
      return;
    }

    setIsValidating(true);

    try {
      const result = await couponService.validateCoupon(code.trim().toUpperCase());

      if (result.success) {
        showToast('Código válido! Redirecionando...', 'success');
        onCodeValidated(code.trim().toUpperCase());
      } else {
        const errorMessage = result.error 
          ? errorMessages[result.error] || result.message || 'Código inválido'
          : result.message || 'Código inválido';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      let errorMessage = 'Erro ao validar código';
      
      if (err instanceof Error) {
        // Verificar se é erro de configuração do Supabase
        if (err.message.includes('Variáveis de ambiente do Supabase')) {
          errorMessage = 'Supabase não configurado. Verifique o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY';
        } else if (err.message.includes('For security purposes') || err.message.includes('rate limit') || err.message.includes('seconds')) {
          // Tratar rate limiting
          const match = err.message.match(/(\d+)\s*seconds?/);
          const seconds = match ? match[1] : 'alguns';
          errorMessage = `Muitas tentativas. Aguarde ${seconds} segundos antes de tentar novamente.`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 relative overflow-hidden">
      {/* Logo de fundo suave */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/icons/play_store_512.png"
          alt="Logo FitCoach.IA"
          className="select-none opacity-25 dark:opacity-15 w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] object-contain"
        />
      </div>

      <Card className="w-full max-w-md relative z-10">
        <div className="p-6 space-y-6">
          {/* Logo centralizada no topo */}
          <div className="flex justify-center mb-4">
            <img
              src="/icons/play_store_512.png"
              alt="Logo FitCoach.IA"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Código de Convite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Digite o código de convite que você recebeu para acessar o FitCoach.IA
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Convite
              </label>
              <input
                id="invite-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Ex: ACADEMIA-VIP"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                disabled={isValidating}
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <Alert type="error" title="Erro">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isValidating || !code.trim()}
            >
              {isValidating ? 'Validando...' : 'Continuar'}
            </Button>
          </form>

          {onSkip && (
            <div className="text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Já tenho uma conta
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};


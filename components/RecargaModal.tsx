/**
 * Modal de Recarga FitVoice
 * Exibido quando o aluno atinge o limite de minutos de voz
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { criarRecarga, RECARGAS_DISPONIVEIS, type TipoRecarga } from '../services/recargaService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';

interface RecargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  minutosRestantes?: number;
  onRecargaCriada?: (recargaId: string) => void;
}

export function RecargaModal({
  isOpen,
  onClose,
  minutosRestantes = 0,
  onRecargaCriada
}: RecargaModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecarga, setSelectedRecarga] = useState<TipoRecarga | null>(null);

  if (!isOpen) return null;

  const handleSelecionarRecarga = (tipo: TipoRecarga) => {
    setSelectedRecarga(tipo);
    setError(null);
  };

  const handleComprar = async () => {
    if (!selectedRecarga || !user?.id) {
      setError('Selecione um pacote de recarga');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await criarRecarga(user.id as string, selectedRecarga);

      if (!resultado.success) {
        setError(resultado.error || 'Erro ao criar recarga');
        return;
      }

      // TODO: Redirecionar para checkout (Cakto/Stripe)
      // Por enquanto, apenas notificar
      if (resultado.checkoutUrl) {
        window.open(resultado.checkoutUrl, '_blank');
      } else if (resultado.recargaId) {
        // Simular abertura de checkout
        alert(`Recarga criada! ID: ${resultado.recargaId}\n\nRedirecionando para pagamento...`);
        // TODO: Implementar redirecionamento real para checkout
        if (onRecargaCriada) {
          onRecargaCriada(resultado.recargaId);
        }
      }

      // Fechar modal após sucesso
      onClose();
    } catch (err) {
      logger.error('Erro ao criar recarga', 'RecargaModal', err);
      setError('Erro ao processar recarga. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const recargaSelecionada = selectedRecarga
    ? RECARGAS_DISPONIVEIS.find(r => r.tipo === selectedRecarga)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <Card className="relative z-10 w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recarregar Minutos de Voz
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Aviso de limite */}
            {minutosRestantes === 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Você atingiu o limite de minutos de voz do seu plano.
                  <br />
                  Adquira uma recarga FitVoice para continuar usando.
                </p>
              </div>
            )}

            {minutosRestantes > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Você tem apenas <strong>{minutosRestantes} minutos</strong> restantes.
                  <br />
                  Recarregue agora para não perder acesso.
                </p>
              </div>
            )}

            {/* Opções de recarga */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selecione um pacote:
              </p>

              {RECARGAS_DISPONIVEIS.map((recarga) => {
                const isSelected = selectedRecarga === recarga.tipo;
                const precoPorMinuto = (recarga.preco / recarga.minutos).toFixed(2);

                return (
                  <button
                    key={recarga.tipo}
                    onClick={() => handleSelecionarRecarga(recarga.tipo)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {recarga.nome}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {recarga.descricao}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          R$ {precoPorMinuto}/minuto
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          R$ {recarga.preco.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Info adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Os minutos comprados são adicionados ao seu saldo extra e não expiram.
                Eles serão usados automaticamente quando você ultrapassar o limite mensal do seu plano.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 p-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComprar}
              disabled={loading || !selectedRecarga}
              loading={loading}
            >
              {recargaSelecionada
                ? `Comprar ${recargaSelecionada.nome} - R$ ${recargaSelecionada.preco.toFixed(2)}`
                : 'Selecione um pacote'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

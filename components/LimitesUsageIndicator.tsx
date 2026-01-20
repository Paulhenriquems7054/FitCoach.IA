/**
 * Indicador de Uso de Limites (Novo Modelo)
 * Exibe uso atual de texto, imagem e voz do aluno
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { obterInfoUsoAluno } from '../services/novoAiAccessService';
import { logger } from '../utils/logger';
import { RecargaModal } from './RecargaModal';

interface LimitesUsageIndicatorProps {
  onRecarregarVoz?: () => void;
}

export function LimitesUsageIndicator({ onRecarregarVoz }: LimitesUsageIndicatorProps) {
  const { user } = useUser();
  const [infoUso, setInfoUso] = useState<{
    texto: { usado: number; limite: number; restante: number };
    imagem: { usado: number; limite: number; restante: number };
    voz: { usado: number; limite: number; saldoExtra: number; restante: number };
    modoDemo?: { usado: number; limite: number; restante: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecargaModal, setShowRecargaModal] = useState(false);

  useEffect(() => {
    const fetchInfoUso = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const info = await obterInfoUsoAluno(user.id as string);
        setInfoUso(info);
      } catch (error) {
        logger.error('Erro ao buscar info de uso', 'LimitesUsageIndicator', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfoUso();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchInfoUso, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading || !infoUso) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Carregando limites...
      </div>
    );
  }

  // Função auxiliar para calcular porcentagem
  const calcularPorcentagem = (usado: number, limite: number): number => {
    if (limite === 0) return 0;
    return Math.min(100, (usado / limite) * 100);
  };

  // Função auxiliar para cor da barra
  const getBarColor = (porcentagem: number): string => {
    if (porcentagem >= 100) return 'bg-red-500';
    if (porcentagem >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Renderizar indicador de limite
  const renderLimite = (
    label: string,
    usado: number,
    limite: number,
    restante: number,
    unidade: string = ''
  ) => {
    const porcentagem = calcularPorcentagem(usado, limite);
    const barColor = getBarColor(porcentagem);

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          <span className={`font-medium ${
            porcentagem >= 100 ? 'text-red-600' :
            porcentagem >= 80 ? 'text-yellow-600' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {usado} / {limite} {unidade}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(porcentagem, 100)}%` }}
          />
        </div>
        {porcentagem >= 80 && restante > 0 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Restam apenas {restante} {unidade}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Limites do Plano
      </h3>

      {/* Modo Demo (se ativo) */}
      {infoUso.modoDemo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            🎁 Modo Demo Ativo: {infoUso.modoDemo.usado} / {infoUso.modoDemo.limite} interações
          </p>
        </div>
      )}

      {/* Limites principais */}
      <div className="space-y-3">
        {/* Texto */}
        {infoUso.texto.limite > 0 && renderLimite(
          'Mensagens de Texto',
          infoUso.texto.usado,
          infoUso.texto.limite,
          infoUso.texto.restante,
          'mensagens'
        )}

        {/* Imagem */}
        {infoUso.imagem.limite > 0 && renderLimite(
          'Análises de Imagem',
          infoUso.imagem.usado,
          infoUso.imagem.limite,
          infoUso.imagem.restante,
          'análises'
        )}

        {/* Voz */}
        {infoUso.voz.limite > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Minutos de Voz</span>
              <span className={`font-medium ${
                infoUso.voz.restante <= 0 ? 'text-red-600' :
                infoUso.voz.restante <= (infoUso.voz.limite * 0.2) ? 'text-yellow-600' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {infoUso.voz.usado} / {infoUso.voz.limite + infoUso.voz.saldoExtra} min
                {infoUso.voz.saldoExtra > 0 && (
                  <span className="text-green-600 ml-1">
                    (+{infoUso.voz.saldoExtra} extra)
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  infoUso.voz.restante <= 0 ? 'bg-red-500' :
                  infoUso.voz.restante <= (infoUso.voz.limite * 0.2) ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    ((infoUso.voz.usado / (infoUso.voz.limite + infoUso.voz.saldoExtra)) * 100) || 0
                  )}%`
                }}
              />
            </div>
            {infoUso.voz.restante <= 0 && (
              <button
                onClick={() => {
                  setShowRecargaModal(true);
                  if (onRecarregarVoz) onRecarregarVoz();
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                ⚠️ Sem minutos restantes. Recarregue agora →
              </button>
            )}
            {infoUso.voz.restante > 0 && infoUso.voz.restante <= (infoUso.voz.limite * 0.2) && (
              <button
                onClick={() => {
                  setShowRecargaModal(true);
                  if (onRecarregarVoz) onRecarregarVoz();
                }}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
              >
                ⚠️ Restam apenas {infoUso.voz.restante} minutos. Recarregue →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Recarga */}
      <RecargaModal
        isOpen={showRecargaModal}
        onClose={() => setShowRecargaModal(false)}
        minutosRestantes={infoUso.voz.restante}
        onRecarregarCriada={(recargaId) => {
          console.log('Recarga criada:', recargaId);
          // Atualizar info de uso após recarga criada
          setTimeout(() => {
            if (user?.id) {
              obterInfoUsoAluno(user.id as string).then(setInfoUso);
            }
          }, 1000);
        }}
      />
    </div>
  );
}

/**
 * Componente de contador de minutos de voz em tempo real
 * Exibe minutos restantes durante uso do chat de voz
 */

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useUser } from '../context/UserContext';

interface VoiceMinutesCounterProps {
  isActive: boolean; // Se o chat de voz está ativo
  onMinutesExhausted?: () => void; // Callback quando minutos acabarem
}

export function VoiceMinutesCounter({ 
  isActive, 
  onMinutesExhausted 
}: VoiceMinutesCounterProps) {
  const { user } = useUser();
  const { getRemainingMinutes, status } = useSubscription();
  const [remainingMinutes, setRemainingMinutes] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    if (!isActive || !user?.id) return;

    const updateMinutes = () => {
      const remaining = getRemainingMinutes();
      setRemainingMinutes(remaining);
      setIsUnlimited(remaining === Infinity);

      // Verificar se minutos acabaram
      if (remaining <= 0 && !isUnlimited && onMinutesExhausted) {
        onMinutesExhausted();
      }
    };

    // Atualizar imediatamente
    updateMinutes();

    // Atualizar a cada 10 segundos durante uso ativo
    const interval = setInterval(updateMinutes, 10000);

    return () => clearInterval(interval);
  }, [isActive, user?.id, getRemainingMinutes, isUnlimited, onMinutesExhausted]);

  if (!isActive || !status?.isActive) {
    return null;
  }

  // Não mostrar se não tem acesso
  if (!status.features.voiceChat) {
    return null;
  }

  return (
    <div className="voice-minutes-counter fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs opacity-90">Minutos restantes</span>
        <span className="text-lg font-bold">
          {isUnlimited ? '∞' : Math.max(0, remainingMinutes)}
        </span>
      </div>
      {remainingMinutes <= 5 && !isUnlimited && (
        <div className="ml-2 px-2 py-1 bg-yellow-500 rounded text-xs font-semibold animate-pulse">
          Poucos minutos!
        </div>
      )}
    </div>
  );
}


/**
 * Nutri.ai - Assistente de Voz com Gemini Live API
 * Funcionalidades:
 * - Conversa por voz em tempo real
 * - Registro automático de refeições (logMeal tool)
 * - Contexto personalizado (perfil, plano, diário)
 * - Medidor de volume visual
 * - Interface específica com avatar do chef
 * - Detecção de interrupções
 * - Timer de 15 minutos com upsell
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startLiveAudioSession, stopLiveAudioSession, playAudioChunk, VOICE_OPTIONS } from '../../chatbot/services/geminiService';
import { buildNutriSystemInstruction } from '../../services/nutriContextService';
import { addMealToLog, getTodayMeals } from '../../services/dailyLogService';
import { useUser } from '../../context/UserContext';
import { useToast } from '../ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { logger } from '../../utils/logger';
import { RechargeModal } from '../RechargeModal';

interface NutriVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const MAX_SESSION_TIME = 15 * 60 * 1000; // 15 minutos em milissegundos

export const NutriVoiceAssistant: React.FC<NutriVoiceAssistantProps> = ({ isOpen, onClose, onOpen }) => {
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const { canAccess, getRemainingMinutes } = useSubscription();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isMicOn, setIsMicOn] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0-100
  const [timeRemaining, setTimeRemaining] = useState(15); // minutos
  const [showUpsell, setShowUpsell] = useState(false);
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
  const [mealNotification, setMealNotification] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  
  const sessionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer de 15 minutos
  useEffect(() => {
    if (isConnected && sessionStartTimeRef.current > 0) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - sessionStartTimeRef.current;
        const remaining = Math.max(0, MAX_SESSION_TIME - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        setTimeRemaining(minutes);
        
        if (remaining <= 0) {
          handleTimeLimitReached();
        }
      }, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [isConnected]);

  // O medidor de volume é atualizado via callback do startLiveAudioSession

  const handleTimeLimitReached = useCallback(() => {
    setShowUpsell(true);
    stopSession();
  }, []);

  const handleMealLogged = useCallback((meal: {
    foodName: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType: string;
    description?: string;
  }) => {
    try {
      const mealItem = addMealToLog({
        foodName: meal.foodName,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        mealType: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        description: meal.description,
      });
      
      const notification = `✅ ${meal.foodName} registrado! ${meal.calories ? `${meal.calories} kcal` : ''}`;
      setMealNotification(notification);
      showSuccess(notification);
      
      // Remover notificação após 3 segundos
      setTimeout(() => setMealNotification(null), 3000);
    } catch (error) {
      logger.error('Erro ao registrar refeição', 'NutriVoiceAssistant', error);
      showError('Erro ao registrar refeição');
    }
  }, [showSuccess, showError]);

  // Ref para manter referência ao estado do mute atualizado
  const isMicMutedRef = useRef(!isMicOn);
  
  useEffect(() => {
    isMicMutedRef.current = !isMicOn;
  }, [isMicOn]);

  const startSession = useCallback(async () => {
    if (!canAccess('voice')) {
      showError('Você não tem acesso a esta funcionalidade.');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Construir instruções do sistema com contexto do usuário
      const systemInstruction = await buildNutriSystemInstruction(user);
      
      await startLiveAudioSession(
        (chunk) => {
          if (chunk.trim()) {
            setCurrentInputTranscription((prev) => prev + chunk);
          }
        },
        (audioBuffer) => {
          playAudioChunk(audioBuffer);
        },
        (transcriptionChunk) => {
          setCurrentOutputTranscription((prev) => prev + transcriptionChunk);
        },
        (results) => {
          if (results.mealLogged) {
            // Refeição já foi registrada via callback
          }
        },
        () => {
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionStatus('connected');
          sessionStartTimeRef.current = Date.now();
        },
        (error, isApiKeyError) => {
          setIsConnecting(false);
          setConnectionStatus('error');
          showError(error);
          if (isApiKeyError) {
            logger.error('Erro de API key', 'NutriVoiceAssistant');
          }
        },
        () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        },
        VOICE_OPTIONS.find(v => v.value === 'Kore')?.value || 'Kore',
        systemInstruction,
        (toolName, query) => {
          logger.debug(`Tool chamado: ${toolName}`, 'NutriVoiceAssistant');
        },
        (toolName) => {
          logger.debug(`Tool concluído: ${toolName}`, 'NutriVoiceAssistant');
        },
        false, // useWebSearch
        false, // useMapsSearch
        true,  // useMealLogging
        handleMealLogged,
        (level) => setVolumeLevel(level), // Callback de volume
        () => isMicMutedRef.current // Função para obter estado do mute dinamicamente
      );
    } catch (error: any) {
      setIsConnecting(false);
      setConnectionStatus('error');
      showError(`Erro ao iniciar conversa: ${error.message || 'Erro desconhecido'}`);
      logger.error('Erro ao iniciar sessão', 'NutriVoiceAssistant', error);
    }
  }, [user, canAccess, showError, handleMealLogged]);

  const stopSession = useCallback(async () => {
    await stopLiveAudioSession();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setCurrentInputTranscription('');
    setCurrentOutputTranscription('');
    setTimeRemaining(15);
    sessionStartTimeRef.current = 0;
    
    // Limpar recursos de áudio
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen, stopSession]);

  // Se o modal não estiver aberto, mostrar apenas o botão flutuante
  if (!isOpen) {
    return (
      <button
        onClick={() => onOpen?.()}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
        aria-label="Abrir Nutri.ai - Assistente de Voz"
        title="Nutri.ai - Conversa por voz"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com avatar do chef */}
        <div className="bg-gradient-to-r from-emerald-500 to-sky-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
              👨‍🍳
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Nutri.ai</h2>
              <p className="text-emerald-50/90">Sua nutricionista pessoal por voz</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6 space-y-4">
          {/* Status da conexão */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'connecting' ? 'Conectando...' :
                 connectionStatus === 'error' ? 'Erro na conexão' :
                 'Desconectado'}
              </span>
            </div>
            {isConnected && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                ⏱️ {timeRemaining} min restantes
              </div>
            )}
          </div>

          {/* Medidor de volume */}
          {isConnected && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Volume do microfone</span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-sky-500 transition-all duration-100"
                    style={{ width: `${volumeLevel}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 w-8 text-right">
                  {Math.round(volumeLevel)}%
                </span>
              </div>
            </div>
          )}

          {/* Transcrições */}
          <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
            {currentInputTranscription && (
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Você:</p>
                <p className="text-sm text-slate-800 dark:text-slate-200">{currentInputTranscription}</p>
              </div>
            )}
            {currentOutputTranscription && (
              <div className="bg-sky-100 dark:bg-sky-900/30 rounded-lg p-3">
                <p className="text-xs text-sky-700 dark:text-sky-300 font-medium mb-1">Nutri.ai:</p>
                <p className="text-sm text-slate-800 dark:text-slate-200">{currentOutputTranscription}</p>
              </div>
            )}
            {!currentInputTranscription && !currentOutputTranscription && isConnected && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                <p className="text-sm">Fale algo para começar a conversa...</p>
              </div>
            )}
          </div>

          {/* Notificação de refeição registrada */}
          {mealNotification && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 animate-fade-in">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">{mealNotification}</p>
            </div>
          )}

          {/* Controles */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {!isConnected && !isConnecting && (
              <button
                onClick={startSession}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-full font-semibold hover:from-emerald-600 hover:to-sky-600 transition shadow-lg"
              >
                🎤 Iniciar Conversa
              </button>
            )}
            
            {isConnected && (
              <>
                <button
                  onClick={toggleMic}
                  className={`p-4 rounded-full transition ${
                    isMicOn
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                  aria-label={isMicOn ? 'Desligar microfone' : 'Ligar microfone'}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    {isMicOn ? (
                      <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm7-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z" />
                    ) : (
                      <>
                        <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11ZM12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Z" />
                        <path d="M3.71 2.29a1 1 0 0 0-1.42 1.42l18 18a1 1 0 0 0 1.42-1.42Z" />
                      </>
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-lg text-sm"
                  title="Comprar mais tempo"
                >
                  ⚡ + Tempo
                </button>
                <button
                  onClick={stopSession}
                  className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition shadow-lg"
                >
                  Encerrar Conversa
                </button>
              </>
            )}
            
            {isConnecting && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Conectando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Upsell */}
        {showUpsell && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Tempo esgotado</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Você atingiu o limite de 15 minutos diários. Compre mais tempo para continuar conversando!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowUpsell(false);
                    setShowRechargeModal(true);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold"
                >
                  ⚡ Comprar Mais Tempo (R$ 5,00)
                </button>
                <button
                  onClick={() => {
                    setShowUpsell(false);
                    // Se for aluno, redirecionar para página de vendas externa (seção recargas)
                    const isStudent = user?.tenantRole === 'student' && user?.academyId;
                    if (isStudent) {
                      import('../../constants/salesPage').then(({ redirectToSalesPage }) => {
                        redirectToSalesPage('RECHARGE');
                      });
                    } else {
                      window.location.hash = '#/premium';
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-lg hover:from-emerald-600 hover:to-sky-600 transition"
                >
                  Ver Planos Completos
                </button>
                <button
                  onClick={() => {
                    setShowUpsell(false);
                    onClose();
                  }}
                  className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recarga */}
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          onSuccess={() => {
            setShowRechargeModal(false);
            showSuccess('Recarga comprada! Você pode continuar conversando.');
          }}
        />
      </div>
    </div>
  );
};


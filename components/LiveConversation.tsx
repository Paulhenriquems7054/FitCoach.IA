/**
 * LiveConversation - Componente para conversa por voz com IA
 * 
 * Como funciona:
 * - Verifica acesso via Edge Function do Supabase
 * - Conecta ao Gemini Live API (streaming bidirecional)
 * - Captura áudio do microfone (PCM 16kHz)
 * - Envia áudio em tempo real para a IA
 * - Recebe áudio de resposta e reproduz
 * - Consome tempo a cada minuto:
 *   - Prioridade 1: VIP (Premium Unlimited) - não desconta
 *   - Prioridade 2: Gratuito (15 min/dia) - reseta diariamente
 *   - Prioridade 3: Boost (20 min por R$ 5) - expira em 24h
 *   - Prioridade 4: Reserva (100 min por R$ 12,90) - não expira
 * - Pode registrar refeições automaticamente via função logMeal
 * - Limite: 15 min/dia gratuito (ou conforme plano)
 * 
 * Este componente usa startLiveAudioSession do chatbot/services/geminiService
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  startLiveAudioSession,
  stopLiveAudioSession,
  VOICE_OPTIONS,
  PERSONALITY_OPTIONS,
} from '../chatbot/services/geminiService';
import { checkVoiceUsage } from '../services/usageLimitService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { useToast } from './ui/Toast';
import { logger } from '../utils/logger';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TrialAccessGate } from './TrialAccessGate';
import { AiAccessGate } from './AiAccessGate';

interface LiveConversationProps {
  onMealLogged?: (meal: {
    foodName: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType: string;
    description?: string;
  }) => void;
  onClose?: () => void;
}

export const LiveConversation: React.FC<LiveConversationProps> = ({
  onMealLogged,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<{
    canUse: boolean;
    remainingDaily: number;
    remainingBoost: number;
    remainingReserve: number;
    totalRemaining: number;
  } | null>(null);
  const { showSuccess, showError } = useToast();
  const transcriptionRef = useRef<string>('');

  useEffect(() => {
    checkVoiceAccess();
  }, []);

  const checkVoiceAccess = async () => {
    try {
      const status = await checkVoiceUsage();
      setVoiceStatus(status);
      if (!status.canUse) {
        setError(status.error || 'Limite diário atingido. Gerencie sua conta em nosso site.');
      }
    } catch (err) {
      logger.error('Erro ao verificar acesso de voz', 'LiveConversation', err);
      setError('Erro ao verificar limites de uso');
    }
  };

  const handleStart = async () => {
    if (!voiceStatus?.canUse) {
      showError('Limite diário atingido. Gerencie sua conta em nosso site.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscription('');
    transcriptionRef.current = '';

    try {
      await startLiveAudioSession(
        // onTranscriptionChunk
        (text: string) => {
          transcriptionRef.current += text;
          setTranscription(transcriptionRef.current);
        },
        // onModelAudioChunk
        (audioBuffer: AudioBuffer) => {
          // Reproduzir áudio (já é feito internamente pelo startLiveAudioSession)
        },
        // onModelTranscriptionChunk
        (text: string) => {
          // Transcrição do modelo (opcional)
        },
        // onTurnComplete
        (results) => {
          if (results.mealLogged && onMealLogged) {
            // A refeição foi registrada automaticamente
            showSuccess('Refeição registrada automaticamente!');
          }
        },
        // onSuccess
        () => {
          setIsConnecting(false);
          setIsRecording(true);
          showSuccess('Conversa iniciada!');
        },
        // onError
        (errorMessage: string, isApiKeyError: boolean) => {
          setIsConnecting(false);
          setIsRecording(false);
          setError(errorMessage);
          showError(errorMessage);
          if (isApiKeyError) {
            logger.error('Erro de API key', 'LiveConversation');
          }
        },
        // onSessionEndedUnexpectedly
        () => {
          setIsRecording(false);
          setError('Sessão encerrada inesperadamente');
        },
        // voiceName
        VOICE_OPTIONS[0].value,
        // systemInstruction
        PERSONALITY_OPTIONS['friendlyHelper'],
        // onToolCallStart
        (toolName: string, query: string) => {
          logger.debug(`Ferramenta chamada: ${toolName}`, 'LiveConversation');
        },
        // onToolCallResult
        (toolName: string) => {
          logger.debug(`Ferramenta concluída: ${toolName}`, 'LiveConversation');
        },
        // useWebSearch
        false,
        // useMapsSearch
        false,
        // useMealLogging
        !!onMealLogged,
        // onMealLogged
        onMealLogged,
        // onVolumeLevel (opcional)
        undefined,
        // getIsMicMuted (opcional)
        undefined
      );
    } catch (err) {
      setIsConnecting(false);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar conversa';
      setError(errorMessage);
      showError(errorMessage);
      logger.error('Erro ao iniciar conversa por voz', 'LiveConversation', err);
    }
  };

  const handleStop = async () => {
    try {
      await stopLiveAudioSession();
      setIsRecording(false);
      setTranscription('');
      transcriptionRef.current = '';
      showSuccess('Conversa encerrada');
      // Atualizar status de voz
      await checkVoiceAccess();
    } catch (err) {
      logger.error('Erro ao encerrar conversa', 'LiveConversation', err);
      showError('Erro ao encerrar conversa');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TrialAccessGate feature="voice" fallbackMessage="Trial expirado. Assine um plano para continuar usando conversa por voz.">
      <AiAccessGate feature="voice">
        <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Conversa por Voz
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {voiceStatus && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Tempo disponível:
              </div>
              <div className="flex gap-4 text-lg">
                <div>
                  <span className="font-semibold">{formatTime(voiceStatus.remainingDaily)}</span>
                  <span className="text-sm text-slate-500 ml-1">gratuito</span>
                </div>
                {voiceStatus.remainingBoost > 0 && (
                  <div>
                    <span className="font-semibold">{formatTime(voiceStatus.remainingBoost)}</span>
                    <span className="text-sm text-slate-500 ml-1">boost</span>
                  </div>
                )}
                {voiceStatus.remainingReserve > 0 && (
                  <div>
                    <span className="font-semibold">{formatTime(voiceStatus.remainingReserve)}</span>
                    <span className="text-sm text-slate-500 ml-1">reserva</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <Alert type="error" title="Erro" className="mb-4">
              {error}
            </Alert>
          )}

          {transcription && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg min-h-[200px]">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Transcrição:
              </div>
              <div className="text-slate-900 dark:text-white whitespace-pre-wrap">
                {transcription}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!isRecording && !isConnecting && (
              <Button
                onClick={handleStart}
                size="lg"
                disabled={!voiceStatus?.canUse}
                className="flex items-center gap-2"
              >
                <MicrophoneIcon className="w-5 h-5" />
                Iniciar Conversa
              </Button>
            )}

            {isConnecting && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                Conectando...
              </div>
            )}

            {isRecording && (
              <Button
                onClick={handleStop}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <XMarkIcon className="w-5 h-5" />
                Encerrar Conversa
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                Gravando...
              </div>
            </div>
          )}
        </div>
      </Card>
      </div>
      </AiAccessGate>
    </TrialAccessGate>
  );
};

export default LiveConversation;


/**
 * Nutri.ai - Assistente Unificado
 * Combina todas as funcionalidades em um único modal:
 * - Conversa por texto
 * - Conversa por voz (Gemini Live API)
 * - Envio e análise de imagens
 * - Editor de prompt customizado
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  initializeAssistantSession,
  resetAssistantSession,
  sendAssistantMessage,
  analyzeImageWithAssistant,
  editImageWithAssistant,
  startAssistantAudioSession,
  stopAssistantAudioSession,
  playAssistantAudioChunk,
  getAssistantCustomPrompt,
  setAssistantCustomPrompt,
} from '../../services/assistantService';
import { startLiveAudioSession, stopLiveAudioSession, playAudioChunk, VOICE_OPTIONS } from '../../chatbot/services/geminiService';
import { buildNutriSystemInstruction } from '../../services/nutriContextService';
import { addMealToLog } from '../../services/dailyLogService';
import { useUser } from '../../context/UserContext';
import { useToast } from '../ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { logger } from '../../utils/logger';
import { RechargeModal } from '../RechargeModal';
import type { AssistantMessage } from './assistantTypes';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        resolve({ base64: base64String, mimeType: file.type });
      } else {
        reject(new Error('Não foi possível converter o arquivo.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

interface NutriAssistantUnifiedProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const MAX_SESSION_TIME = 15 * 60 * 1000; // 15 minutos em milissegundos

export const NutriAssistantUnified: React.FC<NutriAssistantUnifiedProps> = ({ isOpen, onClose, onOpen }) => {
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const { canAccess, getRemainingMinutes } = useSubscription();
  
  // Estado do modo (texto ou voz)
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  // Estados para modo texto
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUploadedImage, setLastUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptDraft, setPromptDraft] = useState('');
  const [promptSavedAt, setPromptSavedAt] = useState<number | null>(null);
  
  // Estados para modo voz
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isMicOn, setIsMicOn] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [showUpsell, setShowUpsell] = useState(false);
  const [voiceInputTranscription, setVoiceInputTranscription] = useState('');
  const [voiceOutputTranscription, setVoiceOutputTranscription] = useState('');
  const [mealNotification, setMealNotification] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMicMutedRef = useRef(!isMicOn);

  // Inicialização
  useEffect(() => {
    if (isOpen) {
      const greeting =
        'Olá! Eu sou o FitCoach.IA, seu assistente de treinos. Envie perguntas sobre exercícios, planos de treino, técnicas de execução, suplementos ou compartilhe fotos para analisarmos juntos.';
      setMessages([{ role: 'system', content: greeting }]);
      initializeAssistantSession();
      const storedPrompt = getAssistantCustomPrompt();
      setCustomPrompt(storedPrompt);
      setPromptDraft(storedPrompt);
    } else {
      // Limpar estados ao fechar
      stopAssistantAudioSession();
      stopLiveAudioSession();
      setIsRecording(false);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [isOpen]);

  useEffect(() => {
    isMicMutedRef.current = !isMicOn;
  }, [isMicOn]);

  // Timer de 15 minutos para modo voz
  useEffect(() => {
    if (isConnected && sessionStartTimeRef.current > 0) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - sessionStartTimeRef.current;
        const remaining = Math.max(0, MAX_SESSION_TIME - elapsed);
        const minutes = Math.floor(remaining / 60000);
        
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

  // Scroll automático para mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (mode === 'text') {
      scrollToBottom();
    }
  }, [messages, mode]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Funções para modo texto
  const appendStreamingMessage = (chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === 'assistant' && last.isStreaming) {
        updated[updated.length - 1] = { ...last, content: last.content + chunk };
        return updated;
      }
      return [...prev, { role: 'assistant', content: chunk, isStreaming: true }];
    });
  };

  const finalizeStreamingMessage = () => {
    setMessages((prev) =>
      prev.map((msg) => (msg.role === 'assistant' && msg.isStreaming ? { ...msg, isStreaming: false } : msg)),
    );
  };

  const handleAssistantError = (errorMessage: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: errorMessage, isError: true, isStreaming: false },
    ]);
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: userContent,
        imageUrl: lastUploadedImage ? `data:${lastUploadedImage.mimeType};base64,${lastUploadedImage.base64}` : undefined,
      },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      if (lastUploadedImage && userContent.toLowerCase().startsWith('editar:')) {
        await editImageWithAssistant(
          lastUploadedImage.base64,
          lastUploadedImage.mimeType,
          userContent.replace(/^editar:/i, '').trim() || 'Aprimore esta imagem de refeição.',
          (imageUrl) => {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: '', isStreaming: false, imageUrl },
            ]);
          },
          (chunk) => appendStreamingMessage(chunk),
          () => finalizeStreamingMessage(),
          (error) => handleAssistantError(`Erro ao editar imagem: ${error}`),
        );
        setLastUploadedImage(null);
      } else if (lastUploadedImage) {
        await analyzeImageWithAssistant(
          lastUploadedImage.base64,
          lastUploadedImage.mimeType,
          userContent,
          (chunk) => appendStreamingMessage(chunk),
          (error) => handleAssistantError(`Erro ao analisar imagem: ${error}`),
        );
        setLastUploadedImage(null);
      } else {
        await sendAssistantMessage(
          userContent,
          (chunk) => appendStreamingMessage(chunk),
          () => finalizeStreamingMessage(),
          (error) => handleAssistantError(error),
        );
      }
    } catch (error: any) {
      handleAssistantError(`Erro ao processar mensagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  }, [input, lastUploadedImage, isLoading]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setLastUploadedImage({ base64, mimeType });
      setInput((prev) => (prev ? `${prev} ` : '') + 'Analise esta imagem:');
    } catch (error: any) {
      handleAssistantError(`Erro ao processar imagem: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleRecordButtonClick = useCallback(async () => {
    if (isRecording) {
      stopAssistantAudioSession();
      setIsRecording(false);
      if (currentInputTranscription.trim()) {
        setInput(currentInputTranscription.trim());
      }
      setCurrentInputTranscription('');
      setCurrentOutputTranscription('');
    } else {
      setIsRecording(true);
      setCurrentInputTranscription('');
      setCurrentOutputTranscription('');
      try {
        await startAssistantAudioSession(
          (transcriptionChunk) => {
            setCurrentInputTranscription((prev) => prev + transcriptionChunk);
          },
          (audioBuffer) => {
            playAssistantAudioChunk(audioBuffer);
          },
          (transcriptionChunk) => {
            setCurrentOutputTranscription((prev) => prev + transcriptionChunk);
            appendStreamingMessage(transcriptionChunk);
          },
          () => finalizeStreamingMessage(),
          (error) => {
            handleAssistantError(error);
            setIsRecording(false);
          },
        );
      } catch (error: any) {
        handleAssistantError(`Não foi possível iniciar a captura de áudio: ${error.message || 'erro desconhecido'}`);
        setIsRecording(false);
      }
    }
  }, [isRecording, currentInputTranscription]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = useCallback(() => {
    resetAssistantSession();
    setMessages([{ role: 'system', content: 'Conversa resetada. Como posso ajudar?' }]);
    setInput('');
    setLastUploadedImage(null);
  }, []);

  const handleCopyConversation = useCallback(() => {
    const conversationText = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => `${msg.role === 'user' ? 'Você' : 'Assistente'}: ${msg.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(conversationText);
    showSuccess('Conversa copiada para a área de transferência!');
  }, [messages, showSuccess]);

  const handleApplyCustomPrompt = useCallback(() => {
    setAssistantCustomPrompt(promptDraft);
    setCustomPrompt(promptDraft);
    setPromptSavedAt(Date.now());
    showSuccess('Prompt customizado aplicado com sucesso!');
  }, [promptDraft, showSuccess]);

  // Funções para modo voz
  const handleTimeLimitReached = useCallback(() => {
    setShowUpsell(true);
    stopVoiceSession();
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
        mealType: meal.mealType,
        description: meal.description,
      });
      setMealNotification(`✅ ${meal.foodName} registrado! ${mealItem.calories} kcal`);
      setTimeout(() => setMealNotification(null), 5000);
      showSuccess(`Refeição "${meal.foodName}" registrada com sucesso!`);
    } catch (error: any) {
      showError(`Erro ao registrar refeição: ${error.message || 'Erro desconhecido'}`);
    }
  }, [showSuccess, showError]);

  const startVoiceSession = useCallback(async () => {
    if (!canAccess('voice')) {
      showError('Você não tem acesso a esta funcionalidade.');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      const systemInstruction = await buildNutriSystemInstruction(user);
      
      await startLiveAudioSession(
        (chunk) => {
          if (chunk.trim()) {
            setVoiceInputTranscription((prev) => prev + chunk);
          }
        },
        (audioBuffer) => {
          playAudioChunk(audioBuffer);
        },
        (transcriptionChunk) => {
          setVoiceOutputTranscription((prev) => prev + transcriptionChunk);
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
            logger.error('Erro de API key', 'NutriAssistantUnified');
          }
        },
        () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        },
        VOICE_OPTIONS.find(v => v.value === 'Kore')?.value || 'Kore',
        systemInstruction,
        (toolName, query) => {
          logger.debug(`Tool chamado: ${toolName}`, 'NutriAssistantUnified');
        },
        (toolName) => {
          logger.debug(`Tool concluído: ${toolName}`, 'NutriAssistantUnified');
        },
        false, // useWebSearch
        false, // useMapsSearch
        true,  // useMealLogging
        handleMealLogged,
        (level) => setVolumeLevel(level),
        () => isMicMutedRef.current
      );
    } catch (error: any) {
      setIsConnecting(false);
      setConnectionStatus('error');
      showError(`Erro ao iniciar conversa: ${error.message || 'Erro desconhecido'}`);
      logger.error('Erro ao iniciar sessão', 'NutriAssistantUnified', error);
    }
  }, [user, canAccess, showError, handleMealLogged]);

  const stopVoiceSession = useCallback(async () => {
    await stopLiveAudioSession();
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setVoiceInputTranscription('');
    setVoiceOutputTranscription('');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeRemaining(15);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  // Ao mudar de modo, parar sessões ativas
  useEffect(() => {
    if (mode === 'text' && isConnected) {
      stopVoiceSession();
    } else if (mode === 'voice' && isRecording) {
      stopAssistantAudioSession();
      setIsRecording(false);
    }
  }, [mode]);

  // Se o modal não estiver aberto, mostrar apenas o botão flutuante
  if (!isOpen) {
    return (
      <button
        onClick={() => onOpen?.()}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
        aria-label="Abrir Nutri.ai - Assistente"
        title="Nutri.ai - Assistente de IA"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex h-full sm:h-[85vh] w-full sm:w-[90vw] sm:max-w-2xl flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-slate-800/60 bg-slate-950/95 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/90 to-sky-500/90 px-3 sm:px-4 py-2 sm:py-3 text-white shadow-md">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">Nutri.ai - Assistente</h2>
            <p className="text-xs text-emerald-50/80 hidden sm:block">Conversas, análise de fotos e assistente de voz</p>
          </div>
          
          {/* Abas para alternar entre Texto e Voz */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'text'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              💬 Texto
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mode === 'voice'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              🎤 Voz
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {mode === 'text' && (
              <>
                <button
                  onClick={() => setShowPromptEditor((prev) => !prev)}
                  className="rounded-full px-2 sm:px-3 py-1 text-xs font-semibold text-emerald-50/90 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{showPromptEditor ? 'Ocultar prompt' : 'Prompt'}</span>
                  <span className="sm:hidden">{showPromptEditor ? 'Ocultar' : 'Prompt'}</span>
                </button>
                <button
                  onClick={handleCopyConversation}
                  className="rounded-full p-2 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Copiar conversa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Zm2-1a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H9Z" />
                    <path d="M5 5a2 2 0 0 1 2-2h7a1 1 0 1 1 0 2H7v12a1 1 0 1 1-2 0V5Z" />
                  </svg>
                </button>
                <button
                  onClick={handleResetChat}
                  className="rounded-full p-2 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Excluir conversa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 3a1 1 0 0 0-.894.553L7.382 5H5a1 1 0 1 0 0 2h.262l.823 11.521A2 2 0 0 0 8.08 20.5h7.84a2 2 0 0 0 1.995-1.979L18.738 7H19a1 1 0 1 0 0-2h-2.382l-.724-1.447A1 1 0 0 0 15 3H9Zm1.118 4.553a1 1 0 0 1 1.06.93l.5 8.5a1 1 0 1 1-1.996.118l-.5-8.5a1 1 0 0 1 .936-1.048Zm4.764 0a1 1 0 0 1 .936 1.048l-.5 8.5a1 1 0 0 1-1.996-.118l.5-8.5a1 1 0 0 1 1.06-.93Z" />
                  </svg>
                </button>
              </>
            )}
            {mode === 'voice' && isConnected && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-300 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-300 animate-pulse' :
                  'bg-gray-400'
                }`} />
                <span>{timeRemaining}m</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Fechar assistente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo do Editor de Prompt (modo texto) */}
        {mode === 'text' && showPromptEditor && (
          <div className="border-b border-slate-800/70 bg-slate-900/50 px-4 py-3">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Prompt Customizado</label>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                placeholder="Digite um prompt customizado para personalizar o comportamento do assistente..."
                className="w-full rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none ring-2 ring-transparent transition focus:ring-emerald-400/60"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {promptSavedAt && `Salvo em ${new Date(promptSavedAt).toLocaleTimeString()}`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPromptDraft(customPrompt);
                      setShowPromptEditor(false);
                    }}
                    className="rounded-lg px-3 py-2 text-emerald-100 transition hover:bg-emerald-500/20"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyCustomPrompt}
                    className="rounded-lg bg-emerald-400 px-3 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300"
                    disabled={promptDraft === customPrompt}
                  >
                    Aplicar prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Área de conteúdo principal */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950/70 px-4 py-4 text-sm text-slate-100">
          {mode === 'text' ? (
            <>
              {/* Mensagens de texto */}
              {messages.map((msg, index) => (
                <div
                  key={`${index}-${msg.content.slice(0, 10)}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                      msg.role === 'user'
                        ? 'bg-emerald-400 text-slate-900'
                        : msg.role === 'assistant'
                        ? msg.isError
                          ? 'bg-rose-500/20 text-rose-200'
                          : 'bg-slate-800/80 text-slate-100'
                        : 'bg-slate-700/40 text-slate-200 italic'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Imagem enviada ou gerada"
                        className="mb-2 max-h-40 w-full rounded-lg object-cover"
                      />
                    )}
                    <span>{msg.content}</span>
                    {msg.isStreaming && <span className="ml-2 animate-pulse">...</span>}
                  </div>
                </div>
              ))}

              {/* Indicador de gravação de áudio */}
              {isRecording && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl bg-slate-800/60 px-4 py-3 text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse">🎤</span>
                      <span>Ouvindo...</span>
                    </div>
                    {currentInputTranscription ? (
                      <p className="mt-2 text-sm text-slate-100/90">{currentInputTranscription}</p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400/70 italic">Fale algo para começar a transcrição</p>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-800/60 px-4 py-3 text-slate-200">
                    <span className="animate-pulse">Pensando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          ) : (
            <>
              {/* Modo Voz */}
              <div className="space-y-4">
                {/* Avatar e status */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                    👨‍🍳
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Nutri.ai</h3>
                    <p className="text-sm text-slate-300">Sua nutricionista pessoal por voz</p>
                  </div>
                </div>

                {/* Status da conexão */}
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

                {/* Medidor de volume */}
                {isConnected && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Volume do microfone</span>
                      <span>{volumeLevel}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-100"
                        style={{ width: `${volumeLevel}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Transcrições */}
                <div className="space-y-3">
                  {voiceInputTranscription && (
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Você:</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{voiceInputTranscription}</p>
                    </div>
                  )}
                  {voiceOutputTranscription && (
                    <div className="bg-sky-100 dark:bg-sky-900/30 rounded-lg p-3">
                      <p className="text-xs text-sky-700 dark:text-sky-300 font-medium mb-1">Nutri.ai:</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{voiceOutputTranscription}</p>
                    </div>
                  )}
                  {!voiceInputTranscription && !voiceOutputTranscription && isConnected && (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      <p className="text-sm">Fale algo para começar a conversa...</p>
                    </div>
                  )}
                </div>

                {/* Notificação de refeição */}
                {mealNotification && (
                  <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 animate-fade-in">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">{mealNotification}</p>
                  </div>
                )}

                {/* Controles de voz */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  {!isConnected && !isConnecting && (
                    <button
                      onClick={startVoiceSession}
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
                        onClick={stopVoiceSession}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition shadow-lg text-sm"
                      >
                        Parar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Barra de entrada (apenas modo texto) */}
        {mode === 'text' && (
          <div className="flex items-center gap-2 border-t border-slate-800/70 bg-slate-900/70 px-4 py-3">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-3 text-slate-300 transition hover:bg-slate-800/80 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
              disabled={isLoading || isRecording}
              aria-label="Enviar imagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4V5Zm2-1a1 1 0 0 0-1 1v11.382l3.724-3.724a1 1 0 0 1 1.415 0L15 19l3-3V5a1 1 0 0 0-1-1H6Zm1 3a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" />
              </svg>
            </button>
            <button
              onClick={handleRecordButtonClick}
              className={`rounded-full p-3 transition focus:outline-none focus:ring-2 ${
                isRecording
                  ? 'bg-rose-500 text-white hover:bg-rose-400 focus:ring-rose-300/60'
                  : 'text-slate-300 hover:text-emerald-300 focus:ring-emerald-300/60'
              }`}
              disabled={isLoading && !isRecording}
              aria-label={isRecording ? 'Encerrar captura de áudio' : 'Iniciar captura de áudio'}
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3Zm7-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z" />
                </svg>
              )}
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Pergunte algo ou escreva "Analise esta imagem:" / "editar: melhore o prato"...'
              className="flex-1 resize-none rounded-2xl bg-slate-900/60 px-4 py-2 text-sm text-slate-100 outline-none ring-2 ring-transparent transition focus:ring-emerald-400/60 disabled:opacity-50"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className="rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:from-emerald-300 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || !input.trim()}
              aria-label="Enviar mensagem"
            >
              Enviar
            </button>
          </div>
        )}
      </div>

      {/* Modal de recarga */}
      {showRechargeModal && (
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
        />
      )}

      {/* Modal de upsell */}
      {showUpsell && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md mx-4 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-2">Tempo esgotado!</h3>
            <p className="text-slate-300 mb-4">
              Você usou seus 15 minutos de conversa por voz. Assine um plano para continuar usando esta funcionalidade.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpsell(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowUpsell(false);
                  window.location.hash = '#/premium';
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-lg hover:from-emerald-600 hover:to-sky-600 transition"
              >
                Ver Planos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


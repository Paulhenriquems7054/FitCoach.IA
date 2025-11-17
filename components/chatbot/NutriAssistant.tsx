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

const NutriAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const greeting =
      'Olá! Eu sou a Nutri.IA, sua assistente nutricional. Envie perguntas sobre alimentação, planos de refeição, suplementos ou compartilhe fotos para analisarmos juntos.';
    setMessages([{ role: 'system', content: greeting }]);
    initializeAssistantSession();
    const storedPrompt = getAssistantCustomPrompt();
    setCustomPrompt(storedPrompt);
    setPromptDraft(storedPrompt);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
              {
                role: 'assistant',
                content: 'Aqui está a versão editada da sua refeição:',
                imageUrl,
                isStreaming: false,
              },
            ]);
          },
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
          (error) => handleAssistantError(`Erro: ${error}`),
        );
      }
    } catch (error: any) {
      handleAssistantError(`Algo deu errado. Tente novamente. (${error.message || 'Erro desconhecido'})`);
    } finally {
      setIsLoading(false);
      finalizeStreamingMessage();
      autoResizeTextarea();
    }
  }, [input, isLoading, lastUploadedImage, autoResizeTextarea]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const togglePopup = useCallback(() => {
    setIsOpen((current) => {
      if (!current) {
        initializeAssistantSession();
      } else {
        stopAssistantAudioSession();
        setIsRecording(false);
      }
      return !current;
    });
  }, []);

  const handleResetChat = useCallback(() => {
    resetAssistantSession();
    const greeting =
      'Iniciando uma nova conversa! Como posso ajudar com seus objetivos nutricionais hoje?';
    setMessages([{ role: 'system', content: greeting }]);
    setLastUploadedImage(null);
    stopAssistantAudioSession();
    setIsRecording(false);
    setCurrentInputTranscription('');
    setCurrentOutputTranscription('');
    initializeAssistantSession();
  }, []);

  const handleApplyCustomPrompt = () => {
    setAssistantCustomPrompt(promptDraft);
    setCustomPrompt(promptDraft);
    setPromptSavedAt(Date.now());
    handleResetChat();
    setShowPromptEditor(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const { base64, mimeType } = await fileToBase64(file);
      setLastUploadedImage({ base64, mimeType });
      setInput('Analise esta imagem:');
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: 'Imagem enviada. Peça uma análise ou use "editar: [descrição]" para modificar.',
          imageUrl: `data:${mimeType};base64,${base64}`,
        },
      ]);
    } catch (error: any) {
      handleAssistantError(`Erro ao processar imagem: ${error.message || 'desconhecido'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      try {
        setIsRecording(true);
        setCurrentInputTranscription('');
        setCurrentOutputTranscription('');
        await startAssistantAudioSession(
          (chunk) => setCurrentInputTranscription((prev) => prev + chunk),
          (audioBuffer) => playAssistantAudioChunk(audioBuffer),
          (transcriptionChunk) => {
            setCurrentOutputTranscription((prev) => prev + transcriptionChunk);
            appendStreamingMessage(transcriptionChunk);
          },
          () => finalizeStreamingMessage(),
          (error) => handleAssistantError(error),
        );
      } catch (error: any) {
        handleAssistantError(`Não foi possível iniciar a captura de áudio: ${error.message || 'erro desconhecido'}`);
        setIsRecording(false);
      }
    }
  }, [isRecording, currentInputTranscription]);

  useEffect(() => {
    if (!isRecording && currentInputTranscription.trim()) {
      setInput(currentInputTranscription);
    }
  }, [isRecording, currentInputTranscription]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={togglePopup}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
          aria-label="Abrir assistente Nutri.IA"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[80vh] w-[90vw] max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/95 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm sm:h-[70vh]">
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/90 to-sky-500/90 px-4 py-3 text-white shadow-md">
            <div>
              <h2 className="text-lg font-semibold">Nutri.IA Assistente</h2>
              <p className="text-xs text-emerald-50/80">Conversas, análise de fotos e dicas nutricionais</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromptEditor((prev) => !prev)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-50/90 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {showPromptEditor ? 'Ocultar prompt' : 'Configurar prompt'}
              </button>
              <button
                onClick={handleResetChat}
                className="rounded-full p-2 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Reiniciar conversa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.5 9A7 7 0 0119 9m-14 6a7 7 0 0013.5 0" />
                </svg>
              </button>
              <button
                onClick={togglePopup}
                className="rounded-full p-2 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Fechar assistente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950/70 px-4 py-4 text-sm text-slate-100">
            {showPromptEditor && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-slate-100 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-emerald-200">Prompt personalizado para a IA</h3>
                  {promptSavedAt && (
                    <span className="text-xs text-emerald-100/80">
                      Atualizado {new Date(promptSavedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Defina orientações extras para a Nutri.IA (restrições alimentares, tom de voz, objetivos). Ao salvar,
                  uma nova conversa será iniciada usando esse contexto.
                </p>
                <textarea
                  value={promptDraft}
                  onChange={(event) => setPromptDraft(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-emerald-400/40 bg-emerald-900/30 px-3 py-2 text-sm text-slate-50 outline-none ring-2 ring-transparent transition focus:ring-emerald-300/60"
                  placeholder="Ex.: Sempre considere que estou seguindo uma dieta pobre em carboidratos e prefiro orientações práticas para o dia a dia."
                />
                <div className="mt-3 flex justify-end gap-2 text-xs">
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
            )}

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

            {isRecording && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl bg-slate-800/60 px-4 py-3 text-slate-200">
                  Gravando&nbsp;
                  <span className="animate-pulse">🎤</span>
                  {currentInputTranscription && (
                    <p className="mt-2 text-sm text-slate-100/90">{currentInputTranscription}</p>
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
          </div>

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
              disabled={isLoading}
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
        </div>
      )}
    </>
  );
};

export default NutriAssistant;

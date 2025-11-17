import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  sendMessageToGemini,
  initializeChat,
  resetChatSession,
  processImageWithGemini,
  analyzeVideoWithGemini,
  startLiveAudioSession,
  stopLiveAudioSession,
  playAudioChunk,
  generateGroundedResponse,
  generateMapsGroundedResponse,
  PERSONALITY_OPTIONS,
  VOICE_OPTIONS,
  generateSpeechFromText,
  decode,
  decodeAudioData,
  ensureApiKeySelected, // New import
} from '../services/geminiService';
import { ChatMessage, WebSearchResult, MapSearchResult } from '../types';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        resolve({ base64: base64String, mimeType: file.type });
      } else {
        reject('Failed to convert file to base64.');
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const PERSONALITY_DISPLAY_NAMES: { [key: string]: string } = {
  businessExpert: "Especialista de Negócios",
  friendlyHelper: "Ajudante Amigável",
  conciseProfessional: "Profissional Conciso",
};

const PLACEHOLDER_TEXT: { [key: string]: string } = {
    businessExpert: "Faça uma pergunta sobre negócios",
    friendlyHelper: "Converse comigo",
    conciseProfessional: "Pergunte sobre o app",
};

const ChatbotPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUploadedImage, setLastUploadedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false); // State for voice chat recording
  const [isTranscribing, setIsTranscribing] = useState(false); // State for transcription to input
  const [isAudioLoading, setIsAudioLoading] = useState(false); // General audio session loading
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<{ index: number; status: 'playing' | 'paused' } | null>(null);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isMapsEnabled, setIsMapsEnabled] = useState(false); // State for Maps toggle
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].value);
  const [selectedPersonality, setSelectedPersonality] = useState(Object.keys(PERSONALITY_OPTIONS)[0]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioControlRef = useRef<{ context: AudioContext; source: AudioBufferSourceNode } | null>(null);

  useEffect(() => {
    setMessages([{ role: 'system', content: PERSONALITY_OPTIONS[selectedPersonality] }]);
    initializeChat(isThinkingMode, PERSONALITY_OPTIONS[selectedPersonality]);
  }, [isThinkingMode, selectedPersonality]);

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
      const maxHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${maxHeight}px`;
    }
  }, [textareaRef]);

  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessageContent = input.trim();
    const messageToAdd: ChatMessage = { role: 'user', content: userMessageContent };
    
    setMessages((prev) => [...prev, messageToAdd]);
    setInput('');
    setIsLoading(true);
    // Ensure any active audio session (recording or transcribing) is stopped when sending a text message
    if (isRecording || isTranscribing) {
      await stopLiveAudioSession();
      setIsRecording(false);
      setIsTranscribing(false);
    }

    let geminiResponseText = '';

    try {
      if (isSearchEnabled) {
        setMessages((prev) => [
          ...prev,
          { role: 'gemini', content: 'Buscando na web...', isStreaming: true },
        ]);
        
        try {
          const { text, webResults } = await generateGroundedResponse(userMessageContent);
          geminiResponseText = text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.content === 'Buscando na web...' && msg.isStreaming
                ? { role: 'gemini', content: text, webResults: webResults }
                : msg
            )
          );
        } catch (error: any) {
           setMessages((prev) =>
            prev.map((msg) =>
              msg.content === 'Buscando na web...' && msg.isStreaming
                ? { role: 'gemini', content: `Erro na busca na web: ${error.message}`, isError: true }
                : msg
            )
          );
        }
      } else if (isMapsEnabled) {
        setMessages((prev) => [
          ...prev,
          { role: 'gemini', content: 'Buscando no Maps...', isStreaming: true },
        ]);
        
        try {
          const { text, mapsResults } = await generateMapsGroundedResponse(userMessageContent);
          geminiResponseText = text;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.content === 'Buscando no Maps...' && msg.isStreaming
                ? { role: 'gemini', content: text, mapsResults: mapsResults }
                : msg
            )
          );
        } catch (error: any) {
           setMessages((prev) =>
            prev.map((msg) =>
              msg.content === 'Buscando no Maps...' && msg.isStreaming
                ? { role: 'gemini', content: `Erro na busca no Maps: ${error.message}`, isError: true }
                : msg
            )
          );
        }
      } else if (lastUploadedImage && userMessageContent.toLowerCase().startsWith('edit:')) {
        setMessages((prev) => [...prev, { role: 'gemini', content: '', isStreaming: true }]);
        await processImageWithGemini(
          lastUploadedImage.base64, lastUploadedImage.mimeType, userMessageContent.substring('edit:'.length).trim(), 'editing',
          () => {},
          (imageUrl) => {
            setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, content: 'Aqui está a sua imagem editada:', imageUrl, isStreaming: false } : msg));
            setLastUploadedImage(null);
          },
          (error) => {
            setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, content: `Erro ao editar a imagem: ${error}`, isError: true, isStreaming: false } : msg));
            setLastUploadedImage(null);
          }
        );
      } else if (lastUploadedImage) {
        setMessages((prev) => [...prev, { role: 'gemini', content: '', isStreaming: true }]);
        await processImageWithGemini(
          lastUploadedImage.base64, lastUploadedImage.mimeType, userMessageContent, 'analysis',
          (chunk) => {
            geminiResponseText += chunk;
            setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, content: msg.content + chunk } : msg))
          },
          () => {},
          (error) => setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, content: `Erro ao analisar a imagem: ${error}`, isError: true, isStreaming: false } : msg))
        );
        setLastUploadedImage(null);
      } else {
        setMessages((prev) => [...prev, { role: 'gemini', content: '', isStreaming: true }]);
        await sendMessageToGemini(
          userMessageContent,
          (chunk) => {
            geminiResponseText += chunk;
            setMessages((prev) => {
              const newMessages = [...prev];
              for (let i = newMessages.length - 1; i >= 0; i--) {
                if (newMessages[i].isStreaming && newMessages[i].role === 'gemini') {
                    newMessages[i] = { ...newMessages[i], content: newMessages[i].content + chunk };
                    break;
                }
              }
              return newMessages;
            });
          },
          (error) => {
            setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, content: `Erro: ${error}`, isError: true, isStreaming: false } : msg));
            console.error("Chatbot error:", error);
          },
          isThinkingMode, undefined, PERSONALITY_OPTIONS[selectedPersonality]
        );
      }

      setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, isStreaming: false } : msg));
      
      if (geminiResponseText) {
        generateSpeechFromText(geminiResponseText, selectedVoice)
          .then(audioBase64 => {
            setMessages(prev => {
              const newMessages = [...prev];
              let targetIndex = -1;
              for (let i = newMessages.length - 1; i >= 0; i--) {
                const msg = newMessages[i];
                if (msg.role === 'gemini' && msg.content === geminiResponseText && !msg.audioBase64) {
                  targetIndex = i;
                  break;
                }
              }

              if (targetIndex !== -1) {
                newMessages[targetIndex] = { ...newMessages[targetIndex], audioBase64 };
                return newMessages;
              }
              return prev;
            });
          })
          .catch(err => console.error("Falha na pré-busca de áudio:", err));
      }

    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [...prev, { role: 'gemini', content: `Desculpe, algo deu errado: ${error.message}`, isError: true }]);
    } finally {
      setIsLoading(false);
      autoResizeTextarea();
    }
  }, [input, isLoading, lastUploadedImage, isThinkingMode, isSearchEnabled, isMapsEnabled, selectedPersonality, selectedVoice, autoResizeTextarea, isRecording, isTranscribing]);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopCurrentAudio = useCallback(() => {
    if (audioControlRef.current?.context) {
      audioControlRef.current.context.close();
      audioControlRef.current = null;
    }
    setPlaybackState(null);
  }, []);

  const togglePopup = useCallback(async () => {
    if (isOpen) {
      await stopLiveAudioSession();
      setIsRecording(false);
      setIsTranscribing(false);
      setInput(''); // Clear input if transcription was active
      stopCurrentAudio();
    } else {
      initializeChat(isThinkingMode, PERSONALITY_OPTIONS[selectedPersonality]);
    }
    setIsOpen(prev => !prev);
  }, [isOpen, isThinkingMode, selectedPersonality, stopCurrentAudio]);
  

  const handleResetChat = useCallback(async () => {
    resetChatSession();
    setMessages([{ role: 'system', content: PERSONALITY_OPTIONS[selectedPersonality] }]);
    setLastUploadedImage(null);
    await stopLiveAudioSession();
    setIsRecording(false);
    setIsTranscribing(false);
    setInput(''); // Clear input if transcription was active
    stopCurrentAudio();
    initializeChat(isThinkingMode, PERSONALITY_OPTIONS[selectedPersonality]);
  }, [isThinkingMode, selectedPersonality, stopCurrentAudio]);

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setLastUploadedImage({ base64, mimeType });
        setInput(`Analisar esta imagem:`);
        setMessages((prev) => [...prev, { role: 'user', content: "Imagem carregada. Peça para analisá-la ou diga 'editar: [prompt]' para modificar.", imageUrl: `data:${mimeType};base64,${base64}` }]);
      } catch (error) {
        setMessages((prev) => [...prev, { role: 'system', content: `Erro ao carregar a imagem: ${error}` }]);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };
  
  const handleVideoButtonClick = () => videoInputRef.current?.click();

  const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
  
    const processingMessage = `Processando vídeo: ${file.name}...`;
    setMessages(prev => [...prev, { role: 'system', content: processingMessage }]);
    setIsLoading(true);
  
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const defaultPrompt = "Por favor, analise este vídeo e forneça um resumo.";
  
      // Add user message with video and Gemini placeholder to chat history
      setMessages(prev => [
        ...prev.filter(m => m.content !== processingMessage),
        {
          role: 'user',
          content: defaultPrompt,
          videoUrl: `data:${mimeType};base64,${base64}`,
          videoMimeType: mimeType,
        },
        { role: 'gemini', content: '', isStreaming: true }
      ]);
  
      let geminiResponseText = '';
  
      await analyzeVideoWithGemini(
        base64,
        mimeType,
        defaultPrompt,
        (chunk) => {
          geminiResponseText += chunk;
          setMessages((prev) => 
            prev.map((msg) => msg.isStreaming ? { ...msg, content: geminiResponseText } : msg)
          );
        },
        (error) => {
          setMessages((prev) => 
            prev.map((msg) => msg.isStreaming ? { ...msg, content: `Erro ao analisar o vídeo: ${error}`, isError: true, isStreaming: false } : msg)
          );
        }
      );
      
      setMessages((prev) => prev.map((msg) => msg.isStreaming ? { ...msg, isStreaming: false } : msg));

      if (geminiResponseText) {
        generateSpeechFromText(geminiResponseText, selectedVoice)
          .then(audioBase64 => {
            setMessages(prev => {
              const newMessages = [...prev];
              let targetIndex = -1;
              for (let i = newMessages.length - 1; i >= 0; i--) {
                if (newMessages[i].role === 'gemini' && newMessages[i].content === geminiResponseText && !newMessages[i].isStreaming) {
                  targetIndex = i;
                  break;
                }
              }
              if (targetIndex !== -1) {
                newMessages[targetIndex] = { ...newMessages[targetIndex], audioBase64 };
                return newMessages;
              }
              return prev;
            });
          })
          .catch(err => console.error("Falha na pré-busca de áudio:", err));
      }
  
    } catch (error: any) {
      setMessages(prev => [
        ...prev.filter(m => m.content !== processingMessage),
        { role: 'system', content: `Erro ao carregar o vídeo: ${error.message}`, isError: true },
      ]);
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = '';
      setIsLoading(false);
    }
  };

  const handlePlayPauseAudio = async (message: ChatMessage, index: number) => {
    if (loadingAudioIndex !== null && loadingAudioIndex !== index) return;

    if (playbackState?.index === index && playbackState.status === 'playing') {
      if (audioControlRef.current?.context.state === 'running') {
        await audioControlRef.current.context.suspend();
        setPlaybackState({ index, status: 'paused' });
      }
      return;
    }

    if (playbackState?.index === index && playbackState.status === 'paused') {
      if (audioControlRef.current?.context.state === 'suspended') {
        await audioControlRef.current.context.resume();
        setPlaybackState({ index, status: 'playing' });
      }
      return;
    }

    stopCurrentAudio();
    setLoadingAudioIndex(index);

    try {
      const base64Audio = message.audioBase64
        ? message.audioBase64
        : await generateSpeechFromText(message.content, selectedVoice);

      if (!base64Audio) {
        throw new Error("Audio data is missing or could not be generated.");
      }

      if (!message.audioBase64) {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[index] === message) {
                newMessages[index] = { ...message, audioBase64: base64Audio };
            }
            return newMessages;
        });
      }

      const ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (ttsAudioContext.state === 'suspended') await ttsAudioContext.resume();
      
      const audioData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, ttsAudioContext, 24000, 1);
      const source = ttsAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ttsAudioContext.destination);
      
      source.onended = () => {
        if (audioControlRef.current?.source === source) {
          stopCurrentAudio();
        }
      };
      
      source.start(0);
      audioControlRef.current = { context: ttsAudioContext, source };
      setPlaybackState({ index, status: 'playing' });

    } catch (error: any) {
        console.error("Falha ao reproduzir áudio:", error);
        setMessages((prev) => [...prev, { role: 'system', content: `Falha ao gerar áudio: ${error.message}`, isError: true }]);
        stopCurrentAudio();
    } finally {
        setLoadingAudioIndex(null);
    }
  };

  const handleVoiceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value);
    // Stop any active audio session if voice changes
    if (isRecording || isTranscribing) {
      await stopLiveAudioSession();
      setIsRecording(false);
      setIsTranscribing(false);
      setInput(''); // Clear input if transcription was active
      setMessages((prev) => [...prev, { role: 'system', content: `Voz alterada para ${e.target.value}. Por favor, clique no microfone novamente para continuar a conversa por voz ou transcrever.` }]);
    }
  };

  const handlePersonalityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPersonalityKey = e.target.value;
    // Reset chat and stop any active audio session when personality changes
    await handleResetChat();
    setSelectedPersonality(newPersonalityKey);
  };

  // --- Refactored Voice Session Logic ---

  const onUserAudioInputToChat = useCallback((chunk: string) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.role === 'user' && lastMsg.isStreaming) {
        return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: lastMsg.content + chunk } : m);
      }
      return [...prev.map(m => ({ ...m, isStreaming: false })), { role: 'user', content: chunk, isStreaming: true }];
    });
  }, []);

  const onModelTranscriptionChunk = useCallback((modelTranscriptionChunk: string) => {
    setMessages(prev => {
      const finalizedMessages = prev.map((m) => (m.role === 'user' && m.isStreaming) ? { ...m, isStreaming: false } : m);
      const lastFinalizedMsg = finalizedMessages[finalizedMessages.length - 1];
      if (lastFinalizedMsg?.role === 'gemini' && lastFinalizedMsg.isStreaming) {
         return finalizedMessages.map((m, i) => i === finalizedMessages.length - 1 ? { ...m, content: m.content + modelTranscriptionChunk } : m);
      }
      return [...finalizedMessages, { role: 'gemini', content: modelTranscriptionChunk, isStreaming: true }];
    });
  }, []);
  
  const onTurnComplete = useCallback((results: { webResults?: WebSearchResult[], mapsResults?: MapSearchResult[] }) => {
    setMessages(prev => {
      const newMessages = prev.map(m => ({ ...m, isStreaming: false }));
      if (results.webResults?.length || results.mapsResults?.length) {
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'gemini') {
            newMessages[i] = { 
              ...newMessages[i], 
              webResults: results.webResults, 
              mapsResults: results.mapsResults 
            };
            break;
          }
        }
      }
      return newMessages;
    });
  }, []);
  
  const onToolCallStart = useCallback((toolName: string, query: string) => {
    const toolDisplayName = toolName === 'searchWeb' ? 'na web' : 'no Maps';
    setMessages(prev => [...prev.map(m => m.role === 'user' && m.isStreaming ? {...m, isStreaming: false} : m), { role: 'system', content: `Buscando ${toolDisplayName}...`, isStreaming: true }]);
  }, []);

  const onToolCallResult = useCallback((toolName: string) => {
    setMessages(prev => prev.filter(m => !(m.role === 'system' && m.isStreaming)));
  }, []);

  const onSessionEndedUnexpectedly = useCallback(() => {
    if (isRecording || isTranscribing) {
      console.log("Session ended unexpectedly. Updating UI.");
      setIsRecording(false);
      setIsTranscribing(false);
      setIsAudioLoading(false);
      setInput(''); // Clear input if transcription was active
      setMessages(prev => prev.map(m => ({ ...m, isStreaming: false })));
    }
  }, [isRecording, isTranscribing]);

  const handleStartLiveSession = useCallback(async (
    onUserAudioTranscriptionCallback: (text: string) => void,
    onSuccessCallback: () => void
  ) => {
    setIsAudioLoading(true);

    const hasApiKeySelected = await ensureApiKeySelected();
    if (!hasApiKeySelected) {
      setMessages((prev) => [...prev, { role: 'system', content: 'Não foi possível iniciar a sessão de áudio. Por favor, verifique se a janela de seleção da chave de API está disponível e tente novamente.' }]);
      setIsAudioLoading(false);
      return;
    }

    await startLiveAudioSession(
      onUserAudioTranscriptionCallback,
      playAudioChunk,
      onModelTranscriptionChunk,
      onTurnComplete,
      () => { // onSuccess
        setIsAudioLoading(false);
        onSuccessCallback();
      },
      (error, isApiKeyError) => { // onError - Modified signature here
        if (isApiKeyError) {
          setMessages((prev) => [...prev, { role: 'system', content: `Seu acesso à API foi revogado ou a chave expirou. Por favor, selecione uma nova chave de API.` }]);
          // Explicitly call openSelectKey if the error comes back from the session itself
          if (typeof window !== 'undefined' && (window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
              (window as any).aistudio.openSelectKey();
          }
        } else {
          setMessages((prev) => [...prev, { role: 'system', content: `Erro de áudio: ${error}`, isError: true }]);
        }
        setIsRecording(false); // Reset both states on any error
        setIsTranscribing(false);
        setIsAudioLoading(false);
        setInput('');
      },
      onSessionEndedUnexpectedly,
      selectedVoice,
      PERSONALITY_OPTIONS[selectedPersonality],
      onToolCallStart,
      onToolCallResult,
      isSearchEnabled,
      isMapsEnabled
    );
  }, [selectedVoice, selectedPersonality, onModelTranscriptionChunk, onTurnComplete, onToolCallStart, onToolCallResult, onSessionEndedUnexpectedly, isSearchEnabled, isMapsEnabled]);


  const handleRecordButtonClick = useCallback(async () => {
    if (isLoading || isAudioLoading) return; // Prevent interaction if app is busy or audio session is initializing

    if (isRecording) { // If already recording voice chat, stop it
      await stopLiveAudioSession();
      setIsRecording(false);
      setMessages(prev => prev.map(m => ({ ...m, isStreaming: false }))); // Clear any streaming indications
    } else { // Not recording voice chat
      // If transcribing, stop it first to ensure mutual exclusivity
      if (isTranscribing) {
        await stopLiveAudioSession();
        setIsTranscribing(false);
        setInput(''); // Clear input box after stopping transcription
      }
      // Now start voice chat
      await handleStartLiveSession(
        onUserAudioInputToChat,
        () => setIsRecording(true)
      );
    }
  }, [isLoading, isAudioLoading, isRecording, isTranscribing, handleStartLiveSession, onUserAudioInputToChat]);

  const handleTranscribeAudioButtonClick = useCallback(async () => {
    if (isLoading || isAudioLoading) return; // Prevent interaction if app is busy or audio session is initializing

    if (isTranscribing) { // If already transcribing, stop it
      await stopLiveAudioSession();
      setIsTranscribing(false);
      setInput(''); // Clear input box
    } else { // Not transcribing
      // If recording voice chat, stop it first to ensure mutual exclusivity
      if (isRecording) {
        await stopLiveAudioSession();
        setIsRecording(false);
        setMessages(prev => prev.map(m => ({ ...m, isStreaming: false }))); // Clear streaming indicators in chat
      }
      // Now start transcription to input
      setInput(''); // Clear input before starting transcription
      await handleStartLiveSession(
        (chunk) => setInput(prev => prev + chunk), // Custom callback to update input field
        () => setIsTranscribing(true)
      );
    }
  }, [isLoading, isAudioLoading, isTranscribing, isRecording, handleStartLiveSession]);


  const handleSearchModeToggle = useCallback(async (mode: 'web' | 'maps') => {
    const isCurrentlyWeb = isSearchEnabled;
    const isCurrentlyMaps = isMapsEnabled;
    
    let nextWeb = false;
    let nextMaps = false;

    if (mode === 'web') {
      nextWeb = !isCurrentlyWeb;
      if (nextWeb) nextMaps = false; // Mutually exclusive
    } else { // maps
      nextMaps = !isCurrentlyMaps;
      if (nextMaps) nextWeb = false; // Mutually exclusive
    }
    
    setIsSearchEnabled(nextWeb);
    setIsMapsEnabled(nextMaps);

    // If any audio session is active, stop and restart with new search settings
    if (isRecording || isTranscribing) {
      // Determine which callback to use based on the previously active mode
      const currentOnUserAudioTranscriptionCallback = isRecording 
        ? onUserAudioInputToChat 
        : (chunk: string) => setInput(prev => prev + chunk);
      
      const currentOnSuccessCallback = isRecording 
        ? () => setIsRecording(true) 
        : () => setIsTranscribing(true);

      await stopLiveAudioSession();
      setIsRecording(false);
      setIsTranscribing(false);
      setInput(''); // Clear input if transcription was active

      // Restart with new search settings
      await handleStartLiveSession(
        currentOnUserAudioTranscriptionCallback,
        currentOnSuccessCallback
      );
    }
  }, [isRecording, isTranscribing, isSearchEnabled, isMapsEnabled, handleStartLiveSession, onUserAudioInputToChat]);


  return (
    <>
      {!isOpen && (
        <button
          onClick={togglePopup}
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          aria-label="Abrir Chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full h-full sm:w-11/12 sm:max-w-md md:w-[400px] sm:h-3/4 sm:max-h-[600px] bg-white rounded-t-lg sm:rounded-lg shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out">
          <div className="flex justify-between items-center p-4 bg-blue-700 text-white rounded-t-lg shadow-md flex-wrap">
            <h2 className="text-xl font-semibold mb-2 sm:mb-0">Chat de Gestão de Negócios</h2>
            <div className="flex items-center space-x-2 flex-wrap justify-end">
              <select id="personalitySelect" value={selectedPersonality} onChange={handlePersonalityChange} className="bg-blue-600 text-white text-sm rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 my-1 sm:my-0" aria-label="Selecionar personalidade da IA">
                {Object.keys(PERSONALITY_OPTIONS).map((key) => ( <option key={key} value={key}>{PERSONALITY_DISPLAY_NAMES[key]}</option>))}
              </select>
              <select id="voiceSelect" value={selectedVoice} onChange={handleVoiceChange} className="bg-blue-600 text-white text-sm rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 my-1 sm:my-0" aria-label="Selecionar voz da IA">
                {VOICE_OPTIONS.map((voice) => (<option key={voice.value} value={voice.value}>{voice.name}</option>))}
              </select>
              <label htmlFor="thinkingMode" className="flex items-center cursor-pointer text-sm my-1 sm:my-0">
                <span className="mr-2">Raciocínio Complexo</span>
                <div className="relative">
                  <input type="checkbox" id="thinkingMode" className="sr-only" checked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} aria-label="Alternar modo de raciocínio complexo"/>
                  <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${isThinkingMode ? 'translate-x-full bg-green-500' : ''}`}></div>
                </div>
              </label>
              <button onClick={handleResetChat} className="p-1 rounded-full hover:bg-blue-600 transition-colors duration-200 my-1 sm:my-0" aria-label="Iniciar Novo Chat" title="Iniciar Novo Chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.188l.056.03a1 1 0 00.902-.153l2.872-2.154a1 1 0 011.25-.015l2.872 2.154a1 1 0 00.902.153L15 5.188V3a1 1 0 112 0v5.5H3V3a1 1 0 011-1zM3 9.5h14V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM7 12a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </button>
              <button onClick={togglePopup} className="p-1 rounded-full hover:bg-blue-600 transition-colors duration-200 my-1 sm:my-0" aria-label="Fechar Chatbot">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm text-sm ${ msg.role === 'user' ? 'bg-blue-500 text-white' : msg.role === 'gemini' ? msg.isError ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 italic'}`}>
                  {msg.imageUrl && ( <img src={msg.imageUrl} alt="Carregado ou gerado" className="max-w-full h-auto rounded-md mb-2 object-contain" style={{ maxHeight: '150px' }} aria-label="Imagem na mensagem do chat" /> )}
                  {msg.videoUrl && (
                    <video controls className="max-w-full h-auto rounded-md mb-2 object-contain" style={{ maxHeight: '200px' }} aria-label="Vídeo na mensagem do chat">
                      <source src={msg.videoUrl} type={msg.videoMimeType} />
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                  )}
                  <div className="flex items-start justify-between">
                    <p className="flex-grow break-words mr-2">
                      {msg.content}
                      {msg.isStreaming && (<span className="animate-pulse ml-2">...</span>)}
                    </p>
                    {msg.role === 'gemini' && !msg.isError && msg.content && !msg.isStreaming && msg.audioBase64 && (
                      <button 
                        onClick={() => handlePlayPauseAudio(msg, index)}
                        disabled={loadingAudioIndex !== null && loadingAudioIndex !== index}
                        className="p-1 rounded-full hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait flex-shrink-0"
                        aria-label={playbackState?.index === index && playbackState.status === 'playing' ? "Pausar áudio" : "Reproduzir áudio"}
                        title={playbackState?.index === index && playbackState.status === 'playing' ? "Pausar áudio" : "Reproduzir áudio"}
                      >
                        {loadingAudioIndex === index ? (
                          <svg className="h-4 w-4 animate-spin text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : playbackState?.index === index && playbackState.status === 'playing' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {msg.webResults && msg.webResults.length > 0 && (
                    <div className={`mt-2 border-t pt-2 ${msg.role === 'user' ? 'border-blue-400' : 'border-gray-300'}`}>
                      <h4 className="text-xs font-bold mb-1">Fontes:</h4>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {msg.webResults.map((source, i) => (
                          <li key={i}>
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 break-all">
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {msg.mapsResults && msg.mapsResults.length > 0 && (
                    <div className={`mt-2 border-t pt-2 ${msg.role === 'user' ? 'border-blue-400' : 'border-gray-300'}`}>
                      <h4 className="text-xs font-bold mb-1">Resultados do Maps:</h4>
                      <ul className="list-none text-xs space-y-3">
                        {msg.mapsResults.map((result, i) => (
                          <li key={i} className="space-y-1">
                            <a href={result.uri} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:opacity-80 break-all flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline-block flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{result.title}</span>
                            </a>
                            {result.reviews && result.reviews.length > 0 && (
                               <div className="pl-6">
                                <h5 className="text-xs font-semibold mt-1">Avaliações:</h5>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    {result.reviews.map((review, j) => (
                                    <li key={j} className="text-gray-600">"{review.text}" - {review.author} ({review.rating} estrelas)</li>
                                    ))}
                                </ul>
                               </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && !messages.some(m => m.isStreaming) && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[75%] px-4 py-2 rounded-lg shadow-sm text-sm bg-gray-200 text-gray-800"><span className="animate-pulse">Pensando...</span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex items-center sticky bottom-0 w-full">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-label="Carregar arquivo de imagem"/>
            <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" aria-label="Carregar arquivo de vídeo"/>
            <button onClick={handleImageButtonClick} className="p-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || isRecording || isTranscribing} aria-label="Carregar imagem">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={handleVideoButtonClick} className="p-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || isRecording || isTranscribing} aria-label="Carregar vídeo" title="Carregar Vídeo">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button onClick={() => handleSearchModeToggle('web')} className={`p-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isSearchEnabled ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`} disabled={isLoading || isRecording || isTranscribing} aria-label="Alternar busca na web" title="Alternar Busca na Web">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9M3 12a9 9 0 019-9m-9 9a9 9 0 009 9m-9-9h18" /></svg>
            </button>
             <button onClick={() => handleSearchModeToggle('maps')} className={`p-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isMapsEnabled ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`} disabled={isLoading || isRecording || isTranscribing} aria-label="Alternar busca no Maps" title="Alternar Busca no Maps">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            {/* Novo Botão de Transcrição de Áudio */}
            <button 
              onClick={handleTranscribeAudioButtonClick} 
              className={`p-3 transition-colors duration-200 focus:outline-none focus:ring-2 ${isTranscribing ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 animate-pulse' : (isAudioLoading && !isRecording) ? 'bg-gray-400 text-white cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 disabled:opacity-50'}`} 
              disabled={isLoading || isRecording || (isAudioLoading && !isTranscribing)} // Disable if loading and NOT transcribing (meaning, another audio session is initiating)
              aria-label={isTranscribing ? 'Parar transcrição' : (isAudioLoading && !isRecording) ? 'Iniciando microfone para transcrição...' : 'Transcrever áudio'}
              title={isTranscribing ? 'Parar transcrição' : (isAudioLoading && !isRecording) ? 'Iniciando microfone para transcrição...' : 'Transcrever áudio'}
            >
              {(isAudioLoading && !isRecording && !isTranscribing) ? ( // Spinner only when initiating transcription session
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>

            {/* Botão de Chat de Voz (Existente) */}
            <button onClick={handleRecordButtonClick} className={`p-3 mr-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 animate-pulse' : (isAudioLoading && isRecording) ? 'bg-gray-400 text-white cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 disabled:opacity-50'}`} disabled={isLoading || isTranscribing || (isAudioLoading && !isRecording)} aria-label={isRecording ? 'Parar gravação de voz' : (isAudioLoading && isRecording) ? 'Iniciando chat de voz...' : 'Iniciar chat de voz'}>
              {(isAudioLoading && isRecording) ? ( // Spinner only for voice chat initiation
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTranscribing ? "Transcrevendo áudio..." : isRecording ? "Conversa por voz ativa..." : PLACEHOLDER_TEXT[selectedPersonality]}
              className="flex-1 resize-none overflow-hidden h-auto max-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mr-2 bg-gray-50"
              rows={1}
              disabled={isLoading || isRecording}
              aria-label="Entrada de chat"
            />
            <button onClick={handleSendMessage} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading || input.trim() === '' || isRecording} aria-label="Enviar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotPopup;
import {
  GoogleGenAI,
  Chat,
  Modality,
  LiveServerMessage,
  Blob as GeminiBlob,
} from '@google/genai';
import {
  WebSearchResult,
  MapSearchResult,
} from '../components/chatbot/assistantTypes';
import { getOfflineChatResponse, isOnline, analyzeMealPhotoOffline } from './offlineService';
import { getUser } from './databaseService';
import type { User } from '../types';
import { logger } from '../utils/logger';

// Tipo para LiveSession - pode não estar exportado diretamente
type LiveSession = {
  close: () => void;
  sendRealtimeInput: (input: { media: GeminiBlob }) => void;
};

// Tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare var SpeechRecognition: SpeechRecognitionConstructor | undefined;
declare var webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;

// ---------------------------------------------------------------------------
// Assistant profiles and voices
// ---------------------------------------------------------------------------

export const PERSONALITY_OPTIONS: Record<string, string> = {
  nutritionCoach:
    'Você é o FitCoach.IA, um coach de treino especializado em planos de treinamento personalizados. Responda em português com empatia, focando em orientações de treino práticas, destacando exercícios, séries, repetições e hábitos de treino saudáveis.',
  friendlySupporter:
    'Você é a Apoiadora Amigável. Traga leveza e motivação ao responder. Explique conceitos de alimentação de forma simples, com exemplos do dia a dia e incentivo positivo. Termine com uma sugestão de ação para o usuário continuar evoluindo.',
  clinicalSpecialist:
    'Você é a Especialista Clínica. Ofereça respostas objetivas e baseadas em evidências para dúvidas sobre nutrição, suplementos e saúde metabólica. Quando necessário, recomende acompanhamento com profissionais habilitados. Responda em tom técnico e direto.',
};

export const VOICE_OPTIONS = [
  { name: 'Zephyr', value: 'Zephyr' },
  { name: 'Puck', value: 'Puck' },
  { name: 'Charon', value: 'Charon' },
  { name: 'Kore', value: 'Kore' },
  { name: 'Fenrir', value: 'Fenrir' },
];

const DEFAULT_PERSONALITY_KEY = 'nutritionCoach';
const DEFAULT_VOICE_NAME = 'Zephyr';

// ---------------------------------------------------------------------------
// Gemini configuration
// ---------------------------------------------------------------------------

const FLASH_MODEL = 'gemini-flash-lite-latest';
const PRO_MODEL = 'gemini-2.5-pro';
const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image';
const LIVE_AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

interface ImportMetaEnv {
  VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  env?: ImportMetaEnv;
}

const API_KEY = (import.meta as ImportMeta)?.env?.VITE_GEMINI_API_KEY || (process.env as { API_KEY?: string }).API_KEY;
const CUSTOM_PROMPT_STORAGE_KEY = 'nutria.assistant.customPrompt';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let chatSession: Chat | undefined;
let liveAudioSession: LiveSession | undefined;
let inputAudioContext: AudioContext | undefined;
let outputAudioContext: AudioContext | undefined;
let mediaStream: MediaStream | undefined;
let mediaStreamSource: MediaStreamAudioSourceNode | undefined;
let scriptProcessor: ScriptProcessorNode | undefined;
const outputSources = new Set<AudioBufferSourceNode>();
let nextStartTime = 0;
let webSpeechRecognition: SpeechRecognition | null = null;
let webSpeechFinalTranscript = '';
let webSpeechOnTranscriptionChunk: ((text: string) => void) | null = null;

let customPromptCache: string | null = null;
let lastInstructionSignature: string | null = null;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getGeminiClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error('Gemini API key is missing. Defina VITE_GEMINI_API_KEY nas variáveis de ambiente.');
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

function loadCustomPrompt(): string {
  if (customPromptCache !== null) return customPromptCache;
  if (typeof window === 'undefined') {
    customPromptCache = '';
    return customPromptCache;
  }
  const stored = window.localStorage.getItem(CUSTOM_PROMPT_STORAGE_KEY);
  customPromptCache = stored || '';
  return customPromptCache;
}

function composeInstruction(personalityKey: string): string {
  const basePersonality =
    PERSONALITY_OPTIONS[personalityKey] ?? PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY];
  const extraContext = loadCustomPrompt();
  if (!extraContext) return basePersonality;
  return `${basePersonality}\n\nContexto personalizado do usuário:\n${extraContext}`;
}

// ---------------------------------------------------------------------------
// Custom prompt helpers
// ---------------------------------------------------------------------------

export function getAssistantCustomPrompt(): string {
  return loadCustomPrompt();
}

export function setAssistantCustomPrompt(prompt: string): void {
  customPromptCache = prompt.trim();
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_PROMPT_STORAGE_KEY, customPromptCache);
  }
  resetAssistantSession();
}

// ---------------------------------------------------------------------------
// Chat session lifecycle
// ---------------------------------------------------------------------------

export async function initializeAssistantSession(
  useProModelForThinking: boolean = false,
  personalityKey: string = DEFAULT_PERSONALITY_KEY,
): Promise<void> {
  const systemInstruction = composeInstruction(personalityKey);
  const modelToUse = useProModelForThinking ? PRO_MODEL : FLASH_MODEL;
  const instructionSignature = `${modelToUse}::${systemInstruction}`;

  if (chatSession && lastInstructionSignature === instructionSignature) {
    return;
  }

  const ai = getGeminiClient();
  
  interface ChatConfig {
    systemInstruction: string;
    thinkingConfig?: {
      thinkingBudget: number;
    };
  }
  
  const config: ChatConfig = { systemInstruction };

  if (useProModelForThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  chatSession = ai.chats.create({
    model: modelToUse,
    config,
  });
  lastInstructionSignature = instructionSignature;
}

export function resetAssistantSession(): void {
  chatSession = undefined;
  lastInstructionSignature = null;
}

// ---------------------------------------------------------------------------
// Conversational helpers
// ---------------------------------------------------------------------------

// Função auxiliar para obter dados do usuário do IndexedDB
async function getUserFromStorage(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  try {
    const user = await getUser();
    return user;
  } catch (e) {
    logger.warn('Erro ao ler dados do usuário', 'assistantService', e);
    return null;
  }
}

export async function sendAssistantMessage(
  message: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
  useProModelForThinking: boolean = false,
  personalityKey: string = DEFAULT_PERSONALITY_KEY,
): Promise<void> {
  // Verificar se está offline
  // SEMPRE priorizar modo offline para app 100% offline
  // Tentar IA Local primeiro (Ollama), depois chat offline
  logger.info('Usando modo offline: chat local', 'assistantService');
  
  const user = await getUserFromStorage();
  if (!user) {
    onError('Dados do usuário não encontrados. Por favor, recarregue a página.');
    return;
  }

  // Tentar IA Local primeiro (via Ollama se disponível)
  try {
    const { generateResponse } = await import('./iaController');
    const localResponse = await generateResponse(
      message,
      `Você é o FitCoach.IA, um coach de treino especializado. Responda de forma amigável e educativa sobre treinos, exercícios, academia e saúde.`,
      async () => {
        // Fallback para API externa APENAS se configurada e online
        const online = isOnline();
        const hasApiKey = !!API_KEY;
        
        if (!online || !hasApiKey) {
          return null;
        }
        
        try {
          await initializeAssistantSession(useProModelForThinking, personalityKey);
          if (!chatSession) {
            return null;
          }
          const responseStream = await chatSession.sendMessageStream({ message });
          let fullResponse = '';
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullResponse += chunk.text;
              onNewChunk(chunk.text);
            }
          }
          return fullResponse;
        } catch (error) {
          logger.warn('Falha na API externa', 'assistantService', error);
          return null;
        }
      }
    );

    if (localResponse) {
      // Se já foi enviado via streaming na API, não precisa enviar novamente
      if (!API_KEY || !isOnline()) {
        // Se foi resposta local, simular streaming
        const words = localResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        }
      }
      return;
    }
  } catch (error) {
    logger.warn('Falha ao usar IA Local, usando chat offline', 'assistantService', error);
  }

  // Fallback para chat offline (sempre funciona)
  const response = getOfflineChatResponse(message, user);
  const words = response.split(' ');
  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 30));
    onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
  }
}

export async function generateGroundedResponse(prompt: string): Promise<{ text: string; webResults: WebSearchResult[] }> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text ?? 'Não foi possível encontrar uma resposta.';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const webResults = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web?.title);

    return { text, webResults };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar informações na web.';
    logger.error('Erro ao gerar resposta com busca web', 'assistantService', error);
    throw new Error(errorMessage);
  }
}

export async function generateMapsGroundedResponse(prompt: string): Promise<{ text: string; mapsResults: MapSearchResult[] }> {
  const ai = getGeminiClient();

  const location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
    );
  });

  interface MapsConfig {
    tools: Array<{ googleMaps: Record<string, never> }>;
    toolConfig?: {
      retrievalConfig: {
        latLng: { latitude: number; longitude: number };
      };
    };
  }
  
  const config: MapsConfig = { tools: [{ googleMaps: {} }] };
  if (location) {
    config.toolConfig = { retrievalConfig: { latLng: location } };
  }

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config,
    });

    const text = response.text ?? 'Não foi possível obter resultados do Maps.';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    interface MapsChunk {
      maps?: {
        uri?: string;
        title?: string;
        placeAnswerSources?: {
          reviewSnippets?: Array<{
            text?: string;
            author?: string;
            rating?: number;
          }>;
        };
      };
    }

    interface ReviewSnippet {
      text?: string;
      author?: string;
      rating?: number;
    }

    const mapsResults: MapSearchResult[] = (groundingChunks as MapsChunk[])
      .map((chunk) => chunk.maps)
      .filter((maps): maps is NonNullable<MapsChunk['maps']> => !!maps)
      .map((maps) => ({
        uri: maps.uri || '',
        title: maps.title || '',
        reviews:
          maps.placeAnswerSources?.reviewSnippets?.map((review: ReviewSnippet) => ({
            text: review.text || '',
            author: review.author || 'Anônimo',
            rating: review.rating || 0,
          })) || [],
      }))
      .filter(result => result.uri && result.title);

    return { text, mapsResults };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao buscar informações no Maps.';
    logger.error('Erro ao gerar resposta com busca no Maps', 'assistantService', error);
    throw new Error(errorMessage);
  }
}

// ---------------------------------------------------------------------------
// Image & video helpers
// ---------------------------------------------------------------------------

export async function analyzeImageWithAssistant(
  base64Image: string,
  mimeType: string,
  prompt: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  // Verificar se API key está disponível e válida
  const hasApiKey = !!API_KEY;
  const online = isOnline();
  
  // Se não houver API key ou estiver offline, usar análise offline
  if (!hasApiKey || !online) {
    try {
      logger.info('Usando análise offline de imagem', 'assistantService');
      const analysis = await analyzeMealPhotoOffline(base64Image, mimeType);
      
      // Formatar análise como texto
      let analysisText = `📸 Análise da Refeição\n\n`;
      analysisText += `🍽️ Alimentos Identificados:\n`;
      analysis.alimentos_identificados.forEach(item => {
        analysisText += `• ${item.alimento}: ${item.quantidade_estimada}\n`;
      });
      
      analysisText += `\n📊 Informação Nutricional Estimada:\n`;
      analysisText += `• Calorias: ${analysis.estimativa_nutricional.total_calorias} kcal\n`;
      analysisText += `• Proteínas: ${analysis.estimativa_nutricional.total_proteinas_g}g\n`;
      analysisText += `• Carboidratos: ${analysis.estimativa_nutricional.total_carboidratos_g}g\n`;
      analysisText += `• Gorduras: ${analysis.estimativa_nutricional.total_gorduras_g}g\n`;
      
      analysisText += `\n💡 Avaliação:\n${analysis.avaliacao_geral}\n`;
      
      if (prompt && prompt.trim() && !prompt.toLowerCase().includes('analise')) {
        analysisText += `\n📝 Nota: ${prompt}`;
      }
      
      // Simular streaming para melhor UX
      const words = analysisText.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
        onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
      return;
    } catch (offlineError) {
      logger.error('Erro na análise offline', 'assistantService', offlineError);
      onError('Erro ao analisar imagem. Tente novamente.');
      return;
    }
  }

  // Tentar usar API do Gemini se disponível
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
          {
            text: `${prompt}\n\nForneça uma análise nutricional completa desta refeição, com macronutrientes estimados, pontos positivos e sugestões de melhoria alinhadas ao objetivo do usuário.`,
          },
        ],
      },
      config: {
        responseMimeType: 'text/plain',
      },
    });

    if (response.text) {
      onNewChunk(response.text);
    } else {
      onError('Não recebemos uma análise da IA.');
    }
  } catch (error: unknown) {
    // Se erro for de API key inválida, usar fallback offline
    const errorObj = error as any;
    const isApiKeyError = errorObj?.error?.code === 400 && 
                         (errorObj?.error?.message?.includes('API key') || 
                          errorObj?.error?.status === 'INVALID_ARGUMENT');
    
    if (isApiKeyError) {
      logger.info('API key inválida, usando análise offline', 'assistantService');
      try {
        const analysis = await analyzeMealPhotoOffline(base64Image, mimeType);
        
        let analysisText = `📸 Análise da Refeição (Modo Offline)\n\n`;
        analysisText += `🍽️ Alimentos Identificados:\n`;
        analysis.alimentos_identificados.forEach(item => {
          analysisText += `• ${item.alimento}: ${item.quantidade_estimada}\n`;
        });
        
        analysisText += `\n📊 Informação Nutricional Estimada:\n`;
        analysisText += `• Calorias: ${analysis.estimativa_nutricional.total_calorias} kcal\n`;
        analysisText += `• Proteínas: ${analysis.estimativa_nutricional.total_proteinas_g}g\n`;
        analysisText += `• Carboidratos: ${analysis.estimativa_nutricional.total_carboidratos_g}g\n`;
        analysisText += `• Gorduras: ${analysis.estimativa_nutricional.total_gorduras_g}g\n`;
        
        analysisText += `\n💡 Avaliação:\n${analysis.avaliacao_geral}\n`;
        
        if (prompt && prompt.trim() && !prompt.toLowerCase().includes('analise')) {
          analysisText += `\n📝 Nota: ${prompt}`;
        }
        
        // Simular streaming
        const words = analysisText.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        }
        return;
      } catch (offlineError) {
        logger.error('Erro no fallback offline', 'assistantService', offlineError);
        onError('Erro ao analisar imagem. Tente novamente.');
        return;
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar imagem.';
    logger.error('Erro ao analisar imagem', 'assistantService', error);
    onError(errorMessage);
  }
}

export async function editImageWithAssistant(
  base64Image: string,
  mimeType: string,
  prompt: string,
  onImageResponse: (imageUrl: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: IMAGE_EDIT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        onImageResponse(imageUrl);
        return;
      }
    }

    onError('A IA não retornou uma imagem editada.');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao editar imagem.';
    logger.error('Erro ao editar imagem', 'assistantService', error);
    onError(errorMessage);
  }
}

export async function analyzeVideoWithAssistant(
  base64Video: string,
  mimeType: string,
  prompt: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  const ai = getGeminiClient();
  try {
    const parts = {
      parts: [
        {
          inlineData: {
            data: base64Video,
            mimeType,
          },
        },
        { text: prompt },
      ],
    };

    const responseStream = await ai.models.generateContentStream({
      model: PRO_MODEL,
      contents: [parts],
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onNewChunk(chunk.text);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar vídeo.';
    logger.error('Erro ao analisar vídeo', 'assistantService', error);
    onError(errorMessage);
  }
}

// ---------------------------------------------------------------------------
// API key helpers (for Gemini Live Audio integration with Google AI Studio)
// ---------------------------------------------------------------------------

type AiStudioApi = {
  hasSelectedApiKey?: () => Promise<boolean>;
  openSelectKey?: () => Promise<void>;
};

export async function ensureApiKeySelected(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true;
  }

  const maybeAiStudio = (window as typeof window & { aistudio?: AiStudioApi }).aistudio;
  const hasSelectedApiKey = maybeAiStudio?.hasSelectedApiKey;
  if (typeof hasSelectedApiKey !== 'function') {
    return true;
  }

  const alreadySelected = await hasSelectedApiKey();
  if (!alreadySelected) {
    await maybeAiStudio?.openSelectKey?.();
  }

  return true;
}

// ---------------------------------------------------------------------------
// Text-to-speech helper
// ---------------------------------------------------------------------------

export async function generateSpeechFromText(text: string, voiceName: string = DEFAULT_VOICE_NAME): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ text }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error('Não foi possível gerar áudio para esta resposta.');
}

// ---------------------------------------------------------------------------
// Live audio session helpers
// ---------------------------------------------------------------------------

export async function startAssistantAudioSession(
  onTranscriptionChunk: (text: string) => void,
  onModelAudioChunk: (audioBuffer: AudioBuffer) => void,
  onModelTranscriptionChunk: (text: string) => void,
  onTurnComplete: () => void,
  onError: (error: string) => void,
): Promise<void> {
  if (liveAudioSession || webSpeechRecognition) {
    return;
  }

  // Verificar se o navegador suporta acesso ao microfone
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onError('Seu navegador não suporta acesso ao microfone. Por favor, use um navegador moderno (Chrome, Edge, Firefox ou Safari).');
    return;
  }

  // Verificar permissão do microfone antes de tentar usar
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (permissionStatus.state === 'denied') {
      onError('Permissão do microfone foi negada. Por favor, permita o acesso ao microfone nas configurações do navegador e recarregue a página.');
      return;
    }
  } catch (permError) {
    // Alguns navegadores não suportam navigator.permissions.query, continuar normalmente
    logger.debug('Não foi possível verificar permissão do microfone (navegador pode não suportar)', 'assistantService');
  }

  // Verificar se Web Speech API está disponível
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const useWebSpeech = !API_KEY && !!SpeechRecognition;

  // Tentar usar Web Speech API (offline) se Gemini não estiver disponível
  if (useWebSpeech) {
    try {
      webSpeechRecognition = new SpeechRecognition();
      webSpeechRecognition.continuous = true;
      webSpeechRecognition.interimResults = true;
      webSpeechRecognition.lang = 'pt-BR';
      webSpeechFinalTranscript = '';
      webSpeechOnTranscriptionChunk = onTranscriptionChunk;

      webSpeechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            webSpeechFinalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Enviar transcrição completa (final + interim)
        const fullTranscript = webSpeechFinalTranscript + interimTranscript;
        if (fullTranscript.trim() && webSpeechOnTranscriptionChunk) {
          webSpeechOnTranscriptionChunk(fullTranscript);
        }
      };

      webSpeechRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error('Erro na Web Speech API', 'assistantService', event);
        if (event.error === 'no-speech') {
          // Ignorar erro de "no-speech" - é normal quando não há fala
          return;
        }
        
        // Tratamento específico para erro de permissão
        if (event.error === 'not-allowed') {
          onError('Permissão do microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador e tente novamente.');
          stopAssistantAudioSession();
          return;
        }
        
        // Tratamento para outros erros comuns
        let errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
        if (event.error === 'aborted') {
          errorMessage = 'Reconhecimento de voz foi interrompido.';
        } else if (event.error === 'network') {
          errorMessage = 'Erro de rede no reconhecimento de voz. Verifique sua conexão.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Não foi possível capturar áudio. Verifique se o microfone está conectado e funcionando.';
        } else if (event.error === 'service-not-allowed') {
          errorMessage = 'Serviço de reconhecimento de voz não permitido. Verifique as configurações do navegador.';
        }
        
        onError(errorMessage);
        stopAssistantAudioSession();
      };

      webSpeechRecognition.onend = () => {
        // Se ainda estiver gravando, reiniciar automaticamente
        if (webSpeechRecognition) {
          try {
            webSpeechRecognition.start();
          } catch (e) {
            // Pode falhar se já estiver iniciado, ignorar
          }
        }
      };

      webSpeechRecognition.start();
      logger.info('Usando Web Speech API para reconhecimento de voz', 'assistantService');
      return;
    } catch (error: unknown) {
      logger.warn('Falha ao iniciar Web Speech API, tentando Gemini', 'assistantService', error);
      // Continuar para tentar Gemini
    }
  }

  // Tentar usar Gemini Live Audio API
  try {
    const ai = getGeminiClient();
    
    // Solicitar permissão do microfone com tratamento de erro específico
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (mediaError: any) {
      const errorName = mediaError?.name || mediaError?.message || 'unknown';
      if (errorName === 'NotAllowedError' || errorName.includes('not-allowed') || mediaError?.message?.includes('permission')) {
        onError('Permissão do microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador e tente novamente.');
        stopAssistantAudioSession();
        return;
      } else if (errorName === 'NotFoundError' || errorName.includes('not-found')) {
        onError('Nenhum microfone encontrado. Verifique se o microfone está conectado.');
        stopAssistantAudioSession();
        return;
      } else if (errorName === 'NotReadableError' || errorName.includes('not-readable')) {
        onError('Não foi possível acessar o microfone. Ele pode estar sendo usado por outro aplicativo.');
        stopAssistantAudioSession();
        return;
      }
      throw mediaError; // Re-lançar outros erros
    }

    inputAudioContext = new AudioContext({ sampleRate: 16_000 });
    outputAudioContext = new AudioContext({ sampleRate: 24_000 });

    mediaStreamSource = inputAudioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = inputAudioContext.createScriptProcessor(4_096, 1, 1);

    scriptProcessor.onaudioprocess = (event) => {
      if (!liveAudioSession) return;
      const channelData = event.inputBuffer.getChannelData(0);
      const blob = createGeminiBlob(channelData);
      liveAudioSession.sendRealtimeInput({ media: blob });
    };

    mediaStreamSource.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);

    liveAudioSession = await ai.live.connect({
      model: LIVE_AUDIO_MODEL,
      callbacks: {
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            onTranscriptionChunk(message.serverContent.inputTranscription.text);
          }

          if (message.serverContent?.outputTranscription) {
            onModelTranscriptionChunk(message.serverContent.outputTranscription.text);
          }

          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputAudioContext) {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(
              decode(audioData),
              outputAudioContext,
              24_000,
              1,
            );
            onModelAudioChunk(audioBuffer);
          }

          if (message.serverContent?.turnComplete) {
            onTurnComplete();
          }
        },
        onerror: (event) => {
          logger.error('Erro na sessão de áudio ao vivo', 'assistantService', event);
          onError(event.message || 'Falha na sessão de áudio.');
          stopAssistantAudioSession();
        },
        onclose: () => {
          stopAssistantAudioSession();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE_NAME } },
        },
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    });
    logger.info('Usando Gemini Live Audio API', 'assistantService');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar áudio.';
    logger.error('Erro ao iniciar sessão de áudio', 'assistantService', error);
    
    // Se Gemini falhar e Web Speech não foi tentado, tentar Web Speech
    if (!webSpeechRecognition && SpeechRecognition) {
      try {
        webSpeechRecognition = new SpeechRecognition();
        webSpeechRecognition.continuous = true;
        webSpeechRecognition.interimResults = true;
        webSpeechRecognition.lang = 'pt-BR';
        webSpeechFinalTranscript = '';
        webSpeechOnTranscriptionChunk = onTranscriptionChunk;

        webSpeechRecognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              webSpeechFinalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = webSpeechFinalTranscript + interimTranscript;
          if (fullTranscript.trim() && webSpeechOnTranscriptionChunk) {
            webSpeechOnTranscriptionChunk(fullTranscript);
          }
        };

        webSpeechRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'no-speech') {
            return;
          }
          
          // Tratamento específico para erro de permissão
          if (event.error === 'not-allowed') {
            onError('Permissão do microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador e tente novamente.');
            stopAssistantAudioSession();
            return;
          }
          
          // Tratamento para outros erros comuns
          let errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
          if (event.error === 'aborted') {
            errorMessage = 'Reconhecimento de voz foi interrompido.';
          } else if (event.error === 'network') {
            errorMessage = 'Erro de rede no reconhecimento de voz. Verifique sua conexão.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Não foi possível capturar áudio. Verifique se o microfone está conectado e funcionando.';
          } else if (event.error === 'service-not-allowed') {
            errorMessage = 'Serviço de reconhecimento de voz não permitido. Verifique as configurações do navegador.';
          }
          
          onError(errorMessage);
          stopAssistantAudioSession();
        };

        webSpeechRecognition.onend = () => {
          if (webSpeechRecognition) {
            try {
              webSpeechRecognition.start();
            } catch (e) {
              // Ignorar
            }
          }
        };

        webSpeechRecognition.start();
        logger.info('Fallback para Web Speech API', 'assistantService');
        return;
      } catch (fallbackError) {
        logger.error('Falha no fallback Web Speech API', 'assistantService', fallbackError);
      }
    }
    
    onError(errorMessage);
    stopAssistantAudioSession();
  }
}

export function stopAssistantAudioSession(): void {
  // Parar Web Speech Recognition se estiver ativo
  if (webSpeechRecognition) {
    try {
      webSpeechRecognition.stop();
      // Enviar transcrição final se houver
      if (webSpeechFinalTranscript.trim() && webSpeechOnTranscriptionChunk) {
        webSpeechOnTranscriptionChunk(webSpeechFinalTranscript.trim());
      }
      webSpeechRecognition = null;
      webSpeechFinalTranscript = '';
      webSpeechOnTranscriptionChunk = null;
    } catch (error) {
      logger.warn('Erro ao parar Web Speech Recognition', 'assistantService', error);
    }
  }

  if (liveAudioSession) {
    try {
      liveAudioSession.close();
    } catch (error) {
      logger.warn('Erro ao encerrar sessão de áudio', 'assistantService', error);
    }
  }

  liveAudioSession = undefined;

  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor.onaudioprocess = null;
    scriptProcessor = undefined;
  }

  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
    mediaStreamSource = undefined;
  }

  if (inputAudioContext) {
    inputAudioContext.close();
    inputAudioContext = undefined;
  }

  if (outputAudioContext) {
    outputAudioContext.close();
    outputAudioContext = undefined;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = undefined;
  }

  for (const source of outputSources) {
    try {
      source.stop();
    } catch (error) {
      logger.warn('Erro ao parar source de áudio', 'assistantService', error);
    }
  }

  outputSources.clear();
  nextStartTime = 0;
}

export function playAssistantAudioChunk(audioBuffer: AudioBuffer): void {
  if (!outputAudioContext) return;

  nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);

  const source = outputAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(outputAudioContext.destination);
  source.addEventListener('ended', () => outputSources.delete(source));
  source.start(nextStartTime);
  nextStartTime += audioBuffer.duration;
  outputSources.add(source);
}

function createGeminiBlob(data: Float32Array): GeminiBlob {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const int16 = new Int16Array(data.buffer);
  const frameCount = int16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = int16[i * numChannels + channel] / 32768;
    }
  }

  return buffer;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


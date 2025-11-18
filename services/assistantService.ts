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
import { getOfflineChatResponse, isOnline } from './offlineService';
import type { User } from '../types';
import { logger } from '../utils/logger';

// Tipo para LiveSession - pode não estar exportado diretamente
type LiveSession = {
  close: () => void;
  sendRealtimeInput: (input: { media: GeminiBlob }) => void;
};

// ---------------------------------------------------------------------------
// Assistant profiles and voices
// ---------------------------------------------------------------------------

export const PERSONALITY_OPTIONS: Record<string, string> = {
  nutritionCoach:
    'Você é a Nutri.IA, uma coach nutricional especializada em planos alimentares personalizados. Responda em português com empatia, focando em orientações nutricionais práticas, destacando macronutrientes, equilíbrio e hábitos saudáveis.',
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

// Função auxiliar para obter dados do usuário do localStorage
function getUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem('nutri.user');
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch (e) {
    logger.warn('Erro ao ler dados do usuário', 'assistantService', e);
  }
  return null;
}

export async function sendAssistantMessage(
  message: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
  useProModelForThinking: boolean = false,
  personalityKey: string = DEFAULT_PERSONALITY_KEY,
): Promise<void> {
  // Verificar se está offline
  const online = isOnline();
  const hasApiKey = !!API_KEY;

  if (!online || !hasApiKey) {
    // Usar chat offline
    logger.info('Modo offline: usando chat offline', 'assistantService');
    const user = getUserFromStorage();
    if (user) {
      const response = getOfflineChatResponse(message, user);
      // Simular streaming para manter consistência com a UI
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30)); // Pequeno delay para simular streaming
        onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
      return;
    } else {
      onError('Dados do usuário não encontrados. Por favor, recarregue a página.');
      return;
    }
  }

  // Tentar usar API online
  try {
    await initializeAssistantSession(useProModelForThinking, personalityKey);

    if (!chatSession) {
      onError('Sessão indisponível.');
      return;
    }

    const responseStream = await chatSession.sendMessageStream({ message });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        onNewChunk(chunk.text);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao enviar mensagem para assistente', 'assistantService', error);
    logger.info('Falha na API online, usando chat offline', 'assistantService');
    
    // Fallback para chat offline em caso de erro
    const user = getUserFromStorage();
    if (user) {
      const response = getOfflineChatResponse(message, user);
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        onNewChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
    } else {
      onError(errorMessage || 'Erro desconhecido ao conversar com a IA');
    }
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
  if (liveAudioSession) {
    return;
  }

  try {
    const ai = getGeminiClient();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar áudio.';
    logger.error('Erro ao iniciar sessão de áudio', 'assistantService', error);
    onError(errorMessage);
    stopAssistantAudioSession();
  }
}

export function stopAssistantAudioSession(): void {
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


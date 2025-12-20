import { GoogleGenAI, Chat, Modality, Blob, LiveSession, LiveServerMessage, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage, MapSearchResult, WebSearchResult } from '../types';
import { logger } from '../../utils/logger';

let chatSession: Chat | undefined;
// Live API related variables
let liveAudioSession: LiveSession | undefined;
let isCleaningUp = false;
let sessionPromiseForCleanup: Promise<LiveSession> | null = null; // For handling race conditions on stop
let inputAudioContext: AudioContext | undefined;
let outputAudioContext: AudioContext | undefined;
let nextStartTime = 0;
const outputSources = new Set<AudioBufferSourceNode>();
let mediaStream: MediaStream | undefined;
let mediaStreamSource: MediaStreamAudioSourceNode | undefined;
let scriptProcessor: ScriptProcessorNode | undefined;
let monitoringInterval: NodeJS.Timeout | null = null; // Para monitorar uso de voz

// The `window.aistudio` type is already declared globally (e.g., in a d.ts file or another module).
// Removing this redundant declaration to resolve the TypeScript error.
// declare global {
//   interface Window {
//     aistudio: {
//       hasSelectedApiKey: () => Promise<boolean>;
//       openSelectKey: () => Promise<void>;
//     };
//   }
// }

// Function declarations for live session tool calling
const searchWebFunctionDeclaration: FunctionDeclaration = {
  name: 'searchWeb',
  parameters: {
    type: Type.OBJECT,
    description: 'Performs a web search to find up-to-date information.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query.',
      },
    },
    required: ['query'],
  },
};

const searchMapsFunctionDeclaration: FunctionDeclaration = {
  name: 'searchMaps',
  parameters: {
    type: Type.OBJECT,
    description: 'Searches on a map for places like restaurants or stores.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query for a place.',
      },
    },
    required: ['query'],
  },
};

const logMealFunctionDeclaration: FunctionDeclaration = {
  name: 'logMeal',
  parameters: {
    type: Type.OBJECT,
    description: 'Registra uma refeição consumida pelo usuário no diário alimentar. Use esta ferramenta quando o usuário mencionar que comeu algo.',
    properties: {
      foodName: {
        type: Type.STRING,
        description: 'Nome do alimento ou refeição consumida.',
      },
      calories: {
        type: Type.NUMBER,
        description: 'Calorias estimadas (opcional, estime se não informado).',
      },
      protein: {
        type: Type.NUMBER,
        description: 'Proteínas em gramas (opcional, estime se não informado).',
      },
      carbs: {
        type: Type.NUMBER,
        description: 'Carboidratos em gramas (opcional, estime se não informado).',
      },
      fats: {
        type: Type.NUMBER,
        description: 'Gorduras em gramas (opcional, estime se não informado).',
      },
      mealType: {
        type: Type.STRING,
        description: 'Tipo de refeição: breakfast, lunch, dinner ou snack.',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      },
      description: {
        type: Type.STRING,
        description: 'Descrição adicional da refeição (opcional).',
      },
    },
    required: ['foodName', 'mealType'],
  },
};


// Personality Options
export const PERSONALITY_OPTIONS = {
  businessExpert: "Você é um especialista prestativo em gestão de negócios, fornecendo respostas claras e concisas para perguntas sobre estratégia de negócios, operações, finanças e marketing. Mantenha as respostas focadas em tópicos de gestão de negócios. Responda sempre em português.",
  friendlyHelper: "Você é o Ajudante Amigável, um companheiro de conversa que torna a interação leve e acolhedora, explicando qualquer assunto de forma simples, direta e com um tom positivo. Use uma linguagem natural e empática, simplificando o complexo em diálogos de parágrafo único, e sempre termine com uma pergunta para manter a conversa fluindo.",
  conciseProfessional: "Você é o Profissional Conciso, seu papel é dar explicações claras e diretas sobre o funcionamento do aplicativo, usando listas se necessário. Mantenha as respostas curtas, técnicas e focadas apenas em informações factuais, sem adicionar opiniões ou linguagem informal.",
};

// Voice Options (prebuilt voice names from Gemini API documentation)
export const VOICE_OPTIONS = [
  { name: 'Zephyr', value: 'Zephyr' },
  { name: 'Puck', value: 'Puck' },
  { name: 'Charon', value: 'Charon' },
  { name: 'Kore', value: 'Kore' },
  { name: 'Fenrir', value: 'Fenrir' },
];

const DEFAULT_PERSONALITY_KEY = 'businessExpert';
const DEFAULT_VOICE_NAME = 'Zephyr';

const FLASH_MODEL = 'gemini-flash-lite-latest';
const PRO_MODEL = 'gemini-2.5-pro';
const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image';
const LIVE_AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Backend proxy base URL para chamadas de texto (chat); recursos avançados
// como Live Audio e ferramentas ainda usam GoogleGenAI diretamente e
// serão migrados em uma etapa posterior.
const AI_BACKEND_BASE =
  import.meta.env.VITE_AI_BACKEND_URL || '/api';

// Cliente Gemini direto ainda é usado apenas para Live Audio e processamento de imagem/vídeo.
// Grounded/Maps/TTS agora usam o backend proxy para segurança e controle de custo.
function getGeminiClient(): GoogleGenAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || undefined;
  if (!apiKey) {
    throw new Error(
      'API key for Gemini is not configured. Please set VITE_GEMINI_API_KEY in your .env file.',
    );
  }
  return new GoogleGenAI({ apiKey });
}

// initializeChat deixa de abrir sessão direto com Gemini para texto; o fluxo
// principal de chat de texto passa a usar o backend /ai/text. Mantemos a
// assinatura vazia para compatibilidade com chamadas existentes.
export async function initializeChat(
  _useProModelForThinking: boolean = false,
  _systemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
): Promise<void> {
  // Nada a fazer: o backend recebe apenas o último prompt e decide contexto.
}

export async function sendMessageToGemini(
  message: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
  useProModelForThinking: boolean = false,
  imageFile?: { base64: string; mimeType: string },
  currentSystemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
): Promise<void> {
  try {
    // Para chat de texto, usar backend /ai/text e simular streaming
    const modelToUse = useProModelForThinking ? PRO_MODEL : FLASH_MODEL;

    // Incluir instrução de sistema simples no prompt enviado ao backend
    const promptWithSystem = `${currentSystemInstruction}\n\nUsuário: ${message}`;

    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'chatbot', // opcional: pode ser substituído por ID real se houver
        gymId: null,
        feature: 'chat',
        model: modelToUse,
        prompt: promptWithSystem,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      onError(
        `Falha ao chamar backend de IA: ${res.status} ${res.statusText} - ${text}`,
      );
      return;
    }

    const data = await res.json();
    const fullText: string = data.text || '';
    if (!fullText.trim()) {
      onError('Resposta vazia do backend de IA.');
      return;
    }

    // Simular streaming dividindo a resposta em pedaços
    const chunks = fullText.split(/(\. |\n)/).filter((c) => c && c.trim());
    for (const chunk of chunks) {
      onNewChunk(chunk);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro na API do Gemini", 'chatbot/geminiService', error);
    onError(`Failed to get response from Gemini: ${errorMessage}`);
  }
}

export async function generateGroundedResponse(prompt: string): Promise<{ text: string; webResults: WebSearchResult[] }> {
  try {
    const res = await fetch(`${AI_BACKEND_BASE}/ai/grounded`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'chatbot', // TODO: substituir por ID real do usuário quando disponível
        gymId: null,
        model: FLASH_MODEL,
        prompt,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    return {
      text: data.text || "No text response found.",
      webResults: data.webResults || [],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro na API de busca web do Gemini", 'chatbot/geminiService', error);
    throw new Error(`Failed to get grounded response: ${errorMessage}`);
  }
}

export async function generateMapsGroundedResponse(prompt: string): Promise<{ text: string; mapsResults: MapSearchResult[] }> {
  // Obter localização do navegador
  const location = await new Promise<{latitude: number, longitude: number} | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null) // Error or permission denied
    );
  });

  try {
    const body: any = {
      userId: 'chatbot', // TODO: substituir por ID real do usuário quando disponível
      gymId: null,
      model: FLASH_MODEL,
      prompt,
    };

    if (location) {
      body.latitude = location.latitude;
      body.longitude = location.longitude;
    }

    const res = await fetch(`${AI_BACKEND_BASE}/ai/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    return {
      text: data.text || "No text response found.",
      mapsResults: data.mapsResults || [],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro na API de Maps do Gemini", 'chatbot/geminiService', error);
    throw new Error(`Failed to get maps grounded response: ${errorMessage}`);
  }
}


export async function processImageWithGemini(
  base64Image: string,
  mimeType: string,
  prompt: string,
  modelType: 'analysis' | 'editing',
  onNewChunk: (chunk: string) => void,
  onImageResponse: (imageUrl: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  const ai = getGeminiClient();
  let model: string;
  let responseModalities: Modality[] | undefined;

  const contents = {
    parts: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ],
  };

  if (modelType === 'analysis') {
    model = FLASH_MODEL; // For general image understanding
    responseModalities = undefined; // Text output expected
  } else if (modelType === 'editing') {
    model = IMAGE_EDIT_MODEL; // For image editing
    responseModalities = [Modality.IMAGE]; // Image output expected
  } else {
    onError("Invalid model type for image processing.");
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseModalities: responseModalities,
      },
    });

    if (modelType === 'editing') {
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const generatedBase64Image: string = part.inlineData.data;
          const imageUrl = `data:${part.inlineData.mimeType};base64,${generatedBase64Image}`;
          onImageResponse(imageUrl);
          return; // Only expect one image for editing
        }
      }
      onError("No image was returned from the editing model.");
    } else { // analysis
      if (response.text) {
        onNewChunk(response.text);
      } else {
        onError("No text response from image analysis.");
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Erro na API de processamento de imagem do Gemini (${modelType})`, 'chatbot/geminiService', error);
    onError(`Failed to process image: ${errorMessage}`);
  }
}

export async function analyzeVideoWithGemini(
  base64Video: string,
  mimeType: string,
  prompt: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const ai = getGeminiClient();
  try {
    const contents = {
      parts: [
        {
          inlineData: {
            data: base64Video,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    };

    const responseStream = await ai.models.generateContentStream({
      model: PRO_MODEL,
      contents: [contents],
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onNewChunk(chunk.text);
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro na API de análise de vídeo do Gemini", 'chatbot/geminiService', error);
    onError(`Failed to analyze video: ${errorMessage}`);
  }
}

// Function to reset the chat session if needed (e.g., for starting a new conversation context)
export function resetChatSession(): void {
  chatSession = undefined;
  // A new session will be created on the next message
}

/**
 * Ensures that an API key has been selected by the user.
 * If no key is selected, it prompts the user to select one.
 * @returns {Promise<boolean>} True if a key is available or prompted successfully, false otherwise.
 */
interface AiStudioApi {
  hasSelectedApiKey?: () => Promise<boolean>;
  openSelectKey?: () => Promise<void>;
}

interface WindowWithAiStudio extends Window {
  aistudio?: AiStudioApi;
}

export async function ensureApiKeySelected(): Promise<boolean> {
  const windowWithAiStudio = window as WindowWithAiStudio;
  
  if (typeof window === 'undefined' || !windowWithAiStudio.aistudio || typeof windowWithAiStudio.aistudio.hasSelectedApiKey !== 'function') {
    logger.warn("window.aistudio ou hasSelectedApiKey não disponível. Não é possível verificar seleção de API key.", 'chatbot/geminiService');
    // If aistudio methods are not available, we proceed assuming API_KEY from env is sufficient
    // or the environment handles it.
    return true; 
  }

  const hasKey = await windowWithAiStudio.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    logger.info("Nenhuma API key selecionada. Abrindo diálogo de seleção.", 'chatbot/geminiService');
    await windowWithAiStudio.aistudio.openSelectKey?.();
    // Assume selection was successful for the next API call attempt.
    // The actual API call will fail if the user doesn't select one.
    return true; 
  }
  return true;
}

// Live Audio API Functions
export async function startLiveAudioSession(
  onTranscriptionChunk: (text: string) => void,
  onModelAudioChunk: (audioBuffer: AudioBuffer) => void,
  onModelTranscriptionChunk: (text: string) => void,
  onTurnComplete: (results: { webResults?: WebSearchResult[], mapsResults?: MapSearchResult[], mealLogged?: boolean }) => void,
  onSuccess: () => void,
  onError: (error: string, isApiKeyError: boolean) => void, // Modified onError signature
  onSessionEndedUnexpectedly: () => void,
  voiceName: string = DEFAULT_VOICE_NAME,
  systemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
  onToolCallStart: (toolName: string, query: string) => void,
  onToolCallResult: (toolName: string) => void,
  useWebSearch: boolean,
  useMapsSearch: boolean,
  useMealLogging: boolean = false,
  onMealLogged?: (meal: { foodName: string; calories?: number; protein?: number; carbs?: number; fats?: number; mealType: string; description?: string }) => void,
  onVolumeLevel?: (level: number) => void, // Callback para medidor de volume (0-100)
  getIsMicMuted?: () => boolean, // Função para obter estado do mute dinamicamente
): Promise<void> {
  if (liveAudioSession || sessionPromiseForCleanup) {
    logger.warn("Sessão de áudio ao vivo já ativa ou conectando. Fechando sessão existente para reiniciar com nova configuração.", 'chatbot/geminiService');
    await stopLiveAudioSession(); // Ensure existing session is stopped
  }

  // Verificar limite de voz antes de iniciar
  try {
    const { checkVoiceUsage } = await import('../../services/usageLimitService');
    const voiceStatus = await checkVoiceUsage();
    if (!voiceStatus.canUse) {
      onError('Limite diário atingido. Gerencie sua conta em nosso site.', false);
      return;
    }
  } catch (error) {
    logger.warn('Erro ao verificar limite de voz', 'chatbot/geminiService', error);
    // Continuar mesmo se falhar a verificação
  }

  // Variáveis para monitoramento de tempo
  let sessionStartTime = Date.now();
  let lastCheckTime = Date.now();
  const CHECK_INTERVAL = 1000; // Verificar a cada 1 segundo

  try {
    const ai = getGeminiClient();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    interface WindowWithAudioContext extends Window {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    }
    
    const windowWithAudioContext = window as WindowWithAudioContext;
    const AudioContextClass = windowWithAudioContext.AudioContext || windowWithAudioContext.webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('AudioContext não está disponível neste navegador');
    }
    
    inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
    outputAudioContext = new AudioContextClass({ sampleRate: 24000 });

    if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
    if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
    
    mediaStreamSource = inputAudioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

    const tools: FunctionDeclaration[] = [];
    if (useWebSearch) tools.push(searchWebFunctionDeclaration);
    if (useMapsSearch) tools.push(searchMapsFunctionDeclaration);
    if (useMealLogging) tools.push(logMealFunctionDeclaration);

    interface LiveConfig {
      responseModalities: Modality[];
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: string };
        };
      };
      systemInstruction: string;
      outputAudioTranscription: Record<string, never>;
      inputAudioTranscription: Record<string, never>;
      tools?: Array<{ functionDeclarations: FunctionDeclaration[] }>;
    }
    
    const liveConfig: LiveConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        systemInstruction: systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
    };

    if (tools.length > 0) {
        liveConfig.tools = [{ functionDeclarations: tools }];
    }
    
    let turnToolResults: { webResults?: WebSearchResult[], mapsResults?: MapSearchResult[], mealLogged?: boolean } = {};

    const sessionPromise = ai.live.connect({
      model: LIVE_AUDIO_MODEL,
      callbacks: {
        onopen: () => {
          logger.debug('Sessão ao vivo aberta', 'chatbot/geminiService');
          sessionStartTime = Date.now();
          lastCheckTime = Date.now();
          
          // Iniciar monitoramento de tempo
          monitoringInterval = setInterval(async () => {
            try {
              const elapsed = Math.floor((Date.now() - lastCheckTime) / 1000);
              if (elapsed > 0) {
                const { consumeVoiceSeconds, checkVoiceUsage } = await import('../../services/usageLimitService');
                
                // Consumir segundos decorridos
                const consumeResult = await consumeVoiceSeconds(elapsed);
                if (!consumeResult.success) {
                  // Limite atingido, encerrar sessão
                  logger.warn('Limite de voz atingido, encerrando sessão', 'chatbot/geminiService');
                  clearInterval(monitoringInterval!);
                  monitoringInterval = null;
                  await stopLiveAudioSession();
                  onError('Limite diário atingido. Gerencie sua conta em nosso site.', false);
                  onSessionEndedUnexpectedly();
                  return;
                }
                
                // Verificar se ainda há saldo
                const status = await checkVoiceUsage();
                if (!status.canUse) {
                  logger.warn('Limite de voz atingido, encerrando sessão', 'chatbot/geminiService');
                  clearInterval(monitoringInterval!);
                  monitoringInterval = null;
                  await stopLiveAudioSession();
                  onError('Limite diário atingido. Gerencie sua conta em nosso site.', false);
                  onSessionEndedUnexpectedly();
                  return;
                }
                
                lastCheckTime = Date.now();
              }
            } catch (error) {
              logger.error('Erro no monitoramento de voz', 'chatbot/geminiService', error);
            }
          }, CHECK_INTERVAL);
          
          onSuccess();
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) onTranscriptionChunk(message.serverContent.inputTranscription.text);
          if (message.serverContent?.outputTranscription) onModelTranscriptionChunk(message.serverContent.outputTranscription.text);
          
          if (message.serverContent?.turnComplete) {
            onTurnComplete(turnToolResults);
            turnToolResults = {}; // Reset for the next turn
          }

          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64EncodedAudioString && outputAudioContext) {
            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
            onModelAudioChunk(audioBuffer);
          }

          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              const query = fc.args.query || fc.args.foodName || '';
              onToolCallStart(fc.name, query);
              let results;
              try {
                if (fc.name === 'searchWeb') {
                  results = await generateGroundedResponse(fc.args.query);
                  if (results.webResults) {
                    turnToolResults.webResults = [...(turnToolResults.webResults || []), ...results.webResults];
                  }
                } else if (fc.name === 'searchMaps') {
                  results = await generateMapsGroundedResponse(fc.args.query);
                  if (results.mapsResults) {
                     turnToolResults.mapsResults = [...(turnToolResults.mapsResults || []), ...results.mapsResults];
                  }
                } else if (fc.name === 'logMeal') {
                  // Registrar refeição
                  const mealData = {
                    foodName: fc.args.foodName,
                    calories: fc.args.calories,
                    protein: fc.args.protein,
                    carbs: fc.args.carbs,
                    fats: fc.args.fats,
                    mealType: fc.args.mealType,
                    description: fc.args.description,
                  };
                  
                  if (onMealLogged) {
                    onMealLogged(mealData);
                  }
                  
                  turnToolResults.mealLogged = true;
                  results = { text: `Refeição "${mealData.foodName}" registrada com sucesso no diário!` };
                } else {
                  throw new Error(`Unknown function call: ${fc.name}`);
                }
                onToolCallResult(fc.name);
                const functionResponse = { id: fc.id, name: fc.name, response: { result: results.text } };
                sessionPromise.then((session) => session.sendToolResponse({ functionResponses: functionResponse }));
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error(`Erro ao executar ferramenta ${fc.name}`, 'chatbot/geminiService', error);
                onToolCallResult(fc.name); // Still need to signal result to hide loading message
                const errorResponse = { id: fc.id, name: fc.name, response: { error: `Failed to execute tool: ${errorMessage}` } };
                sessionPromise.then((session) => session.sendToolResponse({ functionResponses: errorResponse }));
              }
            }
          }
          
          if (message.serverContent?.interrupted) {
            for (const source of outputSources.values()) {
              source.stop();
              outputSources.delete(source);
            }
            nextStartTime = 0;
          }
        },
        onerror: (e: ErrorEvent) => {
          logger.error('Erro na sessão ao vivo', 'chatbot/geminiService', e);
          const errorMessage = e.message || 'Unknown error';
          const isApiKeyIssue = errorMessage.includes("API key was reported as leaked") || errorMessage.includes("Requested entity was not found.");
          onError(`Live audio error: ${errorMessage}`, isApiKeyIssue); // Pass isApiKeyIssue
          stopLiveAudioSession().then(onSessionEndedUnexpectedly);
        },
        onclose: (e: CloseEvent) => {
          logger.debug('Sessão ao vivo fechada', 'chatbot/geminiService');
          // Parar monitoramento
          if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
          }
          // Consumir tempo restante
          const elapsed = Math.floor((Date.now() - lastCheckTime) / 1000);
          if (elapsed > 0) {
            import('../../services/usageLimitService').then(({ consumeVoiceSeconds }) => {
              consumeVoiceSeconds(elapsed).catch(err => 
                logger.warn('Erro ao consumir tempo final', 'chatbot/geminiService', err)
              );
            });
          }
          stopLiveAudioSession().then(onSessionEndedUnexpectedly);
        },
      },
      config: liveConfig,
    });

    sessionPromiseForCleanup = sessionPromise;

    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      
      // Verificar estado do mute dinamicamente
      const isMuted = getIsMicMuted ? getIsMicMuted() : false;
      
      // Calcular nível de volume para medidor visual
      if (onVolumeLevel) {
        if (!isMuted) {
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const average = sum / inputData.length;
          const volumeLevel = Math.min(100, Math.max(0, average * 200)); // Normalizar para 0-100
          onVolumeLevel(volumeLevel);
        } else {
          onVolumeLevel(0);
        }
      }
      
      // Enviar áudio apenas se microfone não estiver mutado
      if (!isMuted) {
        const pcmBlob = createBlob(inputData);
        sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
      }
    };

    mediaStreamSource.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);

    liveAudioSession = await sessionPromise;
    sessionPromiseForCleanup = null;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro ao iniciar sessão de áudio ao vivo", 'chatbot/geminiService', error);
    const isApiKeyIssue = errorMessage.includes("API key was reported as leaked") || errorMessage.includes("Requested entity was not found.");
    onError(`Failed to start audio session: ${errorMessage}`, isApiKeyIssue); // Pass isApiKeyIssue
    await stopLiveAudioSession();
  }
}

export async function stopLiveAudioSession(): Promise<void> {
  if (isCleaningUp) return;
  isCleaningUp = true;
  
  // Parar monitoramento se estiver ativo
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  try {
    if (sessionPromiseForCleanup) {
      sessionPromiseForCleanup.then(session => session.close()).catch(e => logger.error("Erro ao fechar sessão pendente", 'chatbot/geminiService', e));
      sessionPromiseForCleanup = null;
    }
    
    if (liveAudioSession) {
      const sessionToClose = liveAudioSession;
      liveAudioSession = undefined;
      sessionToClose.close();
    }

    scriptProcessor?.disconnect();
    mediaStreamSource?.disconnect();
    mediaStream?.getTracks().forEach(track => track.stop());
    scriptProcessor = undefined;
    mediaStreamSource = undefined;
    mediaStream = undefined;

    const closePromises: Promise<void>[] = [];
    if (inputAudioContext && inputAudioContext.state !== 'closed') {
      closePromises.push(inputAudioContext.close());
      inputAudioContext = undefined;
    }
    if (outputAudioContext && outputAudioContext.state !== 'closed') {
      closePromises.push(outputAudioContext.close());
      outputAudioContext = undefined;
    }

    if (closePromises.length > 0) {
      await Promise.all(closePromises);
    }

    for (const source of outputSources.values()) {
      try { source.stop(); } catch (e) { /* ignore errors on already stopped sources */ }
    }
    outputSources.clear();
    nextStartTime = 0;
    logger.debug('Sessão de áudio ao vivo parada e recursos liberados', 'chatbot/geminiService');
  } finally {
    isCleaningUp = false;
  }
}

// New TTS Function
export async function generateSpeechFromText(text: string, voiceName: string): Promise<string> {
  try {
    const res = await fetch(`${AI_BACKEND_BASE}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'chatbot', // TODO: substituir por ID real do usuário quando disponível
        gymId: null,
        text,
        voiceName: voiceName || DEFAULT_VOICE_NAME,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error("No audio data was returned from the API.");
    }
    return data.audioBase64;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Erro na API de TTS do Gemini", 'chatbot/geminiService', error);
    throw new Error(`Failed to generate speech: ${errorMessage}`);
  }
}

// Utility functions for Live API audio processing
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    // Fix: Corrected typo from Uint8A to Uint8Array.
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function playAudioChunk(audioBuffer: AudioBuffer) {
  if (!outputAudioContext) return;

  nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);

  const source = outputAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(outputAudioContext.destination); // Connect directly to destination for playback
  source.addEventListener('ended', () => {
    outputSources.delete(source);
  });

  source.start(nextStartTime);
  nextStartTime = nextStartTime + audioBuffer.duration;
  outputSources.add(source);
}
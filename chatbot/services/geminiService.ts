import { GoogleGenAI, Chat, Modality, Blob, LiveSession, LiveServerMessage, FunctionDeclaration, Type } from "@google/genai";
import { ChatMessage, MapSearchResult, WebSearchResult } from '../types';

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

// Ensure the GoogleGenAI instance is created right before an API call
// to use the most up-to-date API key.
function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function initializeChat(
  useProModelForThinking: boolean = false,
  systemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
): Promise<void> {
  const modelToUse = useProModelForThinking ? PRO_MODEL : FLASH_MODEL;

  // Reinitialize chat session only if model changes or it's not set
  // When systemInstruction changes, we want to force a new chat session to apply it.
  if (!chatSession || (chatSession as any).model !== modelToUse || (chatSession as any).config.systemInstruction !== systemInstruction) {
    const ai = getGeminiClient();
    const config: any = {
      systemInstruction: systemInstruction,
    };
    if (useProModelForThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget for 2.5-pro
    }
    chatSession = ai.chats.create({
      model: modelToUse,
      config: config,
    });
  }
}

export async function sendMessageToGemini(
  message: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
  useProModelForThinking: boolean = false,
  imageFile?: { base64: string; mimeType: string },
  currentSystemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
): Promise<void> {
  await initializeChat(useProModelForThinking, currentSystemInstruction); // Ensure chat session is initialized with correct model and system instruction

  if (!chatSession) {
    onError("Chat session could not be initialized.");
    return;
  }

  try {
    let requestOptions: any; // Object to hold either 'message' or 'contents' property

    if (imageFile) {
      requestOptions = {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageFile.mimeType,
                data: imageFile.base64,
              },
            },
            { text: message },
          ],
        },
      };
    } else {
      requestOptions = {
        message: message, // Simple text message
      };
    }

    const responseStream = await chatSession.sendMessageStream(requestOptions);

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onNewChunk(chunk.text);
      }
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    onError(`Failed to get response from Gemini: ${error.message || 'Unknown error'}`);
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

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const webResults = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!web && !!web.uri && !!web.title);

    return { text: text || "No text response found.", webResults };
  } catch (error: any) {
    console.error("Gemini Grounded Search API error:", error);
    throw new Error(`Failed to get grounded response: ${error.message || 'Unknown error'}`);
  }
}

export async function generateMapsGroundedResponse(prompt: string): Promise<{ text: string; mapsResults: MapSearchResult[] }> {
  const ai = getGeminiClient();

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

  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: { latLng: location },
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: config,
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const mapsResults: MapSearchResult[] = groundingChunks
      .map(maps => (maps as any).maps) // Using 'as any' to bypass type checking for direct access
      .filter((maps): maps is { uri: any; title: any; placeAnswerSources?: any; } => !!maps)
      .map(maps => ({
        uri: maps.uri || '',
        title: maps.title || '',
        reviews: maps.placeAnswerSources?.reviewSnippets?.map((review: any) => ({
            text: review.text || '',
            author: review.author || 'N/A',
            rating: review.rating || 0
        })) || []
      }))
      .filter(result => result.uri && result.title);

    return { text: text || "No text response found.", mapsResults };
  } catch (error: any) {
    console.error("Gemini Maps Grounding API error:", error);
    throw new Error(`Failed to get maps grounded response: ${error.message || 'Unknown error'}`);
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
  } catch (error: any) {
    console.error(`Gemini Image ${modelType} API error:`, error);
    onError(`Failed to process image: ${error.message || 'Unknown error'}`);
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
  } catch (error: any) {
    console.error("Gemini Video Analysis API error:", error);
    onError(`Failed to analyze video: ${error.message || 'Unknown error'}`);
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
export async function ensureApiKeySelected(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).aistudio || typeof (window as any).aistudio.hasSelectedApiKey !== 'function') {
    console.warn("window.aistudio or hasSelectedApiKey not available. Cannot check API key selection.");
    // If aistudio methods are not available, we proceed assuming API_KEY from env is sufficient
    // or the environment handles it.
    return true; 
  }

  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    console.log("No API key selected. Opening key selection dialog.");
    await window.aistudio.openSelectKey();
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
  onTurnComplete: (results: { webResults?: WebSearchResult[], mapsResults?: MapSearchResult[] }) => void,
  onSuccess: () => void,
  onError: (error: string, isApiKeyError: boolean) => void, // Modified onError signature
  onSessionEndedUnexpectedly: () => void,
  voiceName: string = DEFAULT_VOICE_NAME,
  systemInstruction: string = PERSONALITY_OPTIONS[DEFAULT_PERSONALITY_KEY],
  onToolCallStart: (toolName: string, query: string) => void,
  onToolCallResult: (toolName: string) => void,
  useWebSearch: boolean,
  useMapsSearch: boolean,
): Promise<void> {
  if (liveAudioSession || sessionPromiseForCleanup) {
    console.warn("Live audio session already active or connecting. Closing existing session to restart with new config.");
    await stopLiveAudioSession(); // Ensure existing session is stopped
  }

  try {
    const ai = getGeminiClient();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
    if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
    
    mediaStreamSource = inputAudioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

    const tools: FunctionDeclaration[] = [];
    if (useWebSearch) tools.push(searchWebFunctionDeclaration);
    if (useMapsSearch) tools.push(searchMapsFunctionDeclaration);

    const liveConfig: any = {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        systemInstruction: systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
    };

    if (tools.length > 0) {
        liveConfig.tools = [{ functionDeclarations: tools }];
    }
    
    let turnToolResults: { webResults?: WebSearchResult[], mapsResults?: MapSearchResult[] } = {};

    const sessionPromise = ai.live.connect({
      model: LIVE_AUDIO_MODEL,
      callbacks: {
        onopen: () => {
          console.debug('Live session opened');
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
              onToolCallStart(fc.name, fc.args.query);
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
                } else {
                  throw new Error(`Unknown function call: ${fc.name}`);
                }
                onToolCallResult(fc.name);
                const functionResponse = { id: fc.id, name: fc.name, response: { result: results.text } };
                sessionPromise.then((session) => session.sendToolResponse({ functionResponses: functionResponse }));
              } catch (error: any) {
                console.error(`Error executing tool ${fc.name}:`, error);
                onToolCallResult(fc.name); // Still need to signal result to hide loading message
                const errorResponse = { id: fc.id, name: fc.name, response: { error: `Failed to execute tool: ${error.message}` } };
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
          console.error('Live session error:', e);
          const errorMessage = e.message || 'Unknown error';
          const isApiKeyIssue = errorMessage.includes("API key was reported as leaked") || errorMessage.includes("Requested entity was not found.");
          onError(`Live audio error: ${errorMessage}`, isApiKeyIssue); // Pass isApiKeyIssue
          stopLiveAudioSession().then(onSessionEndedUnexpectedly);
        },
        onclose: (e: CloseEvent) => {
          console.debug('Live session closed');
          stopLiveAudioSession().then(onSessionEndedUnexpectedly);
        },
      },
      config: liveConfig,
    });

    sessionPromiseForCleanup = sessionPromise;

    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
    };

    mediaStreamSource.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);

    liveAudioSession = await sessionPromise;
    sessionPromiseForCleanup = null;

  } catch (error: any) {
    console.error("Error starting live audio session:", error);
    const errorMessage = error.message || 'Unknown error';
    const isApiKeyIssue = errorMessage.includes("API key was reported as leaked") || errorMessage.includes("Requested entity was not found.");
    onError(`Failed to start audio session: ${errorMessage}`, isApiKeyIssue); // Pass isApiKeyIssue
    await stopLiveAudioSession();
  }
}

export async function stopLiveAudioSession(): Promise<void> {
  if (isCleaningUp) return;
  isCleaningUp = true;
  
  try {
    if (sessionPromiseForCleanup) {
      sessionPromiseForCleanup.then(session => session.close()).catch(e => console.error("Error closing pending session", e));
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
    console.debug('Live audio session stopped and resources released.');
  } finally {
    isCleaningUp = false;
  }
}

// New TTS Function
export async function generateSpeechFromText(text: string, voiceName: string): Promise<string> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data was returned from the API.");
    }
    return base64Audio;
  } catch (error: any) {
    console.error("Gemini TTS API error:", error);
    throw new Error(`Failed to generate speech: ${error.message || 'Unknown error'}`);
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
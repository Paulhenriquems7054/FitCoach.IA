
import type {
  User,
  GeminiMealPlanResponse,
  MealAnalysisResponse,
  Recipe,
  ModerationResult,
  WellnessPlan,
  ProgressAnalysis,
  FoodSubstitution,
} from "../types";
import { Type, GoogleGenAI, Chat } from '@google/genai';
import {
  generateMealPlanOffline,
  analyzeMealPhotoOffline,
  searchRecipesOffline,
  getCachedMealPlan,
  generateWellnessPlanOffline,
  generateWeeklyReportOffline,
  isOnline,
} from "./offlineService";
import { getAvailableExercisesPrompt } from "./exerciseGifService";
import { logger } from "../utils/logger";
import { generateJSONResponse } from "./iaController";

const AI_BACKEND_BASE =
  import.meta.env.VITE_AI_BACKEND_URL || "/api";

// Cache para evitar múltiplas tentativas quando o backend não está disponível
let backendUnavailableUntil: number | null = null;
const BACKEND_UNAVAILABLE_DURATION = 60000; // 1 minuto

function isBackendUnavailable(): boolean {
  if (backendUnavailableUntil === null) return false;
  if (Date.now() < backendUnavailableUntil) return true;
  // Cache expirado, resetar
  backendUnavailableUntil = null;
  return false;
}

function markBackendUnavailable(): void {
  backendUnavailableUntil = Date.now() + BACKEND_UNAVAILABLE_DURATION;
}

// --- MEAL PLAN ---

const mealPlanSchema = {
  type: Type.OBJECT,
  properties: {
    planoAlimentar: {
      type: Type.ARRAY,
      description: 'Lista de refeições para o dia.',
      items: {
        type: Type.OBJECT,
        required: ["refeicao", "horario_sugerido", "alimentos", "calorias", "macros"],
        properties: {
          refeicao: { type: Type.STRING, description: 'Nome da refeição (ex: Café da Manhã, Almoço).' },
          horario_sugerido: { type: Type.STRING, description: 'Horário sugerido para a refeição (ex: 08:00).' },
          alimentos: { type: Type.ARRAY, description: 'Lista de alimentos com porções detalhadas.', items: { type: Type.STRING } },
          calorias: { type: Type.INTEGER, description: 'Total de calorias da refeição.' },
          macros: {
            type: Type.OBJECT,
            required: ["proteinas_g", "carboidratos_g", "gorduras_g"],
            properties: {
              proteinas_g: { type: Type.INTEGER, description: 'Gramas de proteína.' },
              carboidratos_g: { type: Type.INTEGER, description: 'Gramas de carboidratos.' },
              gorduras_g: { type: Type.INTEGER, description: 'Gramas de gordura.' }
            }
          }
        }
      }
    },
    resumo_diario: {
        type: Type.OBJECT,
        description: 'Resumo nutricional total para o dia.',
        required: ["total_calorias", "total_proteinas_g", "total_carboidratos_g", "total_gorduras_g"],
        properties: {
            total_calorias: { type: Type.INTEGER },
            total_proteinas_g: { type: Type.INTEGER },
            total_carboidratos_g: { type: Type.INTEGER },
            total_gorduras_g: { type: Type.INTEGER },
        }
    },
    observacoes: { type: Type.STRING, description: 'Observações, dicas de hidratação e conselhos motivacionais do nutricionista IA.' }
  },
  required: ["planoAlimentar", "resumo_diario", "observacoes"]
};

const buildMealPlanPrompt = (user: User, language: 'pt' | 'en' | 'es'): string => {
  const langPrompts = {
    pt: {
      main: `Analise os seguintes dados do usuário e crie um plano alimentar detalhado e personalizado para um dia. Foque em ingredientes saudáveis e pratos comuns no Brasil, como tapioca, cuscuz, açaí, e frutas locais.`,
      data: "Dados do Usuário",
      objective: "Objetivo Principal",
      instructions: [
        "Crie um plano com 4 a 5 refeições (ex: Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar).",
        "Para cada refeição, liste os alimentos com quantidades e porções claras (ex: \"100g de peito de frango grelhado\", \"1 xícara de arroz integral\").",
        "Adicione observações úteis, como dicas de hidratação, sugestões de preparação e uma mensagem motivacional.",
        "Retorne os dados estritamente no formato JSON, seguindo o schema fornecido."
      ]
    },
    en: {
        main: `Analyze the following user data and create a detailed, personalized one-day meal plan. Focus on healthy, commonly available ingredients.`,
        data: "User Data",
        objective: "Main Goal",
        instructions: [
          "Create a plan with 4 to 5 meals (e.g., Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner).",
          "For each meal, list foods with clear quantities and portions (e.g., \"100g of grilled chicken breast\", \"1 cup of brown rice\").",
          "Add useful notes, such as hydration tips, preparation suggestions, and a motivational message.",
          "Return the data strictly in JSON format, following the provided schema."
        ]
    },
    es: {
        main: `Analiza los siguientes datos del usuario y crea un plan de alimentación detallado y personalizado para un día. Enfócate en ingredientes saludables y comunes.`,
        data: "Datos del Usuario",
        objective: "Objetivo Principal",
        instructions: [
          "Crea un plan con 4 a 5 comidas (ej: Desayuno, Merienda, Almuerzo, Merienda, Cena).",
          "Para cada comida, lista los alimentos con cantidades y porciones claras (ej: \"100g de pechuga de pollo a la plancha\", \"1 taza de arroz integral\").",
          "Añade observaciones útiles, como consejos de hidratación, sugerencias de preparación y un mensaje motivacional.",
          "Devuelve los datos estrictamente en formato JSON, siguiendo el schema proporcionado."
        ]
    }
  }
  const selectedLang = langPrompts[language];
  return `
    ${selectedLang.main}
    
    ${selectedLang.data}:
    - Nome: ${user.nome}
    - Idade: ${user.idade} anos
    - Gênero: ${user.genero}
    - Peso: ${user.peso} kg
    - Altura: ${user.altura} cm
    - ${selectedLang.objective}: ${user.objetivo}

    Instruções:
    ${selectedLang.instructions.join('\n')}
  `;
};

export const generateMealPlan = async (user: User, language: 'pt' | 'en' | 'es' = 'pt'): Promise<GeminiMealPlanResponse | null> => {
    // Verificar acesso à IA antes de gerar plano (B2B2C guard)
    try {
        const { assertAiAccessOrThrow } = await import('./aiAccessService');
        await assertAiAccessOrThrow(user, 'plan');
    } catch (error: any) {
        if (error?.code === 'AI_ACCESS_DENIED') {
            logger.warn('Acesso à IA negado para geração de plano', 'geminiService', error);
            throw new Error('Seu acesso à IA está bloqueado. Assine um plano para continuar usando.');
        }
        logger.warn('Erro ao verificar acesso à IA', 'geminiService', error);
    }

    // SEMPRE priorizar modo offline/local para app 100% offline
    // Tentar IA Local primeiro (Ollama)
    const prompt = buildMealPlanPrompt(user, language);
    const systemPrompt = `Você é um nutricionista especializado. Retorne APENAS JSON válido seguindo o schema fornecido.`;

    // Tentar IA Local primeiro (via IAController)
    const localResponse = await generateJSONResponse<GeminiMealPlanResponse>(
        prompt,
        systemPrompt,
        async () => {
            // Fallback para backend de IA (proxy seguro)
            if (!isOnline()) {
              return null;
            }
            // Verificar se backend está marcado como indisponível
            if (isBackendUnavailable()) {
              return null;
            }
            try {
              const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.id,
                  gymId: user.gymId ?? null,
                  feature: "meal_plan",
                  model: "gemini-1.5-flash",
                  prompt,
                }),
              });

              if (!res.ok) {
                // Se for 503 (Service Unavailable), marcar backend como indisponível
                if (res.status === 503) {
                  markBackendUnavailable();
                }
                const text = await res.text();
                // Só logar se não for 503 (para evitar spam no console)
                if (res.status !== 503) {
                  logger.warn(
                    `Falha no backend de IA em generateMealPlan: ${res.status} ${text}`,
                    "geminiService",
                  );
                }
                return null;
              }

              const data = await res.json();
              const text: string = data.text || "";
              if (!text.trim()) {
                return null;
              }
              return JSON.parse(text) as GeminiMealPlanResponse;
            } catch (error) {
              logger.warn(
                "Erro ao chamar backend de IA em generateMealPlan",
                "geminiService",
                error,
              );
              return null;
            }
        }
    );

    if (localResponse) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lastMealPlan', JSON.stringify(localResponse));
        }
        
        // Trackar uso de IA para métricas B2B2C
        try {
            const { trackAiUsage } = await import('./aiMetricsService');
            await trackAiUsage(user.id as any, 'plan', 1, user.academyId || undefined);
        } catch (error) {
            logger.warn('Erro ao trackar uso de plano', 'geminiService', error);
        }
        
        return localResponse;
    }

    // Se IA Local não disponível, usar fallback offline (sempre funciona)
    logger.info('Usando modo offline: gerando plano alimentar local', 'geminiService');
    const offlinePlan = generateMealPlanOffline(user, language);
    
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('lastMealPlan', JSON.stringify(offlinePlan));
    }
    
    return offlinePlan;
};

// --- CHAT ---
let chat: Chat | null = null;
export const startChat = async (user: User, language: 'pt' | 'en' | 'es' = 'pt'): Promise<void> => {
  const online = isOnline();
  const apiKey = await getApiKey(user.gymId);
  const hasApiKey = !!apiKey;

  if (!online || !hasApiKey) {
    logger.info('Modo offline: chat limitado disponível', 'geminiService');
    // Chat offline será gerenciado pelo componente de chat
    return;
  }

  if (!apiKey) throw new Error("API key for Gemini is not configured. Please set it up in Settings.");
  const langPrompts = {
      pt: `Você é o FitCoach.IA, um agente de treinamento inteligente e amigável. Você está conversando com ${user.nome}, que tem ${user.idade} anos e seu objetivo principal é "${user.objetivo}". Leve essas informações em consideração para fornecer respostas personalizadas, lembrando do histórico desta conversa. Responda a perguntas sobre treinos, exercícios, academia e saúde de forma clara, educativa e motivadora.`,
      en: `You are FitCoach.IA, a friendly and intelligent training agent. You are chatting with ${user.nome}, who is ${user.idade} years old and their main goal is "${user.objetivo}". Keep this information in mind to provide personalized answers, remembering the history of this conversation. Answer questions about workouts, exercises, gym, and health in a clear, educational, and motivating way.`,
      es: `Eres FitCoach.IA, un agente de entrenamiento inteligente y amigable. Estás hablando con ${user.nome}, que tiene ${user.idade} años y su objetivo principal es "${user.objetivo}". Ten en cuenta esta información para dar respuestas personalizadas, recordando el historial de esta conversación. Responde preguntas sobre entrenamientos, ejercicios, gimnasio y salud de forma clara, educativa y motivadora.`
  }
  
  // Obter cliente Gemini com chave da academia
  const ai = await getGeminiClient(user.gymId);
  chat = ai.chats.create({
    model: 'gemini-1.5-flash', // Modelo estável
    config: { 
      systemInstruction: langPrompts[language],
      generationConfig: {
        maxOutputTokens: 1024,
      },
    },
  });
};
export const sendMessageToChat = (message: string) => {
    if (!chat) {
      const online = isOnline();
      if (!online) {
        throw new Error("Chat offline não disponível. Conecte-se à internet para usar o chat.");
      }
      throw new Error("Chat not started. Call startChat first.");
    }
    return chat.sendMessageStream({ message });
};

// --- MEAL ANALYSIS ---

const mealAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        alimentos_identificados: {
            type: Type.ARRAY,
            description: "Lista de alimentos identificados na foto e suas quantidades estimadas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    alimento: { type: Type.STRING, description: "Nome do alimento." },
                    quantidade_estimada: { type: Type.STRING, description: "Ex: '100g', '1 xícara', '2 fatias'." }
                },
                required: ["alimento", "quantidade_estimada"]
            }
        },
        estimativa_nutricional: {
            type: Type.OBJECT,
            properties: {
                total_calorias: { type: Type.INTEGER },
                total_proteinas_g: { type: Type.INTEGER },
                total_carboidratos_g: { type: Type.INTEGER },
                total_gorduras_g: { type: Type.INTEGER }
            },
            required: ["total_calorias", "total_proteinas_g", "total_carboidratos_g", "total_gorduras_g"]
        },
        avaliacao_geral: {
            type: Type.STRING,
            description: "Uma avaliação geral da refeição, apontando pontos positivos e sugestões de melhoria."
        }
    },
    required: ["alimentos_identificados", "estimativa_nutricional", "avaliacao_geral"]
};

export const analyzeMealPhoto = async (base64Image: string, mimeType: string): Promise<MealAnalysisResponse> => {
    // SEMPRE priorizar modo offline para app 100% offline
    // Análise de imagem requer IA com visão, então usamos fallback offline
    logger.info('Usando modo offline: análise básica local de refeição', 'geminiService');
    return await analyzeMealPhotoOffline(base64Image, mimeType);
    
    // Nota: Análise de imagem com IA requer modelo de visão (Gemini Vision ou Ollama com modelo de visão)
    // Para app 100% offline, usamos análise baseada em padrões e cache
    // Se precisar de análise avançada, pode ser adicionada via Ollama com modelo de visão local
};

// --- RECIPE SEARCH ---

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        nome_receita: { type: Type.STRING },
        descricao: { type: Type.STRING },
        tempo_preparo_min: { type: Type.INTEGER },
        ingredientes: { type: Type.ARRAY, items: { type: Type.STRING } },
        instrucoes: { type: Type.ARRAY, items: { type: Type.STRING } },
        informacao_nutricional: {
            type: Type.OBJECT,
            properties: {
                calorias: { type: Type.INTEGER },
                proteinas_g: { type: Type.INTEGER },
                carboidratos_g: { type: Type.INTEGER },
                gorduras_g: { type: Type.INTEGER }
            },
            required: ["calorias", "proteinas_g", "carboidratos_g", "gorduras_g"]
        }
    },
    required: ["nome_receita", "descricao", "tempo_preparo_min", "ingredientes", "instrucoes", "informacao_nutricional"]
};

const recipeSearchSchema = {
    type: Type.OBJECT,
    properties: {
        receitas: {
            type: Type.ARRAY,
            description: "Uma lista de 2 a 3 receitas que correspondem à busca do usuário.",
            items: recipeSchema
        }
    },
    required: ["receitas"]
};


export const searchRecipes = async (query: string, user: User): Promise<Recipe[]> => {
    // SEMPRE priorizar modo offline para app 100% offline
    logger.info('Usando modo offline: buscando receitas em cache', 'geminiService');
    return await searchRecipesOffline(query, user);
    
    // Nota: Para receitas personalizadas com IA, pode usar Ollama local se disponível
    // Por enquanto, usamos receitas pré-definidas em cache
};

// --- FOOD SEARCH AI ---

const foodSearchSchema = {
    type: Type.OBJECT,
    properties: {
        alimentos: {
            type: Type.ARRAY,
            description: "Lista de 3 a 5 alimentos que correspondem à busca do usuário.",
            items: {
                type: Type.OBJECT,
                properties: {
                    nome: { type: Type.STRING, description: "Nome do alimento." },
                    porcao: { type: Type.STRING, description: "Porção padrão (ex: '100g', '1 unidade')." },
                    calorias: { type: Type.INTEGER, description: "Calorias por porção." },
                    proteinas_g: { type: Type.INTEGER, description: "Gramas de proteína por porção." },
                    carboidratos_g: { type: Type.INTEGER, description: "Gramas de carboidratos por porção." },
                    gorduras_g: { type: Type.INTEGER, description: "Gramas de gordura por porção." },
                    descricao: { type: Type.STRING, description: "Breve descrição do alimento." }
                },
                required: ["nome", "porcao", "calorias", "proteinas_g", "carboidratos_g", "gorduras_g"]
            }
        }
    },
    required: ["alimentos"]
};

/**
 * Busca alimentos usando IA (Gemini 2.5 Flash)
 * Retorna 3-5 opções com dados nutricionais
 */
export const searchFoodAI = async (query: string, user?: User): Promise<Array<{
    nome: string;
    porcao: string;
    calorias: number;
    proteinas_g: number;
    carboidratos_g: number;
    gorduras_g: number;
    descricao?: string;
}>> => {
    const prompt = `Busque alimentos que correspondam à seguinte descrição: "${query}".
    
    Retorne uma lista de 3 a 5 alimentos com suas informações nutricionais por porção padrão.
    Foque em alimentos comuns e saudáveis, preferencialmente brasileiros quando aplicável.
    
    Retorne APENAS JSON válido seguindo o schema fornecido.`;

    const systemPrompt = `Você é um nutricionista especializado. Retorne APENAS JSON válido seguindo o schema fornecido.`;

    try {
        const response = await generateJSONResponse<{ alimentos: Array<{
            nome: string;
            porcao: string;
            calorias: number;
            proteinas_g: number;
            carboidratos_g: number;
            gorduras_g: number;
            descricao?: string;
        }> }>(
            prompt,
            systemPrompt,
            async () => {
                if (!isOnline()) {
                    return null;
                }
                if (isBackendUnavailable()) {
                    return null;
                }
                try {
                    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId: user?.id || 'anonymous',
                            gymId: user?.gymId ?? null,
                            feature: "food_search",
                            model: "gemini-1.5-flash",
                            prompt,
                        }),
                    });

                    if (!res.ok) {
                        if (res.status === 503) {
                            markBackendUnavailable();
                        }
                        return null;
                    }

                    const data = await res.json();
                    const text: string = data.text || "";
                    if (!text.trim()) {
                        return null;
                    }
                    return JSON.parse(text);
                } catch (error) {
                    logger.warn("Erro ao chamar backend de IA em searchFoodAI", "geminiService", error);
                    return null;
                }
            }
        );

        if (response && response.alimentos) {
            return response.alimentos;
        }

        // Fallback: retornar lista básica
        return [
            {
                nome: query,
                porcao: "100g",
                calorias: 100,
                proteinas_g: 5,
                carboidratos_g: 15,
                gorduras_g: 2,
                descricao: "Alimento genérico"
            }
        ];
    } catch (error) {
        logger.error("Erro em searchFoodAI", "geminiService", error);
        return [];
    }
};

/**
 * Gera receitas usando IA baseado em ingredientes fornecidos
 */
export const generateRecipeAI = async (ingredients: string[], user?: User): Promise<Recipe | null> => {
    const ingredientsList = ingredients.join(", ");
    const prompt = `Crie uma receita saudável e saborosa usando os seguintes ingredientes: ${ingredientsList}.
    
    A receita deve ser:
    - Nutritiva e balanceada
    - Fácil de preparar
    - Com tempo de preparo realista
    - Com informações nutricionais completas
    
    Retorne APENAS JSON válido seguindo o schema fornecido.`;

    const systemPrompt = `Você é um chef nutricionista especializado. Retorne APENAS JSON válido seguindo o schema fornecido.`;

    try {
        const response = await generateJSONResponse<Recipe>(
            prompt,
            systemPrompt,
            async () => {
                if (!isOnline()) {
                    return null;
                }
                if (isBackendUnavailable()) {
                    return null;
                }
                try {
                    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId: user?.id || 'anonymous',
                            gymId: user?.gymId ?? null,
                            feature: "recipe_generation",
                            model: "gemini-1.5-flash",
                            prompt,
                        }),
                    });

                    if (!res.ok) {
                        if (res.status === 503) {
                            markBackendUnavailable();
                        }
                        return null;
                    }

                    const data = await res.json();
                    const text: string = data.text || "";
                    if (!text.trim()) {
                        return null;
                    }
                    return JSON.parse(text) as Recipe;
                } catch (error) {
                    logger.warn("Erro ao chamar backend de IA em generateRecipeAI", "geminiService", error);
                    return null;
                }
            }
        );

        return response;
    } catch (error) {
        logger.error("Erro em generateRecipeAI", "geminiService", error);
        return null;
    }
};

/**
 * Alias para analyzeMealPhoto - análise de foto de comida
 * Usa Gemini 2.5 Flash com visão
 */
export const analyzeFoodImage = async (base64Image: string, mimeType: string): Promise<MealAnalysisResponse> => {
    return analyzeMealPhoto(base64Image, mimeType);
};

/**
 * Alias para sendMessageToChat - chat conversacional com nutricionista
 * Usa Gemini 2.5 Flash
 */
export const chatWithNutritionist = async (
    message: string,
    onNewChunk: (chunk: string) => void,
    onError: (error: string) => void,
    user?: User
): Promise<void> => {
    // Inicializar chat se necessário
    if (user) {
        await startChat(user);
    }
    
    try {
        const result = sendMessageToChat(message);
        // Simular streaming (sendMessageToChat retorna um stream)
        // Por enquanto, usar fallback para backend
        const { sendMessageToGemini } = await import('../chatbot/services/geminiService');
        await sendMessageToGemini(
            message,
            onNewChunk,
            onError,
            false,
            undefined,
            "Você é um nutricionista especializado. Responda de forma clara, empática e profissional, sempre em português."
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        onError(errorMessage);
    }
};

// --- CONTENT MODERATION ---

const moderationSchema = {
    type: Type.OBJECT,
    properties: {
        is_safe: { type: Type.BOOLEAN, description: "True se o conteúdo for seguro e apropriado, False caso contrário." },
        reason: { type: Type.STRING, description: "Se não for seguro, explique brevemente o motivo (ex: 'Discurso de ódio', 'Spam', 'Conteúdo perigoso'). Se for seguro, retorne 'Conteúdo apropriado.'." }
    },
    required: ["is_safe", "reason"]
};

export const moderateContent = async (content: string, gymId?: string | null): Promise<ModerationResult> => {
    const apiKey = await getApiKey(gymId);
    if (!apiKey) throw new Error("API key for Gemini is not configured. Please set it up in Settings.");

    const prompt = `
        Você é um moderador de conteúdo para uma comunidade online de saúde e bem-estar.
        Analise o seguinte texto para determinar se ele é seguro e apropriado para a comunidade.
        Verifique por discurso de ódio, spam, desinformação perigosa, assédio ou qualquer conteúdo inadequado.
        Não seja excessivamente rigoroso com linguagem coloquial, mas seja rígido com violações claras.

        Texto para análise:
        ---
        ${content}
        ---

        Responda estritamente no formato JSON, seguindo o schema fornecido.
    `;

    try {
        const ai = await getGeminiClient(gymId);
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: moderationSchema,
                temperature: 0.1,
            } as any,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().trim();
        return JSON.parse(jsonText) as ModerationResult;
    } catch (error: unknown) {
        logger.error("Erro ao chamar API do Gemini para moderação de conteúdo", 'geminiService', error);
        return { is_safe: false, reason: "Falha ao conectar com o serviço de moderação." };
    }
};

// --- WEEKLY REPORT ---

export const generateWeeklyReport = async (user: User, language: 'pt' | 'en' | 'es' = 'pt'): Promise<string> => {
    // SEMPRE priorizar modo offline para app 100% offline
    logger.info('Usando modo offline: gerando relatório semanal local', 'geminiService');
    return generateWeeklyReportOffline(user, language);
    
    // Nota: Para relatórios mais personalizados, pode usar Ollama local se disponível
    // Por enquanto, usamos geração baseada em templates e dados do usuário
};


// --- WELLNESS PLAN ---

// Schema expandido para plano de bem-estar com mais detalhes
const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: 'Nome do exercício' },
        reps: { type: Type.STRING, description: 'Número de repetições (ex: "3x12", "4x10-15")' },
        sets: { type: Type.STRING, description: 'Número de séries' },
        tips: { type: Type.STRING, description: 'Dica de execução ou técnica' },
        calories: { type: Type.INTEGER, description: 'Calorias estimadas queimadas' },
        rest: { type: Type.STRING, description: 'Tempo de descanso entre séries (ex: "60s", "90s")' }
    },
    required: ["name"]
};

const wellnessPlanSchema = {
    type: Type.OBJECT,
    properties: {
        plano_treino_semanal: {
            type: Type.ARRAY,
            description: 'Plano de treino para cada dia da semana (5-7 dias)',
            items: {
                type: Type.OBJECT,
                properties: {
                    dia_semana: { type: Type.STRING, description: 'Dia da semana (ex: "Segunda-feira")' },
                    foco_treino: { type: Type.STRING, description: 'Foco do treino (ex: "Corpo Inteiro", "Pernas", "Descanso")' },
                    exercicios: {
                        type: Type.ARRAY,
                        description: 'Lista de exercícios. Pode ser array de strings ou objetos com detalhes',
                        items: {
                            oneOf: [
                                { type: Type.STRING },
                                exerciseSchema
                            ]
                        }
                    },
                    duracao_estimada: { type: Type.STRING, description: 'Duração estimada do treino (ex: "45-60 minutos")' },
                    intensidade: { 
                        type: Type.STRING, 
                        enum: ['baixa', 'moderada', 'alta'],
                        description: 'Intensidade do treino'
                    },
                    observacoes: { type: Type.STRING, description: 'Observações adicionais sobre o treino' }
                },
                required: ["dia_semana", "foco_treino", "exercicios"]
            }
        },
        recomendacoes_suplementos: {
            type: Type.ARRAY,
            description: 'Recomendações de suplementos personalizadas',
            items: {
                type: Type.OBJECT,
                properties: {
                    nome: { type: Type.STRING, description: 'Nome do suplemento' },
                    dosagem_sugerida: { type: Type.STRING, description: 'Dosagem recomendada (ex: "25g", "5g")' },
                    melhor_horario: { type: Type.STRING, description: 'Melhor horário para tomar (ex: "Pós-treino", "Manhã")' },
                    justificativa: { type: Type.STRING, description: 'Por que este suplemento é recomendado' },
                    beneficios: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Lista de benefícios principais'
                    },
                    contraindicacoes: { type: Type.STRING, description: 'Contraindicações ou precauções' }
                },
                required: ["nome", "dosagem_sugerida", "melhor_horario", "justificativa"]
            }
        },
        dicas_adicionais: { 
            type: Type.STRING, 
            description: 'Dicas gerais sobre recuperação, sono ou bem-estar' 
        },
        dicas_inteligentes: {
            type: Type.OBJECT,
            description: 'Dicas personalizadas geradas pela IA',
            properties: {
                hidratacao: { type: Type.STRING, description: 'Dica sobre hidratação baseada no perfil' },
                horario_treino: { type: Type.STRING, description: 'Melhor horário para treinar baseado na rotina' },
                descanso: { type: Type.STRING, description: 'Dica sobre descanso e recuperação' },
                sono: { type: Type.STRING, description: 'Dica sobre qualidade do sono' },
                nutricao: { type: Type.STRING, description: 'Dica nutricional relacionada ao treino' }
            }
        }
    },
    required: ["plano_treino_semanal", "recomendacoes_suplementos", "dicas_adicionais"]
};

/**
 * Gera um plano de bem-estar personalizado usando IA
 * Considera dados do usuário: objetivo, peso, altura, histórico, etc.
 * 
 * @param user - Dados do usuário para personalização
 * @returns Plano de bem-estar completo com treinos, suplementos e dicas
 */
export const generateWellnessPlan = async (user: User): Promise<WellnessPlan> => {
    // SEMPRE priorizar modo offline para app 100% offline
    logger.info('Usando modo offline: gerando plano de bem-estar local', 'geminiService');
    return generateWellnessPlanOffline(user);
    
    // Nota: Para planos mais personalizados, pode usar Ollama local se disponível
    // Por enquanto, usamos geração baseada em templates e dados do usuário
};

// --- AI COACH TIP ---

export const getAICoachTip = async (user: User): Promise<string> => {
  const timeOfDay =
    new Date().getHours() < 12
      ? "manhã"
      : new Date().getHours() < 18
      ? "tarde"
      : "noite";

  // Verificar se está online antes de tentar usar a API
  if (!isOnline()) {
    return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
  }

  const prompt = `
        Aja como um coach de bem-estar. Crie uma dica rápida, motivacional e acionável para ${user.nome}.
        A dica deve ser relevante para o objetivo de "${user.objetivo}" e para o período do dia atual (${timeOfDay}).
        Seja breve (1-2 frases) e inspirador.
        Exemplo para "perder peso" de manhã: "Comece o dia com um copo d'água para ativar seu metabolismo e hidratar o corpo!"
    `;

  // Verificar se backend está marcado como indisponível
  if (isBackendUnavailable()) {
    return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
  }

  try {
    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        gymId: user.gymId ?? null,
        feature: "coach_tip",
        model: "gemini-1.5-flash",
        prompt,
      }),
    });

    if (!res.ok) {
      // Se for 503 (Service Unavailable), marcar backend como indisponível
      if (res.status === 503) {
        markBackendUnavailable();
      }
      const text = await res.text();
      // Só logar se não for 503 (para evitar spam no console)
      if (res.status !== 503) {
        logger.warn(
          `Falha no backend de IA em getAICoachTip: ${res.status} ${text}`,
          "geminiService",
        );
      }
      return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
    }

    const data = await res.json();
    const tip: string = data.text || "";
    if (!tip.trim()) {
      return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
    }
    return tip.trim();
  } catch (error) {
    logger.warn(
      "Erro ao obter dica do coach (usando fallback)",
      "geminiService",
      error,
    );
    return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
  }
};

// --- PROGRESS ANALYSIS ---
const progressAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        tendencia_geral: { type: Type.STRING, enum: ['positiva', 'negativa', 'estagnada'] },
        analise_texto: { type: Type.STRING },
        projecao_proxima_semana: { type: Type.STRING },
        pontos_fortes: { type: Type.ARRAY, items: { type: Type.STRING } },
        areas_melhoria: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["tendencia_geral", "analise_texto", "projecao_proxima_semana", "pontos_fortes", "areas_melhoria"]
};

export const analyzeProgress = async (user: User): Promise<ProgressAnalysis> => {
    const prompt = `
        Analise o histórico de peso do usuário para o objetivo de "${user.objetivo}".
        Histórico (data, peso em kg): ${JSON.stringify(user.weightHistory)}.
        Forneça uma análise de progresso:
        1. Determine a tendência geral: 'positiva' (progredindo em direção ao objetivo), 'negativa' (afastando-se do objetivo) ou 'estagnada'.
        2. Escreva uma análise em texto, explicando a tendência de forma motivacional.
        3. Crie uma projeção realista para a próxima semana.
        4. Liste 2 pontos fortes com base nos dados.
        5. Sugira 2 áreas de melhoria.
        Retorne estritamente no formato JSON.
    `;

    if (!isOnline()) {
      throw new Error("Conecte-se à internet para obter a análise de progresso.");
    }

    // Verificar se backend está marcado como indisponível
    if (isBackendUnavailable()) {
      throw new Error("Backend de IA temporariamente indisponível. Tente novamente em alguns instantes.");
    }

    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        gymId: user.gymId ?? null,
        feature: "progress_analysis",
        model: "gemini-1.5-flash",
        prompt,
      }),
    });

    if (!res.ok) {
      // Se for 503 (Service Unavailable), marcar backend como indisponível
      if (res.status === 503) {
        markBackendUnavailable();
      }
      const text = await res.text();
      // Só logar se não for 503 (para evitar spam no console)
      if (res.status !== 503) {
        logger.warn(
          `Falha no backend de IA em analyzeProgress: ${res.status} ${text}`,
          "geminiService",
        );
      }
      throw new Error("Não foi possível gerar a análise de progresso.");
    }

    const data = await res.json();
    const text: string = data.text || "";
    if (!text.trim()) {
      throw new Error("Resposta vazia do serviço de IA para análise de progresso.");
    }

    return JSON.parse(text) as ProgressAnalysis;
};

// --- EXPLAIN MEAL ---
export const explainMeal = async (mealName: string, user: User): Promise<string> => {
    const prompt = `
        Explique de forma científica e simples por que a refeição "${mealName}" é uma boa escolha para o usuário, considerando seu objetivo de "${user.objetivo}".
        Fale sobre os macronutrientes principais da refeição e como eles ajudam a atingir o objetivo.
        Seja breve (2-3 frases) e educativo.
    `;

    if (!isOnline()) {
      throw new Error("Conecte-se à internet para obter a explicação da refeição.");
    }

    // Verificar se backend está marcado como indisponível
    if (isBackendUnavailable()) {
      throw new Error("Backend de IA temporariamente indisponível. Tente novamente em alguns instantes.");
    }

    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        gymId: user.gymId ?? null,
        feature: "food_substitution",
        model: "gemini-1.5-flash",
        prompt,
      }),
    });

    if (!res.ok) {
      // Se for 503 (Service Unavailable), marcar backend como indisponível
      if (res.status === 503) {
        markBackendUnavailable();
      }
      const text = await res.text();
      // Só logar se não for 503 (para evitar spam no console)
      if (res.status !== 503) {
        logger.warn(
          `Falha no backend de IA em explainMeal: ${res.status} ${text}`,
          "geminiService",
        );
      }
      throw new Error("Não foi possível obter a explicação da refeição.");
    }

    const data = await res.json();
    const explanation: string = data.text || "";
    return explanation.trim();
};

// --- FOOD SUBSTITUTION ---
const foodSubstitutionsSchema = {
    type: Type.OBJECT,
    properties: {
        substituicoes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    alimento_sugerido: { type: Type.STRING },
                    justificativa: { type: Type.STRING }
                },
                required: ["alimento_sugerido", "justificativa"]
            }
        }
    },
    required: ["substituicoes"]
};

export const getFoodSubstitutions = async (food: string, user: User): Promise<FoodSubstitution[]> => {
    const prompt = `
        Para o alimento "${food}", sugira 3 substituições mais saudáveis e alinhadas com o objetivo do usuário de "${user.objetivo}".
        Para cada sugestão, forneça uma justificativa clara e concisa.
        Retorne estritamente no formato JSON.
    `;

    if (!isOnline()) {
      throw new Error("Conecte-se à internet para obter as substituições de alimentos.");
    }

    // Verificar se backend está marcado como indisponível
    if (isBackendUnavailable()) {
      throw new Error("Backend de IA temporariamente indisponível. Tente novamente em alguns instantes.");
    }

    const res = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        gymId: user.gymId ?? null,
        feature: "food_substitution",
        model: "gemini-1.5-flash",
        prompt,
      }),
    });

    if (!res.ok) {
      // Se for 503 (Service Unavailable), marcar backend como indisponível
      if (res.status === 503) {
        markBackendUnavailable();
      }
      const text = await res.text();
      // Só logar se não for 503 (para evitar spam no console)
      if (res.status !== 503) {
        logger.warn(
          `Falha no backend de IA em getFoodSubstitutions: ${res.status} ${text}`,
          "geminiService",
        );
      }
      throw new Error("Não foi possível obter substituições de alimentos.");
    }

    const data = await res.json();
    const jsonText: string = data.text || "";
    if (!jsonText.trim()) {
      throw new Error("Resposta vazia do serviço de IA para substituições de alimentos.");
    }

    return (JSON.parse(jsonText) as { substituicoes: FoodSubstitution[] })
      .substituicoes;
};

// --- UTILITY FUNCTIONS ---

/**
 * Obtém a API key do Gemini (do backend ou variável de ambiente)
 */
async function getApiKey(gymId?: string | null): Promise<string | null> {
  // Em desenvolvimento, usar variável de ambiente se disponível
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Se tiver gymId, tentar obter do backend (futuro)
  // Por enquanto, retornar null se não houver chave
  return null;
}

/**
 * Obtém cliente Gemini com API key
 */
async function getGeminiClient(gymId?: string | null): Promise<GoogleGenAI> {
  const apiKey = await getApiKey(gymId);
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured. Please set it up in Settings or define VITE_GEMINI_API_KEY.");
  }
  
  return new GoogleGenAI({ apiKey });
}

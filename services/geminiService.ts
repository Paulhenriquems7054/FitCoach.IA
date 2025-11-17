
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { User, GeminiMealPlanResponse, MealAnalysisResponse, Recipe, ModerationResult, WellnessPlan, ProgressAnalysis, FoodSubstitution } from "../types";
import { 
  generateMealPlanOffline, 
  analyzeMealPhotoOffline, 
  searchRecipesOffline, 
  getCachedMealPlan,
  generateWellnessPlanOffline,
  isOnline 
} from "./offlineService";
import { resolveActiveApiKey } from "../constants/apiConfig";
import { getAvailableExercisesPrompt } from "./exerciseGifService";

// Função para obter a chave de API ativa (do localStorage ou env)
const getApiKey = (): string | undefined => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  return resolveActiveApiKey(envKey);
};

// Função para obter o cliente Gemini com a chave atual
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured. Please set it up in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

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
    // Verificar se está online e se tem API key
    const online = isOnline();
    const apiKey = getApiKey();
    const hasApiKey = !!apiKey;

    // Se offline ou sem API key, usar fallback offline
    if (!online || !hasApiKey) {
        console.log('Modo offline: usando fallback local para gerar plano alimentar');
        const offlinePlan = generateMealPlanOffline(user, language);
        
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lastMealPlan', JSON.stringify(offlinePlan));
        }
        
        return offlinePlan;
    }

    // Tentar usar API online
    const prompt = buildMealPlanPrompt(user, language);

    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: mealPlanSchema,
              temperature: 0.7,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lastMealPlan', JSON.stringify(parsedJson));
        }

        return parsedJson as GeminiMealPlanResponse;
    } catch (error: any) {
        // Silenciar erros de API key inválida
        const isApiKeyError = error?.error?.code === 400 && error?.error?.message?.includes('API key');
        if (!isApiKeyError) {
            console.error("Error calling Gemini API:", error);
        }
        // Fallback para offline em caso de erro
        const offlinePlan = generateMealPlanOffline(user, language);
        
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('lastMealPlan', JSON.stringify(offlinePlan));
        }
        
        return offlinePlan;
    }
};

// --- CHAT ---
let chat: Chat | null = null;
export const startChat = (user: User, language: 'pt' | 'en' | 'es' = 'pt'): void => {
  const online = isOnline();
  const apiKey = getApiKey();
  const hasApiKey = !!apiKey;

  if (!online || !hasApiKey) {
    console.log('Modo offline: chat limitado disponível');
    // Chat offline será gerenciado pelo componente de chat
    return;
  }

  if (!apiKey) throw new Error("API key for Gemini is not configured. Please set it up in Settings.");
  const langPrompts = {
      pt: `Você é o Nutri.IA, um agente nutricional inteligente e amigável. Você está conversando com ${user.nome}, que tem ${user.idade} anos e seu objetivo principal é "${user.objetivo}". Leve essas informações em consideração para fornecer respostas personalizadas, lembrando do histórico desta conversa. Responda a perguntas sobre nutrição, dietas e saúde de forma clara, educativa e motivadora.`,
      en: `You are Nutri.IA, a friendly and intelligent nutritional agent. You are chatting with ${user.nome}, who is ${user.idade} years old and their main goal is "${user.objetivo}". Keep this information in mind to provide personalized answers, remembering the history of this conversation. Answer questions about nutrition, diets, and health in a clear, educational, and motivating way.`,
      es: `Eres Nutri.IA, un agente nutricional inteligente y amigable. Estás hablando con ${user.nome}, que tiene ${user.idade} años y su objetivo principal es "${user.objetivo}". Ten en cuenta esta información para dar respuestas personalizadas, recordando el historial de esta conversación. Responde preguntas sobre nutrición, dietas y salud de forma clara, educativa y motivadora.`
  }
  const ai = getGeminiClient();
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: langPrompts[language] },
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
    // Verificar se está online e se tem API key
    const online = isOnline();
    const apiKey = getApiKey();
    const hasApiKey = !!apiKey;

    // Se offline ou sem API key, usar fallback offline
    if (!online || !hasApiKey) {
        console.log('Modo offline: usando análise básica local');
        return await analyzeMealPhotoOffline(base64Image, mimeType);
    }

    // Tentar usar API online
    const prompt = "Analise a imagem desta refeição. Identifique cada alimento e estime a quantidade. Forneça uma estimativa nutricional completa (calorias, proteínas, carboidratos, gorduras). Dê uma avaliação geral sobre quão saudável é a refeição, sugerindo melhorias se necessário. Retorne os dados estritamente no formato JSON, seguindo o schema fornecido.";

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };

    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: mealAnalysisSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MealAnalysisResponse;
    } catch (error: any) {
        // Silenciar erros de API key inválida
        const isApiKeyError = error?.error?.code === 400 && error?.error?.message?.includes('API key');
        if (!isApiKeyError) {
            console.error("Error calling Gemini API for meal analysis:", error);
        }
        // Fallback para offline em caso de erro
        return await analyzeMealPhotoOffline(base64Image, mimeType);
    }
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
    // Verificar se está online e se tem API key
    const online = isOnline();
    const apiKey = getApiKey();
    const hasApiKey = !!apiKey;

    // Se offline ou sem API key, usar fallback offline
    if (!online || !hasApiKey) {
        console.log('Modo offline: usando receitas em cache');
        return await searchRecipesOffline(query, user);
    }

    // Tentar usar API online
    const prompt = `
        Você é um chef e nutricionista. Um usuário está buscando por receitas.
        Busca do usuário: "${query}"

        Considere o perfil do usuário para adaptar as receitas:
        - Objetivo: ${user.objetivo}
        - Idade: ${user.idade}
        - Gênero: ${user.genero}

        Crie 2 receitas que atendam à busca e sejam adequadas ao perfil do usuário.
        Para cada receita, forneça: nome, uma breve descrição, tempo de preparo em minutos, lista de ingredientes com quantidades, instruções passo a passo, e uma estimativa da informação nutricional (calorias, proteínas, carboidratos, gorduras).
        Use ingredientes comuns no Brasil.
        Retorne os dados estritamente no formato JSON, seguindo o schema fornecido.
    `;

    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSearchSchema,
                temperature: 0.8,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson.receitas as Recipe[];
    } catch (error: any) {
        // Silenciar erros de API key inválida
        const isApiKeyError = error?.error?.code === 400 && error?.error?.message?.includes('API key');
        if (!isApiKeyError) {
            console.error("Error calling Gemini API for recipe search:", error);
        }
        // Fallback para offline em caso de erro
        return await searchRecipesOffline(query, user);
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

export const moderateContent = async (content: string): Promise<ModerationResult> => {
    const apiKey = getApiKey();
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
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: moderationSchema,
                temperature: 0.1,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ModerationResult;
    } catch (error) {
        console.error("Error calling Gemini API for content moderation:", error);
        return { is_safe: false, reason: "Falha ao conectar com o serviço de moderação." };
    }
};

// --- WEEKLY REPORT ---

export const generateWeeklyReport = async (user: User, language: 'pt' | 'en' | 'es' = 'pt'): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key for Gemini is not configured. Please set it up in Settings.");
    const langPrompts = {
      pt: {
        title: "Relatório de Progresso Semanal",
        analysis: "Análise de Progresso",
        strengths: "Pontos Fortes",
        improvements: "Pontos a Melhorar",
        tip: "Dica da Semana",
        motivation: "Mensagem Motivacional"
      },
      en: {
        title: "Weekly Progress Report",
        analysis: "Progress Analysis",
        strengths: "Strengths",
        improvements: "Areas for Improvement",
        tip: "Tip of the Week",
        motivation: "Motivational Message"
      },
      es: {
        title: "Informe de Progreso Semanal",
        analysis: "Análisis de Progreso",
        strengths: "Puntos Fuertes",
        improvements: "Áreas de Mejora",
        tip: "Consejo de la Semana",
        motivation: "Mensaje de Motivación"
      }
    };
    const t = langPrompts[language];

    const prompt = `
      Você é o Nutri.IA, um especialista em nutrição e bem-estar.
      Com base nos dados do usuário abaixo, gere um relatório de progresso semanal simulado e forneça recomendações personalizadas no idioma ${language}.

      Dados do Usuário:
      - Nome: ${user.nome}
      - Objetivo: ${user.objetivo}

      O relatório deve ter o seguinte formato de texto, usando markdown simples para títulos (ex: **Título**):
      1.  **${t.analysis}:** Uma análise motivacional sobre como a semana pode ter sido em direção ao objetivo de ${user.objetivo}.
      2.  **${t.strengths}:** Destaque 2 ou 3 hábitos positivos que o usuário deve manter.
      3.  **${t.improvements}:** Sugira 2 ou 3 áreas para focar na próxima semana.
      4.  **${t.tip}:** Uma dica prática e acionável sobre nutrição, hidratação ou exercício.
      5.  **${t.motivation}:** Uma frase curta para inspirar o usuário a continuar.

      Seja positivo, encorajador e profissional. Use uma linguagem clara e acessível.
    `;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
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
    // Verificar se está online e se tem API key
    const online = isOnline();
    const apiKey = getApiKey();
    const hasApiKey = !!apiKey;

    // Se offline ou sem API key, usar fallback offline
    if (!online || !hasApiKey) {
        console.log('Modo offline: usando plano de bem-estar offline');
        return generateWellnessPlanOffline(user);
    }

    // Calcular IMC para ajustar intensidade
    const alturaMetros = user.altura / 100;
    const imc = user.peso / (alturaMetros * alturaMetros);
    const imcStatus = imc < 18.5 ? 'abaixo do peso' : imc < 25 ? 'peso normal' : imc < 30 ? 'sobrepeso' : 'obesidade';

    // Determinar nível de condicionamento baseado em histórico e disciplina
    const nivelCondicionamento = user.disciplineScore >= 80 ? 'avançado' : 
                                 user.disciplineScore >= 60 ? 'intermediário' : 'iniciante';

    // Analisar tendência de peso
    const weightHistory = user.weightHistory || [];
    const tendenciaPeso = weightHistory.length >= 2 
        ? (weightHistory[weightHistory.length - 1].weight > weightHistory[0].weight ? 'aumentando' : 'diminuindo')
        : 'estável';

    const prompt = `
        Você é um personal trainer e nutricionista especializado em criar planos de bem-estar personalizados.
        
        DADOS DO USUÁRIO:
        - Nome: ${user.nome}
        - Idade: ${user.idade} anos
        - Gênero: ${user.genero}
        - Peso: ${user.peso} kg
        - Altura: ${user.altura} cm
        - IMC: ${imc.toFixed(1)} (${imcStatus})
        - Objetivo principal: ${user.objetivo}
        - Nível de condicionamento estimado: ${nivelCondicionamento} (baseado em disciplina: ${user.disciplineScore}/100)
        - Tendência de peso: ${tendenciaPeso}
        ${weightHistory.length > 0 ? `- Histórico recente: ${JSON.stringify(weightHistory.slice(-3))}` : ''}

        CRIE UM PLANO DE BEM-ESTAR HOLÍSTICO PERSONALIZADO:

        1. PLANO DE TREINO SEMANAL (5-7 dias):
           - Adapte a intensidade baseado no IMC (${imcStatus}) e nível (${nivelCondicionamento})
           - Para cada dia, forneça:
             * Dia da semana
             * Foco do treino (ex: "Corpo Inteiro", "Pernas", "Cardio", "Descanso Ativo")
             * Lista de exercícios com detalhes (nome, séries, repetições, descanso, dicas)
             * Duração estimada
             * Intensidade (baixa/moderada/alta)
             * Observações específicas
           - Inclua 1-2 dias de descanso
           - Ajuste cargas e reps conforme o objetivo "${user.objetivo}"
           - Se ${user.objetivo.includes('perder') ? 'perder peso' : user.objetivo.includes('ganhar') ? 'ganhar massa' : 'manter peso'}, adapte o treino adequadamente

        2. RECOMENDAÇÕES DE SUPLEMENTOS (2-4 suplementos):
           - Escolha suplementos relevantes para o objetivo "${user.objetivo}"
           - Para cada suplemento:
             * Nome
             * Dosagem sugerida (específica)
             * Melhor horário para tomar (baseado na rotina)
             * Justificativa clara e personalizada
             * Lista de 2-3 benefícios principais
             * Contraindicações se houver (especialmente para idade ${user.idade})
           - Exemplos: Whey Protein, Creatina, Vitamina D, Ômega-3, Multivitamínico, etc.

        3. DICAS ADICIONAIS:
           - 2-3 dicas sobre recuperação, sono ou bem-estar geral
           - Seja específico e acionável

        4. DICAS INTELIGENTES PERSONALIZADAS:
           - Hidratação: Sugestão baseada no peso (${user.peso}kg) e objetivo
           - Horário de treino: Recomendação baseada na idade (${user.idade} anos) e objetivo
           - Descanso: Ajustes caso falhe treinos ou precise recuperar
           - Sono: Recomendações para otimizar recuperação
           - Nutrição: Dica nutricional relacionada ao treino e objetivo

        IMPORTANTE:
        - Seja específico e detalhado nos exercícios (séries, reps, descanso)
        - Adapte tudo ao perfil do usuário
        - Use linguagem motivacional mas profissional
        - Retorne estritamente no formato JSON seguindo o schema fornecido
        
        ${getAvailableExercisesPrompt()}
    `;

    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: wellnessPlanSchema,
                temperature: 0.8 // Mais criatividade para variações
            }
        });
        
        const plan = JSON.parse(response.text) as WellnessPlan;
        
        // Adicionar metadados
        plan.data_geracao = new Date().toISOString();
        plan.versao = 2; // Versão expandida
        
        return plan;
    } catch (error: any) {
        // Silenciar erros de API key inválida
        const isApiKeyError = error?.error?.code === 400 && error?.error?.message?.includes('API key');
        if (!isApiKeyError) {
            console.error("Error generating wellness plan:", error);
        }
        // Fallback para offline em caso de erro
        return generateWellnessPlanOffline(user);
    }
};

// --- AI COACH TIP ---

export const getAICoachTip = async (user: User): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        // Retornar dica genérica quando não há API key
        const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';
        return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
    }

    // Verificar se está online antes de tentar usar a API
    if (!isOnline()) {
        const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';
        return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
    }

    const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';

    const prompt = `
        Aja como um coach de bem-estar. Crie uma dica rápida, motivacional e acionável para ${user.nome}.
        A dica deve ser relevante para o objetivo de "${user.objetivo}" e para o período do dia atual (${timeOfDay}).
        Seja breve (1-2 frases) e inspirador.
        Exemplo para "perder peso" de manhã: "Comece o dia com um copo d'água para ativar seu metabolismo e hidratar o corpo!"
    `;
    
    try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim();
    } catch (error: any) {
        // Silenciar erros de API key inválida e retornar dica genérica
        const isApiKeyError = error?.error?.code === 400 && error?.error?.message?.includes('API key');
        if (isApiKeyError) {
            // Não logar erro de API key inválida, apenas retornar fallback
            const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';
            return `Bom ${timeOfDay}! Mantenha-se hidratado e focado no seu objetivo de ${user.objetivo}. Você consegue! 💪`;
        }
        // Para outros erros, logar mas ainda retornar fallback
        console.warn("Erro ao obter dica do coach (usando fallback):", error?.message || error);
        const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';
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
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key is not configured. Please set it up in Settings.");
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
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: progressAnalysisSchema }
    });
    return JSON.parse(response.text) as ProgressAnalysis;
};

// --- EXPLAIN MEAL ---
export const explainMeal = async (mealName: string, user: User): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key is not configured. Please set it up in Settings.");
    const prompt = `
        Explique de forma científica e simples por que a refeição "${mealName}" é uma boa escolha para o usuário, considerando seu objetivo de "${user.objetivo}".
        Fale sobre os macronutrientes principais da refeição e como eles ajudam a atingir o objetivo.
        Seja breve (2-3 frases) e educativo.
    `;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
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
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key is not configured. Please set it up in Settings.");
    const prompt = `
        Para o alimento "${food}", sugira 3 substituições mais saudáveis e alinhadas com o objetivo do usuário de "${user.objetivo}".
        Para cada sugestão, forneça uma justificativa clara e concisa.
        Retorne estritamente no formato JSON.
    `;
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: foodSubstitutionsSchema }
    });
    return (JSON.parse(response.text) as { substituicoes: FoodSubstitution[] }).substituicoes;
};

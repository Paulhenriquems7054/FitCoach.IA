
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { User, GeminiMealPlanResponse, MealAnalysisResponse, Recipe, ModerationResult, WellnessPlan, ProgressAnalysis, FoodSubstitution } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY not found in environment variables. Please set it up to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");

    const prompt = buildMealPlanPrompt(user, language);

    try {
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
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with Gemini API. Check console for details.");
    }
};

// --- CHAT ---
let chat: Chat | null = null;
export const startChat = (user: User, language: 'pt' | 'en' | 'es' = 'pt'): void => {
  if (!API_KEY) throw new Error("API key for Gemini is not configured.");
  const langPrompts = {
      pt: `Você é o Nutri.IA, um agente nutricional inteligente e amigável. Você está conversando com ${user.nome}, que tem ${user.idade} anos e seu objetivo principal é "${user.objetivo}". Leve essas informações em consideração para fornecer respostas personalizadas, lembrando do histórico desta conversa. Responda a perguntas sobre nutrição, dietas e saúde de forma clara, educativa e motivadora.`,
      en: `You are Nutri.IA, a friendly and intelligent nutritional agent. You are chatting with ${user.nome}, who is ${user.idade} years old and their main goal is "${user.objetivo}". Keep this information in mind to provide personalized answers, remembering the history of this conversation. Answer questions about nutrition, diets, and health in a clear, educational, and motivating way.`,
      es: `Eres Nutri.IA, un agente nutricional inteligente y amigable. Estás hablando con ${user.nome}, que tiene ${user.idade} años y su objetivo principal es "${user.objetivo}". Ten en cuenta esta información para dar respuestas personalizadas, recordando el historial de esta conversación. Responde preguntas sobre nutrición, dietas y salud de forma clara, educativa y motivadora.`
  }
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: langPrompts[language] },
  });
};
export const sendMessageToChat = (message: string) => {
    if (!chat) throw new Error("Chat not started. Call startChat first.");
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
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");

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
    } catch (error) {
        console.error("Error calling Gemini API for meal analysis:", error);
        throw new Error("Failed to communicate with Gemini API for meal analysis.");
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
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");

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
    } catch (error) {
        console.error("Error calling Gemini API for recipe search:", error);
        throw new Error("Failed to communicate with Gemini API for recipe search.");
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
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");

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
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");
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

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
};


// --- WELLNESS PLAN ---

const wellnessPlanSchema = {
    type: Type.OBJECT,
    properties: {
        plano_treino_semanal: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dia_semana: { type: Type.STRING },
                    foco_treino: { type: Type.STRING },
                    exercicios: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["dia_semana", "foco_treino", "exercicios"]
            }
        },
        recomendacoes_suplementos: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    nome: { type: Type.STRING },
                    dosagem_sugerida: { type: Type.STRING },
                    melhor_horario: { type: Type.STRING },
                    justificativa: { type: Type.STRING }
                },
                required: ["nome", "dosagem_sugerida", "melhor_horario", "justificativa"]
            }
        },
        dicas_adicionais: { type: Type.STRING }
    },
    required: ["plano_treino_semanal", "recomendacoes_suplementos", "dicas_adicionais"]
};

export const generateWellnessPlan = async (user: User): Promise<WellnessPlan> => {
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");

    const prompt = `
        Crie um plano de bem-estar holístico para o usuário, focado em treino e suplementação, para auxiliar em seu objetivo de "${user.objetivo}".
        O plano de treino deve cobrir 5 a 7 dias da semana, com um dia de descanso sugerido. Especifique o foco de cada dia (ex: "Parte Superior do Corpo", "Cardio", "Pernas") e liste 3-5 exercícios chave para cada dia.
        As recomendações de suplementos devem incluir 2-3 sugestões (ex: Whey Protein, Creatina, Vitamina D), com dosagem, melhor horário para tomar e uma justificativa clara de por que seria benéfico para o objetivo do usuário.
        Adicione uma seção com 2 dicas adicionais sobre recuperação, sono ou bem-estar geral.
        Retorne estritamente no formato JSON, seguindo o schema.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: wellnessPlanSchema }
    });
    return JSON.parse(response.text) as WellnessPlan;
};

// --- AI COACH TIP ---

export const getAICoachTip = async (user: User): Promise<string> => {
    if (!API_KEY) throw new Error("API key for Gemini is not configured.");
    const timeOfDay = new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite';

    const prompt = `
        Aja como um coach de bem-estar. Crie uma dica rápida, motivacional e acionável para ${user.nome}.
        A dica deve ser relevante para o objetivo de "${user.objetivo}" e para o período do dia atual (${timeOfDay}).
        Seja breve (1-2 frases) e inspirador.
        Exemplo para "perder peso" de manhã: "Comece o dia com um copo d'água para ativar seu metabolismo e hidratar o corpo!"
    `;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
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
    if (!API_KEY) throw new Error("API key is not configured.");
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
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: progressAnalysisSchema }
    });
    return JSON.parse(response.text) as ProgressAnalysis;
};

// --- EXPLAIN MEAL ---
export const explainMeal = async (mealName: string, user: User): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    const prompt = `
        Explique de forma científica e simples por que a refeição "${mealName}" é uma boa escolha para o usuário, considerando seu objetivo de "${user.objetivo}".
        Fale sobre os macronutrientes principais da refeição e como eles ajudam a atingir o objetivo.
        Seja breve (2-3 frases) e educativo.
    `;
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
    if (!API_KEY) throw new Error("API key is not configured.");
    const prompt = `
        Para o alimento "${food}", sugira 3 substituições mais saudáveis e alinhadas com o objetivo do usuário de "${user.objetivo}".
        Para cada sugestão, forneça uma justificativa clara e concisa.
        Retorne estritamente no formato JSON.
    `;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: foodSubstitutionsSchema }
    });
    return (JSON.parse(response.text) as { substituicoes: FoodSubstitution[] }).substituicoes;
};

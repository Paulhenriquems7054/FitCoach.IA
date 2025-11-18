/**
 * Serviço de IA Local Offline usando Ollama
 * 
 * Este módulo fornece integração com Ollama para executar modelos de IA localmente,
 * sem necessidade de conexão com APIs externas.
 * 
 * Integrado em: services/geminiService.ts, services/assistantService.ts
 */

import { logger } from '../utils/logger';

// Configuração do Ollama
const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'phi3:mini'; // Modelo leve recomendado
const FALLBACK_MODELS = ['llama3.1:8b', 'mistral:7b', 'qwen2.5:7b']; // Modelos alternativos

// Cache de status da conexão
let isOllamaAvailable: boolean | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 segundos

/**
 * Verifica se o Ollama está disponível e rodando
 */
export async function checkOllamaHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Usar cache se a verificação foi feita recentemente
  if (isOllamaAvailable !== null && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return isOllamaAvailable;
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
    });

    if (response.ok) {
      isOllamaAvailable = true;
      lastHealthCheck = now;
      logger.info('Ollama está disponível e rodando', 'localAIService');
      return true;
    } else {
      isOllamaAvailable = false;
      lastHealthCheck = now;
      return false;
    }
  } catch (error) {
    isOllamaAvailable = false;
    lastHealthCheck = now;
    logger.debug('Ollama não está disponível', 'localAIService', error);
    return false;
  }
}

/**
 * Lista modelos disponíveis no Ollama
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.models || []).map((model: { name: string }) => model.name);
  } catch (error) {
    logger.warn('Erro ao listar modelos do Ollama', 'localAIService', error);
    return [];
  }
}

/**
 * Verifica se um modelo específico está disponível
 */
export async function isModelAvailable(modelName: string): Promise<boolean> {
  const models = await listAvailableModels();
  return models.includes(modelName);
}

/**
 * Obtém o modelo a ser usado (verifica disponibilidade)
 */
export async function getAvailableModel(): Promise<string | null> {
  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  
  for (const model of models) {
    if (await isModelAvailable(model)) {
      logger.info(`Modelo ${model} está disponível`, 'localAIService');
      return model;
    }
  }

  logger.warn('Nenhum modelo disponível no Ollama', 'localAIService');
  return null;
}

/**
 * Gera resposta usando IA Local (Ollama)
 * 
 * @param prompt - O prompt para enviar ao modelo
 * @param systemPrompt - Prompt do sistema (opcional)
 * @param model - Nome do modelo a usar (opcional, usa getAvailableModel se não fornecido)
 * @returns Resposta do modelo ou null se falhar
 */
export async function generateLocalResponse(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<string | null> {
  try {
    // Verificar se Ollama está disponível
    const isAvailable = await checkOllamaHealth();
    if (!isAvailable) {
      logger.debug('Ollama não está disponível para gerar resposta', 'localAIService');
      return null;
    }

    // Obter modelo disponível
    const modelToUse = model || await getAvailableModel();
    if (!modelToUse) {
      logger.warn('Nenhum modelo disponível para gerar resposta', 'localAIService');
      return null;
    }

    // Preparar mensagens
    const messages: Array<{ role: string; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    // Chamar API do Ollama
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        stream: false, // Por enquanto, sem streaming
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
      signal: AbortSignal.timeout(60000), // Timeout de 60 segundos
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Erro na API do Ollama: ${response.status}`, 'localAIService', new Error(errorText));
      return null;
    }

    const data = await response.json();
    const responseText = data.message?.content || data.response || '';

    if (!responseText) {
      logger.warn('Resposta vazia do Ollama', 'localAIService');
      return null;
    }

    logger.info('Resposta gerada com sucesso usando IA Local', 'localAIService');
    return responseText.trim();
  } catch (error) {
    logger.error('Erro ao gerar resposta com IA Local', 'localAIService', error);
    return null;
  }
}

/**
 * Gera resposta com streaming (para uso futuro)
 */
export async function generateLocalResponseStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemPrompt?: string,
  model?: string
): Promise<void> {
  try {
    const isAvailable = await checkOllamaHealth();
    if (!isAvailable) {
      throw new Error('Ollama não está disponível');
    }

    const modelToUse = model || await getAvailableModel();
    if (!modelToUse) {
      throw new Error('Nenhum modelo disponível');
    }

    const messages: Array<{ role: string; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        stream: true,
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Ollama: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Não foi possível ler a resposta');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            onChunk(data.message.content);
          }
        } catch (e) {
          // Ignorar linhas que não são JSON válido
        }
      }
    }
  } catch (error) {
    logger.error('Erro no streaming da IA Local', 'localAIService', error);
    throw error;
  }
}

/**
 * Testa a conexão com a IA Local
 */
export async function testLocalIA(): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const isAvailable = await checkOllamaHealth();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Ollama não está rodando. Verifique se o servidor está iniciado em http://localhost:11434',
      };
    }

    const model = await getAvailableModel();
    if (!model) {
      return {
        success: false,
        message: 'Nenhum modelo disponível. Instale um modelo usando os scripts de instalação.',
      };
    }

    // Testar com um prompt simples
    const testPrompt = 'Responda apenas: "IA Local funcionando corretamente"';
    const response = await generateLocalResponse(testPrompt, undefined, model);

    if (response && response.includes('funcionando')) {
      return {
        success: true,
        message: `IA Local está funcionando! Modelo: ${model}`,
        model: model,
      };
    } else {
      return {
        success: false,
        message: 'IA Local respondeu, mas a resposta não foi a esperada.',
        model: model,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao testar IA Local: ${errorMessage}`,
    };
  }
}

/**
 * Força uma nova verificação de saúde (limpa o cache)
 */
export function resetHealthCheckCache(): void {
  isOllamaAvailable = null;
  lastHealthCheck = 0;
}


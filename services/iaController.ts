/**
 * Controlador de IA com Fallback Automático
 * 
 * Este módulo gerencia as chamadas de IA, tentando primeiro a IA Local (Ollama)
 * e fazendo fallback automático para a API externa (Gemini) se necessário.
 * 
 * Integrado em: services/geminiService.ts, services/assistantService.ts
 */

import { generateLocalResponse, checkOllamaHealth } from './localAIService';
import { logger } from '../utils/logger';

// Chave de configuração para preferência de IA
const USE_LOCAL_AI_KEY = 'nutria.useLocalAI';
const DEFAULT_USE_LOCAL_AI = true; // IA Local é a primeira opção por padrão

/**
 * Verifica se o usuário prefere usar IA Local
 */
export function shouldUseLocalAI(): boolean {
  if (typeof window === 'undefined') {
    return DEFAULT_USE_LOCAL_AI;
  }

  try {
    const stored = localStorage.getItem(USE_LOCAL_AI_KEY);
    if (stored === null) {
      return DEFAULT_USE_LOCAL_AI;
    }
    return stored === 'true';
  } catch (error) {
    logger.warn('Erro ao ler preferência de IA Local', 'iaController', error);
    return DEFAULT_USE_LOCAL_AI;
  }
}

/**
 * Define a preferência de uso de IA Local
 */
export function setUseLocalAI(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(USE_LOCAL_AI_KEY, enabled.toString());
    logger.info(`Preferência de IA Local alterada para: ${enabled}`, 'iaController');
  } catch (error) {
    logger.warn('Erro ao salvar preferência de IA Local', 'iaController', error);
  }
}

/**
 * Gera resposta usando IA com fallback automático
 * 
 * Fluxo:
 * 1. Se IA Local estiver habilitada → tenta IA Local
 * 2. Se IA Local falhar e houver API key → usa API externa
 * 3. Se tudo falhar → retorna null ou erro controlado
 * 
 * @param prompt - Prompt para enviar
 * @param systemPrompt - Prompt do sistema (opcional)
 * @param fallbackFunction - Função de fallback para API externa (opcional)
 * @returns Resposta gerada ou null
 */
export async function generateResponse(
  prompt: string,
  systemPrompt?: string,
  fallbackFunction?: () => Promise<string | null>
): Promise<string | null> {
  const useLocal = shouldUseLocalAI();

  // Tentar IA Local primeiro se estiver habilitada
  if (useLocal) {
    try {
      const isAvailable = await checkOllamaHealth();
      if (isAvailable) {
        const localResponse = await generateLocalResponse(prompt, systemPrompt);
        if (localResponse) {
          logger.info('Resposta gerada usando IA Local', 'iaController');
          return localResponse;
        }
      }
    } catch (error) {
      logger.warn('Falha ao usar IA Local, tentando fallback', 'iaController', error);
    }
  }

  // Fallback para API externa se disponível
  if (fallbackFunction) {
    try {
      logger.info('Usando API externa como fallback', 'iaController');
      const apiResponse = await fallbackFunction();
      return apiResponse;
    } catch (error) {
      logger.error('Falha no fallback para API externa', 'iaController', error);
    }
  }

  // Se tudo falhou
  logger.warn('Todas as opções de IA falharam', 'iaController');
  return null;
}

/**
 * Gera resposta de texto simples (para uso geral)
 */
export async function generateTextResponse(
  prompt: string,
  systemPrompt?: string
): Promise<string | null> {
  return generateResponse(prompt, systemPrompt);
}

/**
 * Gera resposta JSON estruturada (para planos alimentares, etc.)
 * 
 * Tenta IA Local primeiro, depois API externa se necessário
 */
export async function generateJSONResponse<T>(
  prompt: string,
  systemPrompt?: string,
  fallbackFunction?: () => Promise<T | null>
): Promise<T | null> {
  const useLocal = shouldUseLocalAI();

  if (useLocal) {
    try {
      const isAvailable = await checkOllamaHealth();
      if (isAvailable) {
        // Adicionar instrução para retornar JSON
        const jsonPrompt = `${prompt}\n\nIMPORTANTE: Retorne APENAS JSON válido, sem markdown, sem texto adicional.`;
        const localResponse = await generateLocalResponse(jsonPrompt, systemPrompt);
        
        if (localResponse) {
          try {
            // Tentar extrair JSON da resposta
            const jsonMatch = localResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]) as T;
              logger.info('JSON gerado usando IA Local', 'iaController');
              return parsed;
            } else {
              // Tentar parse direto
              const parsed = JSON.parse(localResponse) as T;
              logger.info('JSON gerado usando IA Local', 'iaController');
              return parsed;
            }
          } catch (parseError) {
            logger.warn('Erro ao parsear JSON da IA Local, tentando fallback', 'iaController', parseError);
          }
        }
      }
    } catch (error) {
      logger.warn('Falha ao usar IA Local para JSON, tentando fallback', 'iaController', error);
    }
  }

  // Fallback para API externa
  if (fallbackFunction) {
    try {
      logger.info('Usando API externa como fallback para JSON', 'iaController');
      return await fallbackFunction();
    } catch (error) {
      logger.error('Falha no fallback para API externa (JSON)', 'iaController', error);
    }
  }

  return null;
}

/**
 * Verifica se há alguma opção de IA disponível
 */
export async function isAnyAIAvailable(): Promise<boolean> {
  const useLocal = shouldUseLocalAI();
  
  if (useLocal) {
    const isLocalAvailable = await checkOllamaHealth();
    if (isLocalAvailable) {
      return true;
    }
  }

  // Verificar se há API key configurada
  if (typeof window !== 'undefined') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   localStorage.getItem('gemini_api_key') ||
                   localStorage.getItem('VITE_GEMINI_API_KEY');
    if (apiKey) {
      return true;
    }
  }

  return false;
}


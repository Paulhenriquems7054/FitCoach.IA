/**
 * EXEMPLO: Como Atualizar Chamadas IA para Novo Modelo
 * 
 * Este arquivo mostra como atualizar os serviços que fazem chamadas à IA
 * para usar o novo sistema de verificação de limites (academia + modo demo)
 */

// ============================================
// EXEMPLO 1: Atualizar sendMessageToGemini (chat de texto)
// ============================================

// ANTES (Código antigo com trial):
/*
import { assertAiAccessOrThrow } from '../../services/aiAccessService';

export async function sendMessageToGemini(...) {
  try {
    const { getUser } = await import('../../services/databaseService');
    const user = await getUser();
    if (user) {
      await assertAiAccessOrThrow(user, 'chat');
    }
  } catch (error: any) {
    if (error?.code === 'AI_ACCESS_DENIED') {
      onError('Seu acesso à IA está bloqueado. Ative um plano para continuar usando.');
      return;
    }
  }
  // ... fazer chamada IA ...
}
*/

// DEPOIS (Novo código com limites de academia):
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';

export async function sendMessageToGemini(
  message: string,
  onNewChunk: (chunk: string) => void,
  onError: (error: string) => void,
  // ... outros parâmetros
): Promise<void> {
  try {
    // 1. Verificar acesso ANTES de fazer chamada
    const { getUser } = await import('../../services/databaseService');
    const user = await getUser();
    
    if (user) {
      await assertNovoAiAccessOrThrow(user, 'chat');
    }
  } catch (error: any) {
    if (error?.code === 'AI_ACCESS_DENIED') {
      // Mensagem específica baseada no motivo
      const mensagem = error.message || 
        (error.reason === 'limite_excedido' 
          ? 'Você atingiu o limite da sua conta. Adquira recarga FitVoice.' 
          : error.reason === 'demo_expirado'
          ? 'Você atingiu o limite da sua conta. Adquira recarga FitVoice ou vincule-se a uma academia.'
          : 'Seu acesso à IA está bloqueado. Vincule-se a uma academia ou adquira recarga FitVoice.');
      onError(mensagem);
      return;
    }
    logger.warn('Erro ao verificar acesso à IA', 'geminiService', error);
  }

  // 2. Fazer chamada à IA (Gemini API)
  try {
    // ... código de chamada IA ...
    const response = await fetch(`${AI_BACKEND_BASE}/ai/text`, {
      method: 'POST',
      // ...
    });

    if (!response.ok) {
      onError('Erro ao chamar IA');
      return;
    }

    const data = await response.json();
    onNewChunk(data.text);

    // 3. Consumir uso APÓS chamada bem-sucedida
    try {
      const { getUser } = await import('../../services/databaseService');
      const user = await getUser();
      if (user) {
        await consumirUsoAposChamada(user.id as string, 'chat', 1);
      }
    } catch (error) {
      logger.warn('Erro ao consumir uso após chamada', 'geminiService', error);
      // Não bloquear usuário se consumo falhar, mas logar erro
    }
  } catch (error) {
    onError('Erro ao processar mensagem');
  }
}

// ============================================
// EXEMPLO 2: Atualizar processImageWithGemini (análise de imagem)
// ============================================

export async function processImageWithGemini(...) {
  try {
    // 1. Verificar acesso
    const { getUser } = await import('../../services/databaseService');
    const user = await getUser();
    
    if (user) {
      await assertNovoAiAccessOrThrow(user, 'vision');
    }
  } catch (error: any) {
    if (error?.code === 'AI_ACCESS_DENIED') {
      onError(error.message || 'Você atingiu o limite da sua conta. Adquira recarga FitVoice.');
      return;
    }
  }

  // 2. Fazer chamada IA
  // ... código de análise de imagem ...

  // 3. Consumir uso após sucesso
  try {
    const { getUser } = await import('../../services/databaseService');
    const user = await getUser();
    if (user) {
      await consumirUsoAposChamada(user.id as string, 'vision', 1);
    }
  } catch (error) {
    logger.warn('Erro ao consumir uso', 'geminiService', error);
  }
}

// ============================================
// EXEMPLO 3: Atualizar startAssistantAudioSession (voz)
// ============================================

export async function startAssistantAudioSession(...) {
  let totalSeconds = 0;
  let minutosConsumidos = 0;
  let intervalId: NodeJS.Timeout | null = null;

  try {
    // 1. Verificar acesso ANTES de iniciar sessão
    const { getUser } = await import('../../services/databaseService');
    const user = await getUser();
    
    if (user) {
      await assertNovoAiAccessOrThrow(user, 'voice');
    }
  } catch (error: any) {
    if (error?.code === 'AI_ACCESS_DENIED') {
      onError(error.message || 'Você atingiu o limite de minutos de voz. Recarregue FitVoice.', false);
      return;
    }
  }

  try {
    // 2. Iniciar sessão de voz
    // ... código de início de sessão ...

    // 3. Consumir minutos em tempo real (a cada minuto completo)
    intervalId = setInterval(async () => {
      const minutosUsados = Math.floor(totalSeconds / 60);
      if (minutosUsados > minutosConsumidos) {
        try {
          const { getUser } = await import('../../services/databaseService');
          const user = await getUser();
          if (user) {
            await consumirUsoAposChamada(user.id as string, 'voice', minutosUsados - minutosConsumidos);
            minutosConsumidos = minutosUsados;
          }
        } catch (error) {
          logger.warn('Erro ao consumir minutos durante sessão', 'assistantService', error);
        }
      }
    }, 60000); // Verificar a cada minuto

    // ... código de sessão de voz ...
    
  } finally {
    // 4. Consumir minutos restantes ao finalizar sessão
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    try {
      const { getUser } = await import('../../services/databaseService');
      const user = await getUser();
      if (user) {
        const minutosFinais = Math.ceil(totalSeconds / 60);
        const minutosPendentes = minutosFinais - minutosConsumidos;
        if (minutosPendentes > 0) {
          await consumirUsoAposChamada(user.id as string, 'voice', minutosPendentes);
        }
      }
    } catch (error) {
      logger.warn('Erro ao consumir minutos finais', 'assistantService', error);
    }
  }
}

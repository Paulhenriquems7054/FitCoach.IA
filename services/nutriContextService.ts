/**
 * Serviço para construir contexto do usuário para a Nutri.ai
 * Inclui perfil, plano alimentar e diário do dia
 */

import type { User } from '../types';
import { formatDailyLogSummary } from './dailyLogService';

/**
 * Constrói as instruções do sistema com contexto completo do usuário
 */
export async function buildNutriSystemInstruction(
  user: User,
  customInstructions?: string
): Promise<string> {
  // Carregar plano alimentar do dia (se existir)
  let mealPlanText = 'Nenhum plano alimentar específico para hoje.';
  try {
    const { getMealPlans } = await import('./databaseService');
    const mealPlans = await getMealPlans(user.nome, 1);
    if (mealPlans && mealPlans.length > 0) {
      const mealPlan = mealPlans[0];
      mealPlanText = `Plano Alimentar de Hoje:\n${mealPlan.map(meal => 
        `- ${meal.refeicao} (${meal.horario_sugerido}): ${meal.alimentos.join(', ')} - ${meal.calorias} kcal`
      ).join('\n')}`;
    }
  } catch (error) {
    console.warn('Erro ao carregar plano alimentar:', error);
  }

  // Carregar diário do dia
  const dailyLog = formatDailyLogSummary();

  // Construir perfil do usuário
  const userProfile = `
PERFIL DO USUÁRIO:
- Nome: ${user.nome}
- Idade: ${user.idade} anos
- Gênero: ${user.genero}
- Peso: ${user.peso} kg
- Altura: ${user.altura} cm
- Objetivo: ${user.objetivo}
- Pontos: ${user.points}
- Score de Disciplina: ${user.disciplineScore}/100
`;

  // Instruções base da Nutri.ai
  const baseInstruction = `Você é a Nutri.ai, uma nutricionista pessoal inteligente e amigável.

${userProfile}

${mealPlanText}

DIÁRIO ALIMENTAR DE HOJE:
${dailyLog}

INSTRUÇÕES IMPORTANTES:
1. Responda sempre de forma natural e conversacional em Português do Brasil
2. Se o usuário mencionar que comeu algo, use a ferramenta 'logMeal' para registrar automaticamente
3. Estime calorias e macros se o usuário não informar valores exatos
4. Confirme verbalmente quando registrar uma refeição
5. Use o contexto do perfil, plano alimentar e diário para dar orientações personalizadas
6. Seja encorajadora e positiva, mas também realista sobre objetivos nutricionais
7. Forneça dicas práticas e acionáveis
8. Se o usuário perguntar sobre o que já comeu hoje, consulte o diário alimentar acima`;

  // Adicionar instruções customizadas se fornecidas
  if (customInstructions && customInstructions.trim()) {
    return `${baseInstruction}\n\nINSTRUÇÕES PERSONALIZADAS DO USUÁRIO:\n${customInstructions}`;
  }

  return baseInstruction;
}


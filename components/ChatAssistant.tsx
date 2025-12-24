/**
 * ChatAssistant - Componente de chat de texto com nutricionista IA
 * 
 * Como funciona:
 * - Usuário digita mensagem
 * - Chama chatWithNutritionist() que:
 *   - Monta contexto (perfil, plano, histórico)
 *   - Envia histórico de mensagens para Gemini
 *   - Usa função logMeal para registrar refeições automaticamente
 *   - Retorna resposta formatada em Markdown
 * - Resposta é renderizada com formatação (títulos, listas, etc.)
 * - Mensagens são salvas no Supabase
 * - Limite: 600 mensagens/dia (reseta automaticamente)
 * 
 * Este componente é um wrapper para ChatbotPopup para manter compatibilidade
 * com a estrutura documentada.
 */

import React from 'react';
import ChatbotPopup from '../chatbot/components/ChatbotPopup';

interface ChatAssistantProps {
  onMealLogged?: (meal: {
    foodName: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType: string;
    description?: string;
  }) => void;
}

/**
 * ChatAssistant - Wrapper para ChatbotPopup
 * Mantém compatibilidade com a estrutura documentada
 */
export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onMealLogged }) => {
  return <ChatbotPopup />;
};

export default ChatAssistant;


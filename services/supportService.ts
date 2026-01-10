/**
 * Serviço de Suporte ao Cliente Integrado
 * Sistema completo de chat, tickets, base de conhecimento e chatbot
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'support';
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

class SupportService {
  private tickets: Map<string, SupportTicket[]> = new Map();
  private knowledgeBase: KnowledgeBaseArticle[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadKnowledgeBase();
  }

  /**
   * Cria um novo ticket
   */
  async createTicket(
    userId: string,
    ticket: Omit<SupportTicket, 'id' | 'userId' | 'messages' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<SupportTicket> {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messages: [],
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userTickets = await this.getUserTickets(userId);
    userTickets.push(newTicket);
    this.tickets.set(userId, userTickets);
    await this.saveUserTickets(userId, userTickets);

    logger.info(`Ticket criado: ${newTicket.id}`, 'supportService');
    return newTicket;
  }

  /**
   * Obtém tickets do usuário
   */
  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    if (this.tickets.has(userId)) {
      return this.tickets.get(userId)!;
    }

    try {
      const saved = await getAppSetting<SupportTicket[]>(`tickets_${userId}`);
      if (saved) {
        this.tickets.set(userId, saved);
        return saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar tickets', 'supportService', error);
    }

    return [];
  }

  /**
   * Adiciona mensagem a um ticket
   */
  async addMessage(
    userId: string,
    ticketId: string,
    message: Omit<SupportMessage, 'id' | 'ticketId' | 'createdAt'>
  ): Promise<SupportMessage> {
    const tickets = await this.getUserTickets(userId);
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      throw new Error('Ticket não encontrado');
    }

    const newMessage: SupportMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      createdAt: new Date().toISOString(),
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();
    
    // Se mensagem do suporte, atualizar status
    if (message.senderType === 'support') {
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    } else {
      // Se mensagem do usuário, reabrir se estava fechado
      if (ticket.status === 'closed') {
        ticket.status = 'open';
      }
    }

    this.tickets.set(userId, tickets);
    await this.saveUserTickets(userId, tickets);

    logger.info(`Mensagem adicionada ao ticket: ${ticketId}`, 'supportService');
    return newMessage;
  }

  /**
   * Resolve um ticket
   */
  async resolveTicket(userId: string, ticketId: string): Promise<boolean> {
    const tickets = await this.getUserTickets(userId);
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) return false;

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(userId, tickets);
    await this.saveUserTickets(userId, tickets);

    logger.info(`Ticket resolvido: ${ticketId}`, 'supportService');
    return true;
  }

  /**
   * Busca na base de conhecimento
   */
  async searchKnowledgeBase(query: string): Promise<KnowledgeBaseArticle[]> {
    const queryLower = query.toLowerCase();
    
    return this.knowledgeBase.filter(article =>
      article.title.toLowerCase().includes(queryLower) ||
      article.content.toLowerCase().includes(queryLower) ||
      article.tags.some(tag => tag.toLowerCase().includes(queryLower))
    ).sort((a, b) => b.views - a.views);
  }

  /**
   * Obtém artigo da base de conhecimento
   */
  async getArticle(articleId: string): Promise<KnowledgeBaseArticle | null> {
    const article = this.knowledgeBase.find(a => a.id === articleId);
    if (article) {
      // Incrementar visualizações
      article.views++;
      await this.saveKnowledgeBase();
    }
    return article || null;
  }

  /**
   * Carrega base de conhecimento
   */
  private async loadKnowledgeBase(): Promise<void> {
    try {
      const saved = await getAppSetting<KnowledgeBaseArticle[]>('knowledgeBase');
      if (saved) {
        this.knowledgeBase = saved;
        return;
      }
    } catch (error) {
      logger.warn('Erro ao carregar base de conhecimento', 'supportService', error);
    }

    // Artigos padrão
    this.knowledgeBase = [
      {
        id: 'kb-1',
        title: 'Como começar a usar o FitCoach.IA',
        content: 'Bem-vindo ao FitCoach.IA! Para começar, você precisa criar uma conta e completar seu perfil. Depois, você pode gerar seu primeiro plano de treino e começar a usar o assistente de IA.',
        category: 'getting-started',
        tags: ['início', 'tutorial', 'primeiros passos'],
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'kb-2',
        title: 'Como usar o assistente de IA',
        content: 'O assistente de IA está disponível em texto e voz. Você pode fazer perguntas sobre nutrição, treinos, e receber recomendações personalizadas. Use o chat de texto para perguntas rápidas ou o chat de voz para conversas mais naturais.',
        category: 'features',
        tags: ['IA', 'chat', 'assistente'],
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'kb-3',
        title: 'Como registrar meu peso',
        content: 'Para registrar seu peso, vá até a página de Análise de Progresso e clique em "Adicionar Peso". Você pode registrar seu peso diariamente para acompanhar seu progresso.',
        category: 'features',
        tags: ['peso', 'progresso', 'registro'],
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await this.saveKnowledgeBase();
  }

  /**
   * Salva base de conhecimento
   */
  private async saveKnowledgeBase(): Promise<void> {
    try {
      await saveAppSetting('knowledgeBase', this.knowledgeBase);
    } catch (error) {
      logger.error('Erro ao salvar base de conhecimento', 'supportService', error);
    }
  }

  /**
   * Salva tickets do usuário
   */
  private async saveUserTickets(userId: string, tickets: SupportTicket[]): Promise<void> {
    try {
      await saveAppSetting(`tickets_${userId}`, tickets);
    } catch (error) {
      logger.error('Erro ao salvar tickets', 'supportService', error);
    }
  }

  /**
   * Obtém categorias disponíveis
   */
  getCategories(): string[] {
    return ['getting-started', 'features', 'billing', 'technical', 'troubleshooting'];
  }
}

// Instância singleton
export const supportService = new SupportService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  supportService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de suporte', 'supportService', error);
  });
}


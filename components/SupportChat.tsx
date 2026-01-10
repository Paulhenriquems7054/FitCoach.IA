/**
 * Componente de Chat de Suporte
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supportService, SupportTicket, SupportMessage } from '../services/supportService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

export const SupportChat: React.FC = () => {
  const { user } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const loadTickets = async () => {
    if (!user?.username) return;

    try {
      const userTickets = await supportService.getUserTickets(user.username);
      setTickets(userTickets);
      if (userTickets.length > 0 && !selectedTicket) {
        setSelectedTicket(userTickets[0]);
      }
    } catch (error) {
      logger.error('Erro ao carregar tickets', 'SupportChat', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket || !user?.username) return;

    setIsSending(true);
    try {
      await supportService.addMessage(user.username, selectedTicket.id, {
        senderId: user.username,
        senderName: user.nome,
        senderType: 'user',
        content: message,
      });
      
      setMessage('');
      await loadTickets();
      
      // Atualizar ticket selecionado
      const updatedTickets = await supportService.getUserTickets(user.username);
      const updated = updatedTickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    } catch (error) {
      logger.error('Erro ao enviar mensagem', 'SupportChat', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!user?.username) return;

    const newTicket = await supportService.createTicket(user.username, {
      subject: 'Nova Solicitação',
      description: '',
      category: 'other',
      priority: 'medium',
    });

    setTickets([...tickets, newTicket]);
    setSelectedTicket(newTicket);
  };

  return (
    <Card>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ChatBubbleIcon className="w-6 h-6" />
            Suporte
          </h2>
          <Button onClick={handleCreateTicket} size="sm">
            Novo Ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
          {/* Lista de Tickets */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Tickets</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {tickets.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum ticket ainda
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`
                        w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors
                        ${selectedTicket?.id === ticket.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600'
                          : ''
                        }
                      `}
                    >
                      <div className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ticket.status} • {ticket.messages.length} mensagens
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="md:col-span-2 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col">
            {selectedTicket ? (
              <>
                {/* Cabeçalho */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {selectedTicket.subject}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedTicket.category} • {selectedTicket.priority}
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium
                      ${selectedTicket.status === 'resolved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : selectedTicket.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }
                    `}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`
                        flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}
                      `}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-lg p-3
                          ${msg.senderType === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-1">
                          {msg.senderName}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      disabled={isSending || selectedTicket.status === 'closed'}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !message.trim() || selectedTicket.status === 'closed'}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Selecione um ticket ou crie um novo
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};


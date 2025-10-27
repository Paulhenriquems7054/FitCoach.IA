
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { sendMessageToChat, startChat } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { MicrophoneIcon } from '../components/icons/MicrophoneIcon';
import { SpeakerWaveIcon } from '../components/icons/SpeakerWaveIcon';
import { useI18n } from '../context/I18nContext';

const ChatPage: React.FC = () => {
    const { user } = useUser();
    const { t, language } = useI18n();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);


    useEffect(() => {
        try {
            startChat(user, language);
            const objetivo = user.objetivo === 'manter peso' ? 'Manter o Peso' : 
                            user.objetivo === 'perder peso' ? 'Perder Peso' : 
                            'Ganhar Massa Muscular';
            setMessages([
                { role: 'model', text: t('chat.initial_greeting', { name: user.nome, objective: objetivo }) }
            ]);
        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            setMessages([
                { role: 'model', text: 'Olá! Desculpe, mas o serviço de IA não está disponível no momento. Por favor, configure sua chave da API do Gemini para usar este recurso.' }
            ]);
        }
    }, [user, language, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (textToSend: string) => {
        if (!textToSend.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const stream = await sendMessageToChat(textToSend);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text += chunkText;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.text = t('chat.error');
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(input);
    }

    const handleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(t('chat.voice_not_supported'));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognitionRef.current = recognition;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };
        recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            setInput(speechResult);
            handleSend(speechResult);
        };

        recognition.start();
    };

    const handleTextToSpeech = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
             alert(t('chat.tts_not_supported'));
        }
    };


    return (
        <div className="max-w-3xl mx-auto">
            <Card className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('chat.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('chat.subtitle')}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-primary-500" /></div>}
                            <div className={`p-3 rounded-xl max-w-lg shadow-sm group relative ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}{isLoading && msg.role === 'model' && index === messages.length -1 ? '...' : ''}</p>
                                {msg.role === 'model' && msg.text && (
                                    <button onClick={() => handleTextToSpeech(msg.text)} className="absolute -bottom-3 -right-3 p-1 bg-slate-200 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <SpeakerWaveIcon className="w-4 h-4 text-slate-600 dark:text-slate-200" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('chat.placeholder')}
                            disabled={isLoading}
                            className="flex-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                         <Button
                            type="button"
                            variant="secondary"
                            onClick={handleVoiceInput}
                            disabled={isLoading}
                            className={isListening ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : ''}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            disabled={!input.trim()}
                        >
                            {t('chat.send')}
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default ChatPage;

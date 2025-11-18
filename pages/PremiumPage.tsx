import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { StarIcon } from '../components/icons/StarIcon';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../components/ui/Toast';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { BoltIcon } from '../components/icons/BoltIcon';

const freeFeatures = [
    "1 Relatório IA por semana",
    "Geração de planos alimentares diários",
    "Chat com IA padrão",
    "Biblioteca de receitas",
    "Análise básica de fotos de refeições",
];

const premiumFeatures = [
    "Relatórios IA ilimitados",
    "Análise de progresso avançada com gráficos",
    "IA com memória longa no chat (contexto completo)",
    "Planos de treino e suplementos personalizados",
    "Análise detalhada de refeições com IA",
    "Exportação de relatórios em PDF",
    "Suporte prioritário",
    "Acesso antecipado a novos recursos",
];

const PremiumPage: React.FC = () => {
    const { user, upgradeToPremium } = useUser();
    const { showSuccess } = useToast();
    
    const handleUpgrade = () => {
        upgradeToPremium();
        showSuccess('Parabéns! Você agora é Premium! 🎉');
    };
    
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4 animate-pulse">
                    <StarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mt-4 bg-gradient-to-r from-primary-600 to-amber-500 bg-clip-text text-transparent px-2">
                    Nutri.IA Premium
                </h1>
                <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
                    Desbloqueie todo o potencial da IA para atingir seus objetivos mais rápido.
                </p>
            </div>

            {user.subscription === 'premium' ? (
                <div className="space-y-6">
                    <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="p-6 sm:p-8 md:p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 mb-4 sm:mb-6 animate-scale-in">
                                <CheckCircleIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white"/>
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                                Você já é Premium! 🎉
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto px-2">
                                Obrigado por apoiar o Nutri.IA. Aproveite todos os recursos exclusivos e acelere sua jornada nutricional.
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                                <a
                                    href="#/reports"
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm sm:text-base"
                                >
                                    Ver Relatórios
                                </a>
                                <a
                                    href="#/wellness"
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base"
                                >
                                    Planos de Treino
                                </a>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                        <Card className="text-center p-4 sm:p-6">
                            <ChartBarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 mx-auto mb-3 sm:mb-4" />
                            <h3 className="font-bold text-base sm:text-lg mb-2">Relatórios Ilimitados</h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Gere quantos relatórios quiser para acompanhar seu progresso
                            </p>
                        </Card>
                        <Card className="text-center p-4 sm:p-6">
                            <BoltIcon className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
                            <h3 className="font-bold text-base sm:text-lg mb-2">IA Avançada</h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Chat com memória longa e análises mais profundas
                            </p>
                        </Card>
                        <Card className="text-center p-4 sm:p-6 sm:col-span-2 md:col-span-1">
                            <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 mx-auto mb-3 sm:mb-4" />
                            <h3 className="font-bold text-base sm:text-lg mb-2">Recursos Exclusivos</h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                Acesso antecipado a novos recursos e funcionalidades
                            </p>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
                        <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Gratuito</h2>
                                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">O essencial para começar sua jornada.</p>
                                <div className="mt-3 sm:mt-4">
                                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Grátis</span>
                                </div>
                            </div>
                            <ul className="p-4 sm:p-6 space-y-2 sm:space-y-3 flex-grow">
                                {freeFeatures.map((feature, index) => (
                                    <li key={feature} className="flex items-start gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700">
                                <Button variant="secondary" className="w-full text-sm sm:text-base" disabled>
                                    Seu Plano Atual
                                </Button>
                            </div>
                        </Card>

                        <Card className="flex flex-col border-2 border-primary-500 relative hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-primary-50/50 to-amber-50/50 dark:from-primary-900/10 dark:to-amber-900/10">
                            <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-amber-500 text-white text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg animate-pulse">
                                MAIS POPULAR
                            </div>
                            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 pt-6 sm:pt-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">Premium</h2>
                                </div>
                                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Resultados acelerados com IA avançada.</p>
                                <div className="mt-3 sm:mt-4">
                                    <span className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">Grátis</span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">por tempo limitado</span>
                                </div>
                            </div>
                            <ul className="p-4 sm:p-6 space-y-2 sm:space-y-3 flex-grow">
                                {premiumFeatures.map((feature, index) => (
                                    <li key={feature} className="flex items-start gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-primary-50/50 dark:bg-primary-900/20">
                                <Button 
                                    onClick={handleUpgrade} 
                                    className="w-full bg-gradient-to-r from-primary-600 to-amber-500 hover:from-primary-700 hover:to-amber-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base" 
                                    size="lg"
                                >
                                    <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Assine Agora - Grátis
                                </Button>
                                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2 sm:mt-3">
                                    Sem custos. Ative agora e aproveite!
                                </p>
                            </div>
                        </Card>
                    </div>

                    <Card className="mt-6 sm:mt-8">
                        <div className="p-4 sm:p-6 md:p-8">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-center">
                                Por que escolher Premium?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 sm:mb-2">
                                            IA Mais Inteligente
                                        </h4>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                            Chat com memória longa que lembra de todas as suas conversas e contexto completo da sua jornada.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 sm:mb-2">
                                            Análises Avançadas
                                        </h4>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                            Relatórios ilimitados com gráficos detalhados e insights personalizados sobre seu progresso.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <BoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 sm:mb-2">
                                            Planos Personalizados
                                        </h4>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                            Planos de treino e suplementação totalmente personalizados baseados no seu perfil e objetivos.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 sm:mb-2">
                                            Novos Recursos Primeiro
                                        </h4>
                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                            Acesso antecipado a todas as novas funcionalidades e melhorias antes de todos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PremiumPage;
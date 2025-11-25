import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { StarIcon } from '../components/icons/StarIcon';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../components/ui/Toast';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { getSubscriptionPlans, getActiveSubscription } from '../services/supabaseService';
import { logger } from '../utils/logger';

interface SubscriptionPlan {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number | null;
    features: string[];
    limits: Record<string, number>;
}

const PremiumPage: React.FC = () => {
    const { user } = useUser();
    const { showError } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadPlans();
        loadActiveSubscription();
    }, []);
    
    const loadPlans = async () => {
        try {
            const subscriptionPlans = await getSubscriptionPlans();
            // Filtrar apenas Basic, Premium e Enterprise (excluir Free)
            const filteredPlans = subscriptionPlans.filter(p => 
                ['basic', 'premium', 'enterprise'].includes(p.name)
            );
            setPlans(filteredPlans.map(p => ({
                id: p.id,
                name: p.name,
                display_name: p.display_name,
                description: p.description,
                price_monthly: p.price_monthly,
                price_yearly: p.price_yearly,
                features: (p.features as string[]) || [],
                limits: (p.limits as Record<string, number>) || {},
            })));
        } catch (error) {
            logger.error('Erro ao carregar planos', 'PremiumPage', error);
            showError('Erro ao carregar planos de assinatura');
        } finally {
            setLoading(false);
        }
    };
    
    const loadActiveSubscription = async () => {
        try {
            // Buscar assinatura usando username do usuário logado
            // O webhook cria o username no Supabase baseado no email do pagamento
            const username = user.username;
            
            if (username) {
                logger.info(`Buscando assinatura para username: ${username}`, 'PremiumPage');
                const subscription = await getActiveSubscription(undefined, undefined, username);
                
                if (subscription) {
                    logger.info('Assinatura encontrada!', 'PremiumPage', subscription);
                    setActiveSubscription(subscription);
                } else {
                    logger.warn('Nenhuma assinatura ativa encontrada', 'PremiumPage');
                    setActiveSubscription(null);
                }
            } else {
                logger.warn('Username não disponível para buscar assinatura', 'PremiumPage');
            }
        } catch (error) {
            logger.error('Erro ao carregar assinatura', 'PremiumPage', error);
            setActiveSubscription(null);
        }
    };
    
    const getPlanFeatures = (planName: string): string[] => {
        // Features específicas conforme especificado pelo usuário
        const planFeatures: Record<string, string[]> = {
            'basic': [
                'Treinos Personalizados',
                'Nutrição Básica',
                'Suporte por Email'
            ],
            'premium': [
                'Tudo do Basic',
                'Nutrição Avançada + Receitas',
                'Análise de Desempenho IA',
                'Suporte Prioritário'
            ],
            'enterprise': [
                'Para academias',
                'Tudo do Premium',
                'Gestão de Múltiplos Alunos',
                'Dashboard de Academia',
                'Suporte Dedicado 24/7'
            ]
        };
        
        return planFeatures[planName] || [];
    };
    
    const getPlanDescription = (planName: string): string => {
        const plan = plans.find(p => p.name === planName);
        return plan?.description || '';
    };
    
    const getPaymentLink = (planName: string): string => {
        const paymentLinks: Record<string, string> = {
            'basic': 'https://pay.cakto.com.br/3bewmsy_665747',
            'premium': 'https://pay.cakto.com.br/8djcjc6',
            'enterprise': 'https://pay.cakto.com.br/35tdhxu'
        };
        return paymentLinks[planName] || '#';
    };
    
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4 animate-pulse">
                    <StarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mt-4 bg-gradient-to-r from-primary-600 to-amber-500 bg-clip-text text-transparent px-2">
                    FitCoach.IA Premium
                </h1>
                <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
                    Desbloqueie todo o potencial da IA para atingir seus objetivos mais rápido.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando planos...</p>
                </div>
            ) : activeSubscription ? (
                <div className="space-y-6">
                    <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="p-6 sm:p-8 md:p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 mb-4 sm:mb-6 animate-scale-in">
                                <CheckCircleIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white"/>
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                                Você já tem uma assinatura ativa! 🎉
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto px-2">
                                Obrigado por apoiar o FitCoach.IA. Aproveite todos os recursos exclusivos e acelere sua jornada de treinos.
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
                    <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Escolha o plano ideal para você ou sua academia.
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
                        {plans.map((plan, index) => {
                            const isPopular = plan.name === 'premium';
                            const features = getPlanFeatures(plan.name);
                            const description = getPlanDescription(plan.name);
                            
                            return (
                                <Card 
                                    key={plan.id}
                                    className={`flex flex-col relative hover:shadow-xl transition-all duration-300 ${
                                        isPopular 
                                            ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50/50 to-amber-50/50 dark:from-primary-900/10 dark:to-amber-900/10 scale-105' 
                                            : 'hover:shadow-lg'
                                    }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-amber-500 text-white text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg animate-pulse">
                                            Mais Popular
                                        </div>
                                    )}
                                    
                                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 pt-6 sm:pt-8">
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                            {plan.display_name}
                                        </h2>
                                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
                                            {description}
                                        </p>
                                        <div className="mt-3 sm:mt-4">
                                            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                                R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">/mês</span>
                                        </div>
                                    </div>
                                    
                                    <ul className="p-4 sm:p-6 space-y-2 sm:space-y-3 flex-grow">
                                        {features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 sm:gap-3">
                                                <CheckCircleIcon className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
                                                    isPopular ? 'text-primary-500' : 'text-slate-400'
                                                }`} />
                                                <span className={`text-sm sm:text-base ${
                                                    isPopular 
                                                        ? 'font-semibold text-slate-900 dark:text-white' 
                                                        : 'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className={`p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 ${
                                        isPopular ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                                    }`}>
                                        <a
                                            href={getPaymentLink(plan.name)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-full inline-flex items-center justify-center px-6 py-3 font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base rounded-lg ${
                                                isPopular
                                                    ? 'bg-gradient-to-r from-primary-600 to-amber-500 hover:from-primary-700 hover:to-amber-600 text-white'
                                                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                                            }`}
                                        >
                                            {isPopular && <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                                            Assinar {plan.display_name}
                                        </a>
                                    </div>
                                </Card>
                            );
                        })}
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
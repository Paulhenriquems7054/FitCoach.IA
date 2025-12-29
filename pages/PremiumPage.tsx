import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { StarIcon } from '../components/icons/StarIcon';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useToast } from '../components/ui/Toast';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { BoltIcon } from '../components/icons/BoltIcon';
import { CheckoutModal } from '../components/CheckoutModal';
import { CancelSubscriptionModal } from '../components/CancelSubscriptionModal';
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
    plan_category?: string;
    checkout_url_monthly?: string;
    checkout_url_yearly?: string;
    checkout_price_monthly?: number;
    checkout_price_yearly?: number;
}

const PremiumPage: React.FC = () => {
    const { user } = useUser();
    const { showError, showSuccess } = useToast();
    
    // Verificar se é aluno
    const isStudent = user?.tenantRole === 'student';
    
    // Verificar se trial expirou para alunos
    const isTrialExpired = React.useMemo(() => {
        if (!isStudent) return false;
        if (!user?.trialExpiresAt) return false;
        
        const expiryDate = new Date(user.trialExpiresAt);
        const now = new Date();
        return now > expiryDate;
    }, [user, isStudent]);
    const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutModal, setCheckoutModal] = useState<{
        isOpen: boolean;
        planId: string;
        planName: string;
        displayName: string;
        price: number;
        priceYearly?: number;
    } | null>(null);
    const [cancelModal, setCancelModal] = useState<{
        isOpen: boolean;
        subscriptionId: string;
        subscriptionName: string;
        expiryDate?: string;
        caktoPaymentId?: string;
    } | null>(null);
    
    const turboRef = useRef<HTMLDivElement | null>(null);
    const bank100Ref = useRef<HTMLDivElement | null>(null);
    const unlimitedRef = useRef<HTMLDivElement | null>(null);
    const [hasScrolledFromHash, setHasScrolledFromHash] = useState(false);
    
    useEffect(() => {
        loadPlans();
        loadActiveSubscription();
    }, []);
    
    const loadPlans = async () => {
        try {
            const subscriptionPlans = await getSubscriptionPlans();
            setAllPlans(subscriptionPlans.map(p => ({
                id: p.id,
                name: p.name,
                display_name: p.display_name,
                description: p.description,
                price_monthly: p.price_monthly,
                price_yearly: p.price_yearly,
                features: (p.features as string[]) || [],
                limits: (p.limits as Record<string, number>) || {},
                plan_category: (p as any).plan_category || null,
                checkout_url_monthly: (p as any).checkout_url_monthly || null,
                checkout_url_yearly: (p as any).checkout_url_yearly || null,
                checkout_price_monthly: (p as any).checkout_price_monthly || null,
                checkout_price_yearly: (p as any).checkout_price_yearly || null,
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
            const username = user.username;
            
            if (username) {
                logger.info(`Buscando assinatura para username: ${username}`, 'PremiumPage');
                const subscription = await getActiveSubscription(undefined, undefined, username);
                
                if (subscription) {
                    logger.info('Assinatura encontrada!', 'PremiumPage');
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
    
    // Estado para controlar a aba ativa
    // Para alunos: apenas 'b2c' e 'recharge'
    // Para academias: apenas 'b2b' e 'personal'
    const getInitialPage = (): 'b2c' | 'b2b' | 'personal' | 'recharge' => {
        if (isStudent) {
            return 'b2c'; // Alunos começam com planos individuais
        }
        return 'b2b'; // Academias começam com planos B2B
    };
    
    const [activePage, setActivePage] = useState<'b2c' | 'b2b' | 'personal' | 'recharge'>(getInitialPage());
    
    // Separar planos por categoria
    const b2cPlans = useMemo(() => {
        return allPlans.filter(p => p.plan_category === 'b2c_ai');
    }, [allPlans]);
    
    const b2bPlans = useMemo(() => {
        return allPlans.filter(p => p.plan_category === 'b2b_platform');
    }, [allPlans]);
    
    const personalPlans = useMemo(() => {
        return allPlans.filter(p => p.plan_category === 'personal_platform');
    }, [allPlans]);
    
    const rechargePlans = useMemo(() => {
        return allPlans.filter(p => p.plan_category === 'recharge');
    }, [allPlans]);

    // Rolar para a oferta específica quando vier de #/premium?product=...
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (loading || activeSubscription || hasScrolledFromHash) return;

        const hash = window.location.hash || '';
        const [, queryString] = hash.split('?');
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        const product = params.get('product');
        if (!product) return;

        let targetRef: React.RefObject<HTMLDivElement> | null = null;
        if (product === 'turbo') {
            targetRef = turboRef;
        } else if (product === 'bank_100') {
            targetRef = bank100Ref;
        } else if (product === 'unlimited_30') {
            targetRef = unlimitedRef;
        }

        if (targetRef?.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHasScrolledFromHash(true);
        }
    }, [loading, activeSubscription, hasScrolledFromHash]);
    
    const handleSubscribe = (plan: SubscriptionPlan) => {
        // Se o plano tem checkout_url, redirecionar direto para Cakto
        const checkoutUrl = (plan as any).checkout_url_monthly || (plan as any).checkout_url_yearly;
        if (checkoutUrl) {
            logger.info(`Redirecionando para checkout: ${checkoutUrl}`, 'PremiumPage');
            window.open(checkoutUrl, '_blank');
            return;
        }
        
        // Caso contrário, abrir modal de checkout
        setCheckoutModal({
            isOpen: true,
            planId: plan.id,
            planName: plan.name,
            displayName: plan.display_name,
            price: plan.price_monthly,
            priceYearly: plan.price_yearly || undefined
        });
    };

    const handleCheckoutSuccess = async () => {
        showSuccess('Assinatura ativada com sucesso!');
        setCheckoutModal(null);
        await loadActiveSubscription();
    };
    
    // Componente para renderizar um plano
    const PlanCard: React.FC<{
        plan: SubscriptionPlan;
        badge?: string;
        badgeColor?: string;
        highlight?: boolean;
        showYearlyPrice?: boolean;
    }> = ({ plan, badge, badgeColor = 'primary', highlight = false, showYearlyPrice = false }) => {
        const monthlyPrice = plan.price_monthly;
        const yearlyPrice = plan.price_yearly;
        const savings = yearlyPrice ? (monthlyPrice * 12) - yearlyPrice : 0;
        
        return (
            <Card 
                className={`flex flex-col relative hover:shadow-xl transition-all duration-300 ${
                    highlight 
                        // Importante: removido qualquer scale para evitar que o card
                        // ultrapasse o contêiner pai (que usa overflow-hidden),
                        // o que fazia o plano recomendado aparecer cortado pela metade.
                        ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50/50 to-amber-50/50 dark:from-primary-900/10 dark:to-amber-900/10'
                        : 'hover:shadow-lg'
                }`}
            >
                {badge && (
                    <div className={`absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${
                        badgeColor === 'primary' ? 'from-primary-600 to-amber-500' :
                        badgeColor === 'blue' ? 'from-blue-600 to-blue-500' :
                        'from-green-600 to-green-500'
                    } text-white text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg animate-pulse`}>
                        {badge}
                    </div>
                )}
                
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 pt-6 sm:pt-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {plan.display_name}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
                        {plan.description}
                    </p>
                    <div className="mt-3 sm:mt-4">
                        {showYearlyPrice && yearlyPrice ? (
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                        R$ {yearlyPrice.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">/ano</span>
                                </div>
                                {savings > 0 && (
                                    <div className="mt-2">
                                        <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                            Economia de R$ {savings.toFixed(2).replace('.', ',')}
                                        </span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            ou 12x de R$ {monthlyPrice.toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                    R$ {monthlyPrice.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">/mês</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <ul className="p-4 sm:p-6 space-y-2 sm:space-y-3 flex-grow">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <CheckCircleIcon className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
                                highlight ? 'text-primary-500' : 'text-slate-400'
                            }`} />
                            <span className={`text-sm sm:text-base ${
                                highlight 
                                    ? 'font-semibold text-slate-900 dark:text-white' 
                                    : 'text-slate-700 dark:text-slate-300'
                            }`}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
                
                <div className={`p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 ${
                    highlight ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                }`}>
                    <Button
                        onClick={() => handleSubscribe(plan)}
                        variant={highlight ? "primary" : "secondary"}
                        className={`w-full ${
                            highlight
                                ? 'bg-gradient-to-r from-primary-600 to-amber-500 hover:from-primary-700 hover:to-amber-600 text-white'
                                : ''
                        }`}
                        size="lg"
                    >
                        {highlight && <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                        Assinar {plan.display_name}
                    </Button>
                </div>
            </Card>
        );
    };
    
    // Componente para seção de explicação
    const HowItWorksSection: React.FC<{
        title: string;
        steps: string[];
        icon: React.ReactNode;
    }> = ({ title, steps, icon }) => (
        <Card className="mt-6 sm:mt-8">
            <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    {icon}
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                </div>
                <ol className="space-y-3">
                    {steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                                {idx + 1}
                            </span>
                            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300 pt-0.5">
                                {step}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </Card>
    );
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

                    {/* Seção de Gerenciamento de Assinatura */}
                    <Card>
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Gerenciar Assinatura
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Plano:</span>
                                            <p className="font-semibold text-slate-900 dark:text-white mt-1">
                                                {activeSubscription.plan?.display_name || activeSubscription.plan?.name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Status:</span>
                                            <p className="font-semibold text-green-600 dark:text-green-400 mt-1 capitalize">
                                                {activeSubscription.status === 'active' ? 'Ativa' : activeSubscription.status}
                                            </p>
                                        </div>
                                        {activeSubscription.current_period_end && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Próxima Renovação:</span>
                                                <p className="font-semibold text-slate-900 dark:text-white mt-1">
                                                    {new Date(activeSubscription.current_period_end).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {activeSubscription.billing_cycle && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Ciclo de Faturamento:</span>
                                                <p className="font-semibold text-slate-900 dark:text-white mt-1 capitalize">
                                                    {activeSubscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {activeSubscription.cancel_at_period_end && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            ⚠️ Sua assinatura será cancelada no fim do período pago. Você manterá acesso até{' '}
                                            {activeSubscription.current_period_end 
                                                ? new Date(activeSubscription.current_period_end).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })
                                                : 'o fim do período'}
                                            .
                                        </p>
                                    </div>
                                )}

                                {!activeSubscription.cancel_at_period_end && (
                                    <Button
                                        onClick={() => {
                                            const planName = activeSubscription.plan?.display_name || activeSubscription.plan?.name || 'Assinatura';
                                            setCancelModal({
                                                isOpen: true,
                                                subscriptionId: activeSubscription.id,
                                                subscriptionName: planName,
                                                expiryDate: activeSubscription.current_period_end,
                                                caktoPaymentId: activeSubscription.provider_payment_id || activeSubscription.cakto_payment_id,
                                            });
                                        }}
                                        variant="danger"
                                        className="w-full sm:w-auto"
                                    >
                                        Cancelar Assinatura
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="space-y-8 sm:space-y-12">
                    {/* Mensagem para alunos com trial ativo */}
                    {isStudent && !isTrialExpired && (
                        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                            <div className="p-6 text-center">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                    Você ainda está no período de teste! 🎉
                                </h2>
                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
                                    Aproveite seu trial de 3 dias. Os planos estarão disponíveis após o término do período de teste.
                                </p>
                                {user?.trialExpiresAt && (
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                                        Seu trial expira em: {new Date(user.trialExpiresAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        </Card>
                    )}
                    
                    {/* Navegação por Abas */}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                        {/* Para alunos: mostrar apenas Planos Individuais e Recargas */}
                        {isStudent ? (
                            <>
                                <button
                                    onClick={() => setActivePage('b2c')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                        activePage === 'b2c'
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Planos Individuais (IA)
                                </button>
                                <button
                                    onClick={() => setActivePage('recharge')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                        activePage === 'recharge'
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Recargas
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Para academias: mostrar apenas Planos B2B e Personal Trainers */}
                                <button
                                    onClick={() => setActivePage('b2b')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                        activePage === 'b2b'
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Planos para Academias
                                </button>
                                <button
                                    onClick={() => setActivePage('personal')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                        activePage === 'personal'
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    Personal Trainers
                                </button>
                            </>
                        )}
                    </div>

                    {/* PLANOS B2C - INDIVIDUAIS (USO DA IA) - Apenas para alunos após trial expirar */}
                    {isStudent && isTrialExpired && activePage === 'b2c' && b2cPlans.length > 0 && (
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    Planos Individuais - Uso da IA
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Escolha o plano ideal para continuar usando todas as funcionalidades de IA
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                                {b2cPlans.map((plan) => {
                                    const isPopular = plan.name === 'ai_annual_vip';
                                    return (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            badge={isPopular ? 'MAIS VANTAJOSO' : undefined}
                                            highlight={isPopular}
                                            showYearlyPrice={plan.name === 'ai_annual_vip'}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* PLANOS B2B - ACADEMIAS - Apenas para academias */}
                    {!isStudent && activePage === 'b2b' && b2bPlans.length > 0 && (
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    Planos para Academias
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Ofereça acesso Premium aos seus alunos sem custo adicional para eles
                                </p>
                            </div>
                            
                            <HowItWorksSection
                                title="Como funciona para academias"
                                steps={[
                                    '1. A academia contrata um dos planos para academias (Starter, Growth ou Pro).',
                                    '2. Após a ativação, a academia recebe um Código Mestre exclusivo (ex: ACADEMIA-XYZ).',
                                    '3. A academia compartilha esse código com os alunos (WhatsApp, redes sociais, e-mail, etc.).',
                                    '4. O aluno entra no app FitCoach.IA, informa o código e desbloqueia o acesso Premium.',
                                    '5. Enquanto a academia mantiver a assinatura ativa, os alunos continuam com acesso Premium sem custo extra.'
                                ]}
                                icon={<ChartBarIcon className="w-6 h-6 text-primary-500" />}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch mt-6">
                                {b2bPlans.map((plan) => {
                                    const isPopular = plan.name === 'growth';
                                    return (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            badge={isPopular ? 'MAIS VENDIDO' : undefined}
                                            highlight={isPopular}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* PLANOS PERSONAL TRAINERS - Apenas para academias */}
                    {!isStudent && activePage === 'personal' && personalPlans.length > 0 && (
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    Planos para Personal Trainers
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Gerencie seus alunos e ofereça treinos personalizados
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                                {personalPlans.map((plan) => {
                                    const isPopular = plan.name === 'team_15';
                                    return (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            badge={isPopular ? 'MAIS VANTAJOSO' : undefined}
                                            highlight={isPopular}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Seção de Recargas - Apenas para alunos após trial expirar */}
                    {isStudent && isTrialExpired && activePage === 'recharge' && (
                    <div>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                Recarga Instantânea
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Precisa de mais tempo de conversa? Seu plano diário acabou, mas você pode continuar com nossos pacotes de recarga instantânea.
                            </p>
                        </div>

                        {rechargePlans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                {rechargePlans.map((plan) => {
                                    const isPopular = plan.name === 'minutes_bank';
                                    return (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            badge={isPopular ? 'MELHOR ESCOLHA' : plan.name === 'help_quick' ? 'URGÊNCIA' : plan.name === 'unlimited_voice' ? 'VIP' : undefined}
                                            highlight={isPopular}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            // Fallback: Recargas hardcoded (caso não existam no banco)
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                {/* Ajuda Rápida */}
                                <Card ref={turboRef} className="flex flex-col hover:shadow-lg transition-all relative">
                                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BoltIcon className="w-6 h-6 text-yellow-500" />
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                                Ajuda Rápida
                                            </h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                                            Urgência
                                        </p>
                                        <div className="mt-3">
                                            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                                R$ 5,00
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">Pagamento Único</span>
                                        </div>
                                    </div>
                                    <ul className="p-4 sm:p-6 space-y-2 flex-grow">
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                                +20 Minutos de Voz
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                                Válido por 24h
                                            </span>
                                        </li>
                                    </ul>
                                    <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700">
                                        <Button
                                            onClick={() => window.open('https://pay.cakto.com.br/ihfy8cz_668443', '_blank', 'noopener,noreferrer')}
                                            variant="primary"
                                            className="w-full"
                                            size="lg"
                                        >
                                            Recarregar Agora
                                        </Button>
                                    </div>
                                </Card>

                                {/* Minutos de Reserva */}
                                <Card ref={bank100Ref} className="flex flex-col hover:shadow-lg transition-all relative border-2 border-primary-500 bg-gradient-to-br from-primary-50/50 to-blue-50/50 dark:from-primary-900/10 dark:to-blue-900/10">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        MELHOR ESCOLHA
                                    </div>
                                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 pt-6 sm:pt-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ChartBarIcon className="w-6 h-6 text-blue-500" />
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                                Minutos de Reserva
                                            </h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                                            Melhor Escolha
                                        </p>
                                        <div className="mt-3">
                                            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                                R$ 12,90
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">Pagamento Único</span>
                                        </div>
                                    </div>
                                    <ul className="p-4 sm:p-6 space-y-2 flex-grow">
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                                                +100 Minutos de Voz
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                                                Não expira (banco de minutos)
                                            </span>
                                        </li>
                                    </ul>
                                    <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-primary-50/50 dark:bg-primary-900/20">
                                        <Button
                                            onClick={() => window.open('https://pay.cakto.com.br/hhxugxb_668446', '_blank', 'noopener,noreferrer')}
                                            variant="primary"
                                            className="w-full bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-700 hover:to-blue-600 text-white"
                                            size="lg"
                                        >
                                            Comprar Banco de Voz
                                        </Button>
                                    </div>
                                </Card>

                                {/* Conversa Ilimitada */}
                                <Card ref={unlimitedRef} className="flex flex-col hover:shadow-lg transition-all relative">
                                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            <SparklesIcon className="w-6 h-6 text-purple-500" />
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                                Conversa Ilimitada
                                            </h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
                                            VIP
                                        </p>
                                        <div className="mt-3">
                                            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                                R$ 19,90
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400 ml-2 text-xs sm:text-sm">Pagamento Único</span>
                                        </div>
                                    </div>
                                    <ul className="p-4 sm:p-6 space-y-2 flex-grow">
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                                Ilimitado por 30 dias
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                                Remove o limite de 15 minutos diários
                                            </span>
                                        </li>
                                    </ul>
                                    <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700">
                                        <Button
                                            onClick={() => window.open('https://pay.cakto.com.br/trszqtv_668453', '_blank', 'noopener,noreferrer')}
                                            variant="primary"
                                            className="w-full"
                                            size="lg"
                                        >
                                            Liberar Acesso Total
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                    )}

                </div>
            )}

            {/* Modal de Checkout */}
            {checkoutModal && (
                <CheckoutModal
                    isOpen={checkoutModal.isOpen}
                    onClose={() => setCheckoutModal(null)}
                    planId={checkoutModal.planId}
                    planName={checkoutModal.planName}
                    displayName={checkoutModal.displayName}
                    price={checkoutModal.price}
                    priceYearly={checkoutModal.priceYearly}
                    onSuccess={handleCheckoutSuccess}
                />
            )}

            {cancelModal && (
                <CancelSubscriptionModal
                    isOpen={cancelModal.isOpen}
                    onClose={() => setCancelModal(null)}
                    subscriptionId={cancelModal.subscriptionId}
                    subscriptionName={cancelModal.subscriptionName}
                    expiryDate={cancelModal.expiryDate}
                    caktoPaymentId={cancelModal.caktoPaymentId}
                    onSuccess={() => {
                        setCancelModal(null);
                        loadActiveSubscription(); // Recarregar assinatura
                    }}
                />
            )}
        </div>
    );
};

export default PremiumPage;

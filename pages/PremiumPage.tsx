
import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { StarIcon } from '../components/icons/StarIcon';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const freeFeatures = [
    "1 Relatório IA por semana",
    "Geração de planos diários",
    "Chat com IA padrão",
    "Biblioteca de receitas",
];

const premiumFeatures = [
    "Relatórios IA ilimitados",
    "Análise de progresso avançada",
    "IA com memória longa no chat",
    "Planos de treino e suplementos",
    "Suporte prioritário",
];

const PremiumPage: React.FC = () => {
    const { user, upgradeToPremium } = useUser();
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <StarIcon className="w-16 h-16 text-amber-400 mx-auto" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4">Nutri.IA Premium</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Desbloqueie todo o potencial da IA para atingir seus objetivos mais rápido.</p>
            </div>

            {user.subscription === 'premium' ? (
                <Card>
                    <div className="p-8 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto"/>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Você já é Premium!</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Obrigado por apoiar o Nutri.IA. Aproveite todos os recursos exclusivos.</p>
                    </div>
                </Card>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    <Card className="flex flex-col">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold">Gratuito</h2>
                            <p className="text-slate-500 dark:text-slate-400">O essencial para começar.</p>
                        </div>
                        <ul className="p-6 space-y-4 flex-grow border-t border-slate-200 dark:border-slate-700">
                            {freeFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-slate-400" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="p-6">
                            <Button variant="secondary" className="w-full" disabled>Seu Plano Atual</Button>
                        </div>
                    </Card>
                    <Card className="flex flex-col border-2 border-primary-500 relative">
                         <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">MAIS POPULAR</div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Premium</h2>
                            <p className="text-slate-500 dark:text-slate-400">Resultados acelerados com IA.</p>
                        </div>
                        <ul className="p-6 space-y-4 flex-grow border-t border-slate-200 dark:border-slate-700">
                            {premiumFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                                    <span className="font-semibold">{feature}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="p-6">
                            <Button onClick={upgradeToPremium} className="w-full" size="lg">
                                <StarIcon className="w-5 h-5 mr-2" />
                                Assine Agora
                            </Button>
                         </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default PremiumPage;
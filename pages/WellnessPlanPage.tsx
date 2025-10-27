
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { generateWellnessPlan } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import type { WellnessPlan } from '../types';

const WellnessPlanSkeleton = () => (
    <div className="space-y-8">
        <Card>
            <div className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="h-5 w-1/4" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
         <Card>
            <div className="p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="h-5 w-1/3" />
                             <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    </div>
);


const WellnessPlanPage: React.FC = () => {
    const { user } = useUser();
    const [plan, setPlan] = useState<WellnessPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setPlan(null);
        try {
            const result = await generateWellnessPlan(user);
            setPlan(result);
        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao gerar o plano de bem-estar. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Plano de Bem-Estar</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Receba recomendações de treinos e suplementos da IA.</p>
            </div>

            {isLoading ? (
                <WellnessPlanSkeleton />
            ) : error ? (
                <Alert type="error" title="Erro ao Gerar Plano">
                    <p>{error}</p>
                    <Button onClick={handleGeneratePlan} className="mt-4">
                        Tentar Novamente
                    </Button>
                </Alert>
            ) : plan ? (
                <div className="space-y-8">
                    <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Plano de Treino Semanal</h2>
                            <div className="space-y-4">
                                {plan.plano_treino_semanal.map(day => (
                                    <div key={day.dia_semana} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <h3 className="font-semibold text-primary-700 dark:text-primary-400">{day.dia_semana}: <span className="text-slate-700 dark:text-slate-200">{day.foco_treino}</span></h3>
                                        <ul className="mt-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
                                            {day.exercicios.map((ex, i) => <li key={i}>{ex}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                     <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recomendações de Suplementos</h2>
                            <div className="space-y-4">
                                {plan.recomendacoes_suplementos.map(sup => (
                                    <div key={sup.nome}>
                                        <h3 className="font-semibold">{sup.nome}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400"><strong>Dosagem:</strong> {sup.dosagem_sugerida} • <strong>Horário:</strong> {sup.melhor_horario}</p>
                                        <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{sup.justificativa}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dicas Adicionais</h2>
                            <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{plan.dicas_adicionais}</p>
                        </div>
                    </Card>
                </div>
            ) : (
                <Card>
                    <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                        <HeartIcon className="w-16 h-16 text-primary-500" />
                        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Pronto para o próximo nível?</h2>
                        <p className="mt-2 mb-6 max-w-md text-slate-500 dark:text-slate-400">
                           Clique abaixo para que a Nutri.IA crie um plano de treino e suplementação personalizado para acelerar seus resultados.
                        </p>
                        <Button onClick={handleGeneratePlan} className="w-full max-w-xs" size="lg">
                            <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                            Gerar Meu Plano
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default WellnessPlanPage;

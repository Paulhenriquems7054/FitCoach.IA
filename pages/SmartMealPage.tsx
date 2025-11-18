
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { getFoodSubstitutions } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import type { FoodSubstitution } from '../types';
import { WandIcon } from '../components/icons/WandIcon';


const SmartMealPage: React.FC = () => {
    const { user } = useUser();
    const [food, setFood] = useState('');
    const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!food.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setSubstitutions([]);
        setSearched(true);

        try {
            const results = await getFoodSubstitutions(food, user);
            setSubstitutions(results);
        } catch (err) {
            setError("Ocorreu um erro ao buscar sugestões. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
             <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Refeição Inteligente</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Em dúvida sobre o que comer? Deixe a IA sugerir uma troca saudável.</p>
            </div>
            
            <Card>
                <div className="p-4 sm:p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                            type="text"
                            value={food}
                            onChange={e => setFood(e.target.value)}
                            placeholder="Ex: Pão francês com manteiga"
                            className="flex-1 block w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                        />
                        <Button type="submit" isLoading={isLoading} size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                           <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Sugerir Troca
                        </Button>
                    </form>
                </div>
            </Card>

            <div className="mt-8">
                {isLoading && (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                             <Card key={i}><div className="p-4"><Skeleton className="h-5 w-1/3 mb-2" /><Skeleton className="h-4 w-full" /></div></Card>
                        ))}
                    </div>
                )}
                {error && <Alert type="error" title="Erro">{error}</Alert>}
                {!isLoading && substitutions.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-lg sm:text-xl font-bold">Sugestões para <span className="text-primary-600">{food}</span>:</h2>
                        {substitutions.map((sub, i) => (
                            <Card key={i}>
                                <div className="p-3 sm:p-4">
                                    <h3 className="font-semibold text-base sm:text-lg">{sub.alimento_sugerido}</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{sub.justificativa}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {!isLoading && searched && substitutions.length === 0 && !error && (
                    <Card className="p-8 text-center">
                        <h3 className="text-lg font-semibold">Nenhuma sugestão encontrada</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">A IA não encontrou substituições diretas. Tente ser mais específico.</p>
                    </Card>
                )}
                {!isLoading && !searched && (
                    <Card>
                        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
                           <WandIcon className="w-12 h-12 text-primary-500" />
                            <p className="mt-4 text-slate-500 dark:text-slate-400">
                                As sugestões de troca aparecerão aqui.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default SmartMealPage;

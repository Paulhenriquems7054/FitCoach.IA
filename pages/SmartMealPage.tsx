
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { getFoodSubstitutions } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import type { FoodSubstitution } from '../types';
import { WandIcon } from '../components/icons/WandIcon';
import { logger } from '../utils/logger';


const SmartMealPage: React.FC = () => {
    const { user } = useUser();
    const { showSuccess, showError, showWarning } = useToast();
    const [food, setFood] = useState('');
    const [substitutions, setSubstitutions] = useState<FoodSubstitution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [lastSearched, setLastSearched] = useState<string>('');
    const mountedRef = useRef(true);
    
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mountedRef.current) return;
        
        const foodTrimmed = food.trim();
        
        // Validação de entrada
        if (!foodTrimmed) {
            showWarning('Por favor, digite o nome de um alimento ou refeição.');
            return;
        }
        
        if (foodTrimmed.length < 2) {
            showWarning('Por favor, digite pelo menos 2 caracteres.');
            return;
        }
        
        if (foodTrimmed.length > 100) {
            showWarning('O nome do alimento é muito longo. Tente ser mais conciso.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setSubstitutions([]);
        setSearched(true);
        setLastSearched(foodTrimmed);

        try {
            logger.info(`Buscando substituições para: ${foodTrimmed}`, 'SmartMealPage');
            
            const results = await getFoodSubstitutions(foodTrimmed, user);
            
            if (!mountedRef.current) return;
            
            // Validar resultados
            if (!results || !Array.isArray(results)) {
                throw new Error('Resposta inválida do serviço de IA.');
            }
            
            if (results.length === 0) {
                if (mountedRef.current) {
                    showWarning('Nenhuma substituição encontrada. Tente ser mais específico ou usar outro alimento.');
                }
            } else {
                if (mountedRef.current) {
                    showSuccess(`Encontradas ${results.length} sugestão${results.length !== 1 ? 'ões' : ''}! 🎉`);
                }
            }
            
            setSubstitutions(results);
        } catch (err) {
            logger.error('Erro ao buscar substituições de alimentos', 'SmartMealPage', err);
            
            if (!mountedRef.current) return;
            
            let errorMessage = 'Ocorreu um erro ao buscar sugestões.';
            
            if (err instanceof Error) {
                if (err.message.includes('Conecte-se à internet')) {
                    errorMessage = 'Conecte-se à internet para obter sugestões de substituições.';
                } else if (err.message.includes('indisponível')) {
                    errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };
    
    const handleClear = () => {
        if (!mountedRef.current) return;
        setFood('');
        setSubstitutions([]);
        setError(null);
        setSearched(false);
        setLastSearched('');
    };
    
    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
             <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Refeição Inteligente</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Em dúvida sobre o que comer? Deixe a IA sugerir uma troca saudável.</p>
            </div>
            
            <Card>
                <div className="p-4 sm:p-6">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={food}
                                onChange={e => setFood(e.target.value)}
                                placeholder="Ex: Pão francês com manteiga, batata frita, refrigerante..."
                                className="flex-1 block w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                disabled={isLoading}
                                maxLength={100}
                            />
                            <div className="flex gap-2">
                                {food && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleClear}
                                        disabled={isLoading}
                                        className="w-auto"
                                    >
                                        Limpar
                                    </Button>
                                )}
                                <Button 
                                    type="submit" 
                                    isLoading={isLoading} 
                                    size="lg" 
                                    className="w-full sm:w-auto text-sm sm:text-base flex-1 sm:flex-none"
                                    disabled={!food.trim() || isLoading}
                                >
                                   <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    {isLoading ? 'Buscando...' : 'Sugerir Troca'}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            💡 Dica: Seja específico! Exemplos: "Pão francês com manteiga", "Batata frita", "Refrigerante", "Hambúrguer"
                        </p>
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
                {error && (
                    <Alert type="error" title="Erro ao Buscar Sugestões">
                        <p className="text-sm">{error}</p>
                        {error.includes('internet') || error.includes('indisponível') ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSearch}
                                className="mt-3"
                                disabled={isLoading}
                            >
                                Tentar Novamente
                            </Button>
                        ) : null}
                    </Alert>
                )}
                {!isLoading && substitutions.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                Sugestões para <span className="text-primary-600 dark:text-primary-400">{lastSearched}</span>:
                            </h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {substitutions.length} sugestão{substitutions.length !== 1 ? 'ões' : ''}
                            </span>
                        </div>
                        {substitutions.map((sub, i) => (
                            <Card key={i} className="hover:shadow-lg transition-shadow">
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{i + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                                                {sub.alimento_sugerido}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {sub.justificativa}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {!isLoading && searched && substitutions.length === 0 && !error && (
                    <Card className="p-6 sm:p-8">
                        <div className="text-center">
                            <WandIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Nenhuma sugestão encontrada
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                A IA não encontrou substituições para <strong>{lastSearched}</strong>.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left max-w-md mx-auto">
                                <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold mb-2">💡 Dicas para melhores resultados:</p>
                                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                                    <li>Seja mais específico (ex: "pão francês branco" em vez de "pão")</li>
                                    <li>Tente usar nomes comuns de alimentos</li>
                                    <li>Mencione a forma de preparo quando relevante</li>
                                </ul>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleClear}
                                className="mt-4"
                            >
                                Tentar Outro Alimento
                            </Button>
                        </div>
                    </Card>
                )}
                {!isLoading && !searched && (
                    <Card>
                        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
                           <WandIcon className="w-16 h-16 text-primary-500 mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Descubra Substituições Saudáveis
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                                Digite o nome de um alimento ou refeição acima e deixe a IA sugerir alternativas mais saudáveis alinhadas com seu objetivo.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-left">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">🍔 Exemplo 1:</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Hambúrguer</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">🥤 Exemplo 2:</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Refrigerante</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">🍟 Exemplo 3:</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Batata frita</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default SmartMealPage;

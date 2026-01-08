
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { analyzeProgress } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { saveAppSetting } from '../services/databaseService';
import { Skeleton } from '../components/ui/Skeleton';
import { ProtectedFeature } from '../components/ProtectedFeature';
import { useToast } from '../components/ui/Toast';
import type { ProgressAnalysis } from '../types';
import { getAccountType } from '../utils/accountType';
import { getPersonalTrainerClients, getPersonalTrainerStats, type PersonalTrainerClient } from '../services/personalTrainerService';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { logger } from '../utils/logger';

const AnalysisSkeleton = () => (
    <Card>
        <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                    <Skeleton className="h-5 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                 <div>
                    <Skeleton className="h-5 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </div>
    </Card>
);

const AnalysisPage: React.FC = () => {
    const { user, updateWeightHistory } = useUser();
    const { showSuccess, showError, showWarning } = useToast();
    const accountType = getAccountType(user);
    const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newWeight, setNewWeight] = useState<string>(user.peso > 0 ? user.peso.toString() : '');
    const [isAddingWeight, setIsAddingWeight] = useState(false);
    
    // Estados para dashboard de personal trainer
    const [clients, setClients] = useState<PersonalTrainerClient[]>([]);
    const [stats, setStats] = useState<{
        totalClients: number;
        activeClients: number;
        totalWeightLoss: number;
        averageWeightLoss: number;
        clientsWithProgress: number;
    } | null>(null);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const mountedRef = useRef(true);

    const handleAnalyze = useCallback(async () => {
        if (!mountedRef.current) return;
        
        // Verificar se há histórico suficiente (pelo menos 2 registros)
        if (user.weightHistory.length < 2) {
            if (mountedRef.current) {
                setError('Adicione pelo menos 2 registros de peso para gerar uma análise.');
            }
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await analyzeProgress(user);
            
            if (!mountedRef.current) return;
            
            setAnalysis(result);
            logger.info(`Análise de progresso gerada com sucesso (tendência: ${result.tendencia_geral}, registros: ${user.weightHistory.length})`, 'AnalysisPage');
        } catch (err) {
            logger.error('Erro ao analisar progresso', 'AnalysisPage', err as Error | unknown);
            
            if (!mountedRef.current) return;
            
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao analisar seu progresso.';
            
            // Mensagens de erro mais específicas
            let displayMessage = 'Ocorreu um erro ao analisar seu progresso. Tente novamente.';
            if (errorMessage.includes('Conecte-se à internet')) {
                displayMessage = 'Conecte-se à internet para obter a análise de progresso.';
            } else if (errorMessage.includes('indisponível')) {
                displayMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.';
            }
            
            setError(displayMessage);
            showError(displayMessage);
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [user, showError]);
    
    // Auto-analyze on load if there's enough history (apenas para USER_B2C)
    useEffect(() => {
        mountedRef.current = true;
        
        if (accountType !== 'USER_PERSONAL' && user.weightHistory.length >= 2) {
            handleAnalyze().catch(err => {
                logger.error('Erro no useEffect ao analisar', 'AnalysisPage', err);
                if (mountedRef.current) {
                    setError('Ocorreu um erro ao analisar seu progresso.');
                    setIsLoading(false);
                }
            });
        }
        
        return () => {
            mountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.weightHistory.length, accountType]);

    // Carregar clientes se for personal trainer
    useEffect(() => {
        if (!mountedRef.current) return;
        
        if (accountType === 'USER_PERSONAL' && user.id) {
            setIsLoadingClients(true);
            Promise.all([
                getPersonalTrainerClients(user.id),
                getPersonalTrainerStats(user.id)
            ]).then(([clientsData, statsData]) => {
                if (mountedRef.current) {
                    setClients(clientsData);
                    setStats(statsData);
                }
            }).catch(err => {
                logger.error('Erro ao carregar clientes', 'AnalysisPage', err);
                if (mountedRef.current) {
                    showError('Erro ao carregar clientes. Tente novamente.');
                }
            }).finally(() => {
                if (mountedRef.current) {
                    setIsLoadingClients(false);
                }
            });
        }
        
        return () => {
            mountedRef.current = false;
        };
    }, [accountType, user.id, showError]);

    const handleAddWeight = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mountedRef.current) return;
        
        const weightValue = parseFloat(newWeight);
        
        // Validações
        if (isNaN(weightValue) || weightValue <= 0) {
            showWarning('Por favor, insira um peso válido maior que zero.');
            return;
        }
        
        // Validação de peso razoável (entre 30kg e 300kg)
        if (weightValue < 30 || weightValue > 300) {
            showWarning('Por favor, insira um peso entre 30kg e 300kg.');
            return;
        }
        
        setIsAddingWeight(true);
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Verificar se já existe registro para hoje
            const existingEntry = user.weightHistory.find(entry => entry.date === today);
            const isUpdate = !!existingEntry;
            
            // Atualizar histórico
            updateWeightHistory(today, weightValue);
            
            // Salvar no banco de dados
            try {
                await saveAppSetting('lastWeightCheckin', new Date().toISOString());
            } catch (error) {
                logger.warn('Erro ao salvar check-in de peso', 'AnalysisPage', error);
                // Fallback para localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('lastWeightCheckin', new Date().toISOString());
                }
            }
            
            if (!mountedRef.current) return;
            
            // Feedback visual
            if (isUpdate) {
                showSuccess(`Peso atualizado: ${weightValue.toFixed(1)} kg`);
            } else {
                showSuccess(`Peso registrado: ${weightValue.toFixed(1)} kg`);
                
                // Se agora tem 2 ou mais registros e não há análise, oferecer para analisar
                if (user.weightHistory.length === 1 && accountType !== 'USER_PERSONAL') {
                    setTimeout(() => {
                        if (mountedRef.current && window.confirm('Deseja gerar uma análise do seu progresso agora?')) {
                            handleAnalyze();
                        }
                    }, 500);
                }
            }
            
            // Limpar campo
            setNewWeight(weightValue.toString());
            
        } catch (error) {
            logger.error('Erro ao adicionar peso', 'AnalysisPage', error);
            if (mountedRef.current) {
                showError('Erro ao registrar peso. Tente novamente.');
            }
        } finally {
            if (mountedRef.current) {
                setIsAddingWeight(false);
            }
        }
    };


    // Se for personal trainer, mostrar dashboard de clientes
    if (accountType === 'USER_PERSONAL') {
        return (
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
                <div className="text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Progresso dos Alunos</h1>
                    <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Acompanhe o progresso de todos os seus clientes em um só lugar.</p>
                </div>

                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <UsersIcon className="w-8 h-8 text-primary-500" />
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total de Clientes</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalClients}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <ChartBarIcon className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Clientes Ativos</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeClients}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUpIcon className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Perda Total (kg)</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalWeightLoss.toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <SparklesIcon className="w-8 h-8 text-purple-500" />
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Média por Cliente</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.averageWeightLoss.toFixed(1)} kg</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Lista de Clientes */}
                {isLoadingClients ? (
                    <Card>
                        <div className="p-6">
                            <Skeleton className="h-8 w-1/3 mb-4" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        </div>
                    </Card>
                ) : clients.length === 0 ? (
                    <Card>
                        <div className="p-6 text-center">
                            <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">Nenhum cliente vinculado ainda.</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Compartilhe seu código de equipe para que clientes possam se vincular.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.map(client => {
                            const hasProgress = client.weightHistory && client.weightHistory.length > 1;
                            const weightChange = hasProgress ? (() => {
                                const sorted = [...client.weightHistory].sort((a, b) => 
                                    new Date(a.date).getTime() - new Date(b.date).getTime()
                                );
                                return sorted[0].weight - sorted[sorted.length - 1].weight;
                            })() : 0;

                            return (
                                <Card key={client.userId} className="hover:shadow-lg transition-shadow">
                                    <div className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            {client.photoUrl ? (
                                                <img src={client.photoUrl} alt={client.nome} className="w-12 h-12 rounded-full" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                                        {client.nome.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{client.nome}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {client.peso} kg • {client.altura} cm
                                                </p>
                                            </div>
                                        </div>
                                        {hasProgress && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Progresso:</span>
                                                    <span className={`font-semibold ${weightChange > 0 ? 'text-green-600 dark:text-green-400' : weightChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {weightChange > 0 ? '-' : weightChange < 0 ? '+' : ''}{Math.abs(weightChange).toFixed(1)} kg
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${weightChange > 0 ? 'bg-green-500' : weightChange < 0 ? 'bg-red-500' : 'bg-slate-400'}`}
                                                            style={{ width: `${Math.min(100, Math.abs(weightChange) * 10)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {!hasProgress && (
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Aguardando primeiro registro de peso</p>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Para USER_B2C e USER_GYM, mostrar análise pessoal
    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
             <div className="text-center">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Análise de Progresso</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Registre seu peso e veja a análise da IA sobre sua evolução.</p>
            </div>

            <Card>
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-bold">Histórico de Peso</h2>
                        {user.weightHistory.length > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {user.weightHistory.length} registro{user.weightHistory.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    {user.weightHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <TrendingUpIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nenhum registro de peso ainda</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Adicione seu primeiro registro abaixo</p>
                        </div>
                    ) : user.weightHistory.length === 1 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <TrendingUpIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Peso atual: <strong>{user.weightHistory[0].weight.toFixed(1)} kg</strong>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                Adicione mais um registro para ver o gráfico de evolução
                            </p>
                        </div>
                    ) : (
                        <div className="mt-3 sm:mt-4 overflow-x-auto" style={{ width: '100%', minHeight: 250 }}>
                            <ResponsiveContainer width="100%" height={250} minHeight={250}>
                                <LineChart data={user.weightHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="rgb(100 116 139)" 
                                        fontSize={12}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                        }}
                                    />
                                    <YAxis 
                                        stroke="rgb(100 116 139)" 
                                        domain={['dataMin - 2', 'dataMax + 2']} 
                                        fontSize={12}
                                        tickFormatter={(value) => `${value} kg`}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                                            borderColor: 'rgb(51 65 85)',
                                            color: '#fff',
                                            borderRadius: '0.5rem',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                                        labelFormatter={(label) => {
                                            const date = new Date(label);
                                            return date.toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            });
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="weight" 
                                        name="Peso (kg)" 
                                        stroke="rgb(34 197 94)" 
                                        strokeWidth={2}
                                        dot={{ fill: 'rgb(34 197 94)', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <form onSubmit={handleAddWeight} className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex-1">
                            <label htmlFor="newWeight" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Registrar peso de hoje (kg)
                            </label>
                            <input
                                type="number"
                                id="newWeight"
                                step="0.1"
                                min="30"
                                max="300"
                                value={newWeight}
                                onChange={e => {
                                    const value = e.target.value;
                                    // Permitir apenas números e um ponto decimal
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setNewWeight(value);
                                    }
                                }}
                                placeholder="Ex: 75.5"
                                className="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {user.weightHistory.length > 0 && (() => {
                                    const lastEntry = user.weightHistory[user.weightHistory.length - 1];
                                    const lastDate = new Date(lastEntry.date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    lastDate.setHours(0, 0, 0, 0);
                                    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    if (daysDiff === 0) {
                                        return `Último registro: Hoje (${lastEntry.weight.toFixed(1)} kg)`;
                                    } else if (daysDiff === 1) {
                                        return `Último registro: Ontem (${lastEntry.weight.toFixed(1)} kg)`;
                                    } else {
                                        return `Último registro: há ${daysDiff} dias (${lastEntry.weight.toFixed(1)} kg)`;
                                    }
                                })()}
                            </p>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isAddingWeight || !newWeight || parseFloat(newWeight) <= 0}
                            className="w-full sm:w-auto text-sm sm:text-base"
                        >
                            {isAddingWeight ? 'Registrando...' : user.weightHistory.some(entry => entry.date === new Date().toISOString().split('T')[0]) ? 'Atualizar Registro' : 'Adicionar Registro'}
                        </Button>
                    </form>
                </div>
            </Card>

            <ProtectedFeature feature="workoutAnalysis">
                <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-center flex-1">Análise do FitCoach.IA</h2>
                        {user.weightHistory.length >= 2 && !isLoading && (
                            <Button
                                onClick={handleAnalyze}
                                disabled={isLoading}
                                variant="secondary"
                                size="sm"
                                className="ml-4"
                            >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                {analysis ? 'Re-analisar' : 'Gerar Análise'}
                            </Button>
                        )}
                    </div>
                    {user.weightHistory.length < 2 ? (
                        <Card className="flex flex-col items-center justify-center min-h-[200px] p-4 sm:p-6 text-center">
                            <TrendingUpIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mb-3" />
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-2">
                                Adicione pelo menos <strong>2 registros de peso</strong> para gerar uma análise.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                Atualmente você tem {user.weightHistory.length} registro{user.weightHistory.length !== 1 ? 's' : ''}.
                            </p>
                        </Card>
                    ) : isLoading ? (
                        <AnalysisSkeleton />
                    ) : error ? (
                        <Alert type="error" title="Erro na Análise">
                            <p className="text-sm sm:text-base mb-4">{error}</p>
                            {user.weightHistory.length >= 2 && (
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isLoading}
                                    variant="secondary"
                                    size="sm"
                                >
                                    Tentar Novamente
                                </Button>
                            )}
                        </Alert>
                    ) : analysis ? (
                        <Card>
                            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                {/* Badge de tendência */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {analysis.tendencia_geral === 'positiva' && (
                                            <span className="px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                                                <TrendingUpIcon className="w-4 h-4" />
                                                Tendência Positiva
                                            </span>
                                        )}
                                        {analysis.tendencia_geral === 'negativa' && (
                                            <span className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full flex items-center gap-1">
                                                <TrendingUpIcon className="w-4 h-4 rotate-180" />
                                                Tendência Negativa
                                            </span>
                                        )}
                                        {analysis.tendencia_geral === 'estagnada' && (
                                            <span className="px-3 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1">
                                                Tendência Estagnada
                                            </span>
                                        )}
                                    </div>
                                    {user.weightHistory.length > 0 && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {user.weightHistory.length} registro{user.weightHistory.length !== 1 ? 's' : ''} analisado{user.weightHistory.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-base sm:text-lg text-primary-700 dark:text-primary-400 mb-2">Análise Geral</h3>
                                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{analysis.analise_texto}</p>
                                </div>
                                
                                <div className="p-3 sm:p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg border border-sky-200 dark:border-sky-800">
                                    <h4 className="font-semibold text-sm sm:text-base text-sky-900 dark:text-sky-100 mb-2 flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" />
                                        Projeção para Próxima Semana
                                    </h4>
                                    <p className="text-xs sm:text-sm text-sky-800 dark:text-sky-200">{analysis.projecao_proxima_semana}</p>
                                </div>
                                
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                        <h4 className="font-semibold text-sm sm:text-base text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                                            <TrendingUpIcon className="w-4 h-4" />
                                            Pontos Fortes
                                        </h4>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-green-700 dark:text-green-200 mt-2 space-y-1.5">
                                            {analysis.pontos_fortes.map((item, i) => (
                                                <li key={i} className="leading-relaxed">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                         <h4 className="font-semibold text-sm sm:text-base text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4" />
                                            Áreas para Melhoria
                                        </h4>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-amber-700 dark:text-amber-200 mt-2 space-y-1.5">
                                            {analysis.areas_melhoria.map((item, i) => (
                                                <li key={i} className="leading-relaxed">{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                 </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="flex flex-col items-center justify-center min-h-[200px] p-4 sm:p-6 text-center">
                            <TrendingUpIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mb-3" />
                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
                                Você tem {user.weightHistory.length} registro{user.weightHistory.length !== 1 ? 's' : ''} de peso. Clique em "Gerar Análise" para ver sua análise personalizada.
                            </p>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isLoading || user.weightHistory.length < 2}
                                variant="secondary"
                            >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                Gerar Análise
                            </Button>
                        </Card>
                    )}
                </div>
            </ProtectedFeature>
        </div>
    );
};

export default AnalysisPage;

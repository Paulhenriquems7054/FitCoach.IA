
import React, { useState, useEffect } from 'react';
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
    const accountType = getAccountType(user);
    const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newWeight, setNewWeight] = useState<string>(user.peso.toString());
    
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

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeProgress(user);
            setAnalysis(result);
        } catch (err) {
            setError('Ocorreu um erro ao analisar seu progresso. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Auto-analyze on load if there's enough history (apenas para USER_B2C)
    useEffect(() => {
        if (accountType !== 'USER_PERSONAL' && user.weightHistory.length > 1) {
            handleAnalyze();
        }
    }, [user.weightHistory, accountType]);

    // Carregar clientes se for personal trainer
    useEffect(() => {
        if (accountType === 'USER_PERSONAL' && user.id) {
            setIsLoadingClients(true);
            Promise.all([
                getPersonalTrainerClients(user.id),
                getPersonalTrainerStats(user.id)
            ]).then(([clientsData, statsData]) => {
                setClients(clientsData);
                setStats(statsData);
            }).catch(err => {
                logger.error('Erro ao carregar clientes', 'AnalysisPage', err);
            }).finally(() => {
                setIsLoadingClients(false);
            });
        }
    }, [accountType, user.id]);

    const handleAddWeight = async (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = parseFloat(newWeight);
        if (weightValue > 0) {
            const today = new Date().toISOString().split('T')[0];
            updateWeightHistory(today, weightValue);
            // Salvar no banco de dados
            try {
                await saveAppSetting('lastWeightCheckin', new Date().toISOString());
            } catch (error) {
                // Fallback para localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('lastWeightCheckin', new Date().toISOString());
                }
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
                    <h2 className="text-base sm:text-lg font-bold">Histórico de Peso</h2>
                    <div className="mt-3 sm:mt-4 overflow-x-auto" style={{ width: '100%', minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height={250} minHeight={250}>
                            <LineChart data={user.weightHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="date" stroke="rgb(100 116 139)" fontSize={12} />
                                <YAxis stroke="rgb(100 116 139)" domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                                        borderColor: 'rgb(51 65 85)',
                                        color: '#fff',
                                        borderRadius: '0.5rem',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="rgb(34 197 94)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <form onSubmit={handleAddWeight} className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex-1">
                            <label htmlFor="newWeight" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Registrar peso de hoje (kg)</label>
                            <input
                                type="number"
                                id="newWeight"
                                step="0.1"
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                            />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">Adicionar Registro</Button>
                    </form>
                </div>
            </Card>

            <ProtectedFeature feature="workoutAnalysis">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Análise do FitCoach.IA</h2>
                    {isLoading ? (
                        <AnalysisSkeleton />
                    ) : error ? (
                        <Alert type="error" title="Erro na Análise">
                            <p className="text-sm sm:text-base">{error}</p>
                        </Alert>
                    ) : analysis ? (
                        <Card>
                            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                <div>
                                    <h3 className="font-semibold text-base sm:text-lg text-primary-700 dark:text-primary-400">Análise Geral</h3>
                                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">{analysis.analise_texto}</p>
                                </div>
                                <p className="text-xs sm:text-sm p-3 bg-sky-50 dark:bg-sky-900/50 rounded-lg"><strong>Projeção:</strong> {analysis.projecao_proxima_semana}</p>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                        <h4 className="font-semibold text-sm sm:text-base text-green-800 dark:text-green-300">Pontos Fortes</h4>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-green-700 dark:text-green-200 mt-2 space-y-1">
                                            {analysis.pontos_fortes.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                         <h4 className="font-semibold text-sm sm:text-base text-amber-800 dark:text-amber-300">Áreas para Melhoria</h4>
                                        <ul className="list-disc list-inside text-xs sm:text-sm text-amber-700 dark:text-amber-200 mt-2 space-y-1">
                                            {analysis.areas_melhoria.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                 </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="flex flex-col items-center justify-center min-h-[200px] p-4 sm:p-6 text-center">
                            <TrendingUpIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400">Adicione mais registros de peso para que a IA possa analisar seu progresso.</p>
                        </Card>
                    )}
                </div>
            </ProtectedFeature>
        </div>
    );
};

export default AnalysisPage;

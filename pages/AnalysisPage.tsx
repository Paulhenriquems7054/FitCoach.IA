
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { analyzeProgress } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { saveAppSetting } from '../services/databaseService';
import { Skeleton } from '../components/ui/Skeleton';
import type { ProgressAnalysis } from '../types';

const AnalysisSkeleton = () => (
    <Card>
        <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-2 gap-4 pt-4">
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
    const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [newWeight, setNewWeight] = useState<string>(user.peso.toString());

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
    
    // Auto-analyze on load if there's enough history
    useEffect(() => {
        if (user.weightHistory.length > 1) {
            handleAnalyze();
        }
    }, [user.weightHistory]);

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


    return (
        <div className="max-w-4xl mx-auto space-y-8">
             <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Análise de Progresso</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Registre seu peso e veja a análise da IA sobre sua evolução.</p>
            </div>

            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-bold">Histórico de Peso</h2>
                    <div style={{ width: '100%', height: 300 }} className="mt-4">
                        <ResponsiveContainer>
                            <LineChart data={user.weightHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="date" stroke="rgb(100 116 139)" />
                                <YAxis stroke="rgb(100 116 139)" domain={['dataMin - 2', 'dataMax + 2']} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                                        borderColor: 'rgb(51 65 85)',
                                        color: '#fff',
                                        borderRadius: '0.5rem'
                                    }} 
                                />
                                <Legend />
                                <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="rgb(34 197 94)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <form onSubmit={handleAddWeight} className="mt-6 flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div>
                            <label htmlFor="newWeight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Registrar peso de hoje (kg)</label>
                            <input
                                type="number"
                                id="newWeight"
                                step="0.1"
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                            />
                        </div>
                        <Button type="submit">Adicionar Registro</Button>
                    </form>
                </div>
            </Card>

             <div>
                <h2 className="text-2xl font-bold text-center mb-4">Análise da Nutri.IA</h2>
                {isLoading ? (
                    <AnalysisSkeleton />
                ) : error ? (
                    <Alert type="error" title="Erro na Análise">{error}</Alert>
                ) : analysis ? (
                    <Card>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-400">Análise Geral</h3>
                                <p className="text-slate-600 dark:text-slate-300">{analysis.analise_texto}</p>
                            </div>
                            <p className="text-sm p-3 bg-sky-50 dark:bg-sky-900/50 rounded-lg"><strong>Projeção:</strong> {analysis.projecao_proxima_semana}</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                    <h4 className="font-semibold text-green-800 dark:text-green-300">Pontos Fortes</h4>
                                    <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-200 mt-2">
                                        {analysis.pontos_fortes.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                     <h4 className="font-semibold text-amber-800 dark:text-amber-300">Áreas para Melhoria</h4>
                                    <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-200 mt-2">
                                        {analysis.areas_melhoria.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                             </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
                        <TrendingUpIcon className="w-12 h-12 text-slate-400" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">Adicione mais registros de peso para que a IA possa analisar seu progresso.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AnalysisPage;

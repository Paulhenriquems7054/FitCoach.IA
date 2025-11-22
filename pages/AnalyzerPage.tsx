import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CameraIcon } from '../components/icons/CameraIcon';
import { ImageUploader } from '../components/ImageUploader';
import { useUser } from '../context/UserContext';
import { analyzeMealPhoto } from '../services/geminiService';
import type { MealAnalysisResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { checkAndResetLimits, incrementPhotoAnalysisCount, getPhotosAnalyzedToday } from '../services/usageLimitsService';
import { useToast } from '../components/ui/Toast';


const AnalysisSkeleton = () => (
    <Card>
        <div className="p-6 space-y-6">
            <div>
                <Skeleton className="h-5 w-1/2 mb-3" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <div>
                <Skeleton className="h-5 w-1/2 mb-3" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        </div>
    </Card>
);


const AnalyzerPage: React.FC = () => {
    const { user, setUser, addPoints } = useUser();
    const { canAnalyzePhoto, getLimitMessage, isPremium } = usePremiumAccess();
    const { showError, showWarning } = useToast();
    const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; } | null>(null);
    const [analysis, setAnalysis] = useState<MealAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar e resetar limites ao carregar (apenas uma vez)
    useEffect(() => {
        setUser(prevUser => {
            const updatedUser = checkAndResetLimits(prevUser);
            // Só atualizar se realmente mudou
            if (JSON.stringify(updatedUser.usageLimits) !== JSON.stringify(prevUser.usageLimits)) {
                return updatedUser;
            }
            return prevUser;
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const photosAnalyzedToday = getPhotosAnalyzedToday(user);

    const handleImageUpload = (base64: string, mimeType: string) => {
        setSelectedImage({ base64, mimeType });
        setAnalysis(null);
        setError(null);
    };

    const handleImageRemove = () => {
        setSelectedImage(null);
        setAnalysis(null);
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        // Verificar limite de análises
        if (!canAnalyzePhoto(photosAnalyzedToday)) {
            const limitMessage = getLimitMessage('análise de fotos', '3 análises por dia');
            setError(limitMessage);
            showWarning(limitMessage);
            showError('Erro ao analisar foto. Tente novamente.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeMealPhoto(selectedImage.base64, selectedImage.mimeType);
            setAnalysis(result);
            
            // Incrementar contador de análises
            const updatedUser = incrementPhotoAnalysisCount(user);
            setUser(updatedUser);
            
            addPoints(20); // Award more points for photo analysis
        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro ao analisar sua refeição. Tente novamente com uma imagem mais clara.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Analisador de Prato com IA</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Envie uma foto da sua refeição e deixe o FitCoach.IA analisá-la para você.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white text-center md:text-left">1. Envie sua Foto</h2>
                    <Card>
                        <div className="p-6 space-y-4">
                            <ImageUploader onImageUpload={handleImageUpload} onImageRemove={handleImageRemove} />
                            <Button
                                onClick={handleAnalyze}
                                disabled={!selectedImage || isLoading}
                                isLoading={isLoading}
                                className="w-full"
                                size="lg"
                            >
                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                Analisar com IA
                            </Button>
                        </div>
                    </Card>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white text-center md:text-left">2. Veja a Análise</h2>
                    {isLoading ? (
                         <AnalysisSkeleton />
                    ) : error ? (
                        <Alert type="error" title="Erro na Análise">
                            <p className="text-sm sm:text-base">{error}</p>
                        </Alert>
                    ) : analysis ? (
                        <Card>
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                <div>
                                    <h3 className="font-semibold text-sm sm:text-base text-primary-700 dark:text-primary-400">Alimentos Identificados</h3>
                                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                        {analysis.alimentos_identificados.map(item => (
                                            <li key={item.alimento}><strong>{item.alimento}:</strong> {item.quantidade_estimada}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center">
                                    <div className="p-2 sm:p-3 bg-sky-100 dark:bg-sky-900/50 rounded-lg">
                                        <p className="text-xs text-sky-600 dark:text-sky-300">Calorias</p>
                                        <p className="text-base sm:text-lg font-bold text-sky-800 dark:text-sky-200">{analysis.estimativa_nutricional.total_calorias}</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                                        <p className="text-xs text-rose-600 dark:text-rose-300">Proteínas</p>
                                        <p className="text-base sm:text-lg font-bold text-rose-800 dark:text-rose-200">{analysis.estimativa_nutricional.total_proteinas_g}g</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                        <p className="text-xs text-amber-600 dark:text-amber-300">Carbs</p>
                                        <p className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-200">{analysis.estimativa_nutricional.total_carboidratos_g}g</p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                        <p className="text-xs text-indigo-600 dark:text-indigo-300">Gorduras</p>
                                        <p className="text-base sm:text-lg font-bold text-indigo-800 dark:text-indigo-200">{analysis.estimativa_nutricional.total_gorduras_g}g</p>
                                    </div>
                                </div>
                                <div>
                                     <h3 className="font-semibold text-sm sm:text-base text-primary-700 dark:text-primary-400">Avaliação do FitCoach.IA</h3>
                                     <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{analysis.avaliacao_geral}</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                         <Card className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-none hover:shadow-none hover:-translate-y-0">
                            <CameraIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                             <p className="mt-4 text-slate-500 dark:text-slate-400">A análise da sua refeição aparecerá aqui.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzerPage;

import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { generateWeeklyReport } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { StarIcon } from '../components/icons/StarIcon';
import { useI18n } from '../context/I18nContext';


const ReportSkeleton = () => (
    <Card>
        <div className="p-6 md:p-8 space-y-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <br/>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
             <br/>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    </Card>
);

const ReportsPage: React.FC = () => {
    const { user, addPoints } = useUser();
    const { t } = useI18n();
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [reportCount, setReportCount] = useState<number>(0);

    const canGenerateReport = user.subscription === 'premium' || reportCount < 1;

    const handleGenerateReport = async () => {
        if (!canGenerateReport) return;

        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await generateWeeklyReport(user);
            setReport(result);
            setReportCount(prev => prev + 1);
            if(reportCount === 0) addPoints(15);
        } catch (err) {
            console.error(err);
            setError(t('reports.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('reports.subtitle')}</p>
            </div>

            {isLoading ? (
                <ReportSkeleton />
            ) : error ? (
                <Alert type="error" title={t('reports.error.title')}>
                    <p>{error}</p>
                    <Button onClick={handleGenerateReport} className="mt-4">
                        {t('reports.error.retry')}
                    </Button>
                </Alert>
            ) : report ? (
                <Card>
                    <div className="p-6 md:p-8 space-y-4 prose prose-slate dark:prose-invert max-w-none">
                        {report.split('\n').map((line, index) => {
                             if (line.startsWith('**') && line.endsWith('**')) {
                                return <h3 key={index}>{line.replace(/\*\*/g, '')}</h3>
                             }
                             if(line.trim() === '') return <br key={index} />
                             return <p key={index}>{line}</p>
                        })}
                    </div>
                </Card>
            ) : (
                <Card>
                    <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                        <ChartBarIcon className="w-16 h-16 text-primary-500" />
                        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">{t('reports.initial.title')}</h2>
                        <p className="mt-2 mb-6 max-w-md text-slate-500 dark:text-slate-400">
                           {t('reports.initial.description')}
                        </p>
                        {canGenerateReport ? (
                            <Button onClick={handleGenerateReport} className="w-full max-w-xs" size="lg">
                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                {t('reports.initial.button')}
                            </Button>
                        ) : (
                            <div className="w-full max-w-md space-y-4">
                                <Alert type="info" title={t('reports.limit.title')}>
                                    <p>{t('reports.limit.description')}</p>
                                </Alert>
                                <Button
                                    onClick={() => window.location.hash = '/premium'}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                    size="lg"
                                >
                                    <StarIcon className="-ml-1 mr-2 h-5 w-5" />
                                    {t('reports.limit.button')}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ReportsPage;
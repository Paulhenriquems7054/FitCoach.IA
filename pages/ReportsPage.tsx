
import React, { useMemo, useRef, useState, useEffect } from 'react';
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
import { useToast } from '../components/ui/Toast';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { checkAndResetLimits, incrementReportCount, getReportsGeneratedThisWeek } from '../services/usageLimitsService';

const REPORT_NAME = 'Relatório Semanal';

const ReportSkeleton = () => (
    <Card>
        <div className="p-6 md:p-8 space-y-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <br />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <br />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    </Card>
);

const ReportsPage: React.FC = () => {
    const { user, setUser, addPoints } = useUser();
    const { t } = useI18n();
    const { showSuccess, showError, showWarning } = useToast();
    const { canGenerateReport: canGenerate, getLimitMessage, isPremium } = usePremiumAccess();
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

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

    const reportsGeneratedThisWeek = getReportsGeneratedThisWeek(user);
    const canGenerateReport = canGenerate(reportsGeneratedThisWeek);

    const localeDateTime = useMemo(
        () =>
            new Date().toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short'
            }),
        []
    );

    const weightHistoryMetrics = useMemo(() => {
        const total = user.weightHistory.length;
        const lastEntry = user.weightHistory.at(-1);
        const firstEntry = user.weightHistory[0];
        const variation =
            lastEntry && firstEntry ? (lastEntry.weight - firstEntry.weight).toFixed(1) : '0';

        return [
            { label: 'Total de check-ins', value: total },
            { label: 'Peso atual', value: lastEntry ? `${lastEntry.weight} kg` : '—' },
            { label: 'Variação no período', value: `${variation} kg` },
            { label: 'Pontuação de disciplina', value: `${user.disciplineScore}%` }
        ];
    }, [user.disciplineScore, user.weightHistory]);

    const handleGenerateReport = async () => {
        if (!canGenerateReport) {
            const limitMessage = getLimitMessage('relatórios', '1 relatório por semana');
            setError(limitMessage);
            showWarning(limitMessage);
            showError('Erro ao gerar relatório. Tente novamente.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await generateWeeklyReport(user);
            setReport(result);
            
            // Incrementar contador de relatórios
            const updatedUser = incrementReportCount(user);
            setUser(updatedUser);
            
            if (reportsGeneratedThisWeek === 0) {
                addPoints(15);
                showSuccess('Relatório gerado com sucesso! Você ganhou 15 pontos.');
            } else {
                showSuccess('Relatório gerado com sucesso!');
            }
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.message?.includes('API key') 
                ? 'Chave de API não configurada. O relatório foi gerado em modo offline.'
                : t('reports.error.generic');
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = async (nomeRelatorio: string) => {
        // Exportação de PDF sempre disponível

        if (!reportRef.current) {
            showError('Erro ao exportar PDF. Tente novamente.');
            return;
        }

        try {
            const { default: html2pdf } = await import('html2pdf.js');
            const dataFormatada = new Date().toISOString().split('T')[0];

            await html2pdf()
                .set({
                    margin: [10, 12, 10, 12],
                    filename: `relatorio_${nomeRelatorio.toLowerCase().replace(/\s+/g, '_')}_${dataFormatada}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                })
                .from(reportRef.current)
                .save();
            showSuccess('PDF exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            showError('Erro ao exportar PDF. Tente novamente.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">{t('reports.subtitle')}</p>
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
                <>
                    <div className="flex justify-end mb-4">
                        <Button variant="secondary" onClick={() => exportPDF(REPORT_NAME)}>
                            Exportar PDF
                        </Button>
                    </div>
                    <Card>
                        <div
                            ref={reportRef}
                            className="p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        >
                            <header className="border-b border-slate-200 dark:border-slate-700 pb-4">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            📋 {REPORT_NAME}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Sistema de Gestão de Clínica • Relatório gerado em: {localeDateTime}
                                        </p>
                                    </div>
                                    <dl className="text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex gap-2 md:justify-end">
                                            <dt className="font-semibold">Usuário:</dt>
                                            <dd>{user.isAnonymized ? t('anonymous_user') : user.nome}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </header>

                            <section>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Resumo da Semana
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {weightHistoryMetrics.map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4"
                                        >
                                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                {metric.label}
                                            </p>
                                            <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Histórico de Peso
                                </h3>
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 -mx-2 sm:mx-0">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs sm:text-sm">
                                        <thead className="bg-slate-800 text-white">
                                            <tr>
                                                <th className="px-3 sm:px-4 py-2 text-left font-semibold">Data</th>
                                                <th className="px-3 sm:px-4 py-2 text-left font-semibold">Peso (kg)</th>
                                                <th className="px-3 sm:px-4 py-2 text-left font-semibold">Observações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {user.weightHistory.map((entry, index) => (
                                                <tr
                                                    key={`${entry.date}-${index}`}
                                                    className={
                                                        index % 2 === 0
                                                            ? 'bg-white dark:bg-slate-900'
                                                            : 'bg-slate-50 dark:bg-slate-800/60'
                                                    }
                                                >
                                                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                                                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">{entry.weight} kg</td>
                                                    <td className="px-3 sm:px-4 py-2 text-slate-500 dark:text-slate-400">
                                                        —
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Análise do FitCoach.IA
                                </h3>
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    {report.split('\n').map((line, index) => {
                                        if (line.startsWith('**') && line.endsWith('**')) {
                                            return (
                                                <h4
                                                    key={index}
                                                    className="uppercase tracking-wide text-primary-600 dark:text-primary-400"
                                                >
                                                    {line.replace(/\*\*/g, '')}
                                                </h4>
                                            );
                                        }
                                        if (line.trim() === '') return <br key={index} />;
                                        return <p key={index}>{line}</p>;
                                    })}
                                </div>
                            </section>

                            <footer className="border-t border-slate-200 dark:border-slate-700 pt-4 text-sm text-slate-500 dark:text-slate-400">
                                Sistema de Gestão de Clínica - {REPORT_NAME} • {localeDateTime} • Total de
                                registros: {user.weightHistory.length} itens
                            </footer>
                        </div>
                    </Card>
                </>
            ) : (
                <Card>
                    <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                        <ChartBarIcon className="w-16 h-16 text-primary-500" />
                        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {t('reports.initial.title')}
                        </h2>
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
                                    onClick={handleGenerateReport}
                                    className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                                    size="lg"
                                >
                                    <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                    {t('reports.initial.button')}
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
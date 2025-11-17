
import React, { useMemo, useRef, useState } from 'react';
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
    const { user, addPoints } = useUser();
    const { t } = useI18n();
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [reportCount, setReportCount] = useState<number>(0);
    const reportRef = useRef<HTMLDivElement>(null);

    const canGenerateReport = user.subscription === 'premium' || reportCount < 1;

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
        if (!canGenerateReport) return;

        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await generateWeeklyReport(user);
            setReport(result);
            setReportCount((prev) => prev + 1);
            if (reportCount === 0) addPoints(15);
        } catch (err) {
            console.error(err);
            setError(t('reports.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = async (nomeRelatorio: string) => {
        if (!reportRef.current) return;

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
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Resumo da Semana
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {weightHistoryMetrics.map((metric) => (
                                        <div
                                            key={metric.label}
                                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4"
                                        >
                                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                {metric.label}
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Histórico de Peso
                                </h3>
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                        <thead className="bg-slate-800 text-white">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold">Data</th>
                                                <th className="px-4 py-2 text-left font-semibold">Peso (kg)</th>
                                                <th className="px-4 py-2 text-left font-semibold">Observações</th>
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
                                                    <td className="px-4 py-2">
                                                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-4 py-2">{entry.weight} kg</td>
                                                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
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
                                    Análise da Nutri.IA
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
                                    onClick={() => (window.location.hash = '/premium')}
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
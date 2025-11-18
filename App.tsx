
import React, { Suspense, lazy } from 'react';
import { Layout } from './components/layout/Layout';
import { useRouter } from './hooks/useRouter';
import { Skeleton } from './components/ui/Skeleton';
import { Card } from './components/ui/Card';
import { ToastProvider } from './components/ui/Toast';

// Lazy load das páginas para reduzir o bundle inicial
const HomePage = lazy(() => import('./pages/HomePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AnalyzerPage = lazy(() => import('./pages/AnalyzerPage'));
const GeneratorPage = lazy(() => import('./pages/GeneratorPage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WellnessPlanPage = lazy(() => import('./pages/WellnessPlanPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const SmartMealPage = lazy(() => import('./pages/SmartMealPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ProfessionalDashboardPage = lazy(() => import('./pages/ProfessionalDashboardPage'));
const PresentationPage = lazy(() => import('./pages/PresentationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const WelcomeSurveyPage = lazy(() => import('./pages/WelcomeSurveyPage'));

// Componente de loading
const PageLoader = () => (
    <div className="container mx-auto px-4 py-8">
        <Card>
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </Card>
    </div>
);

const App: React.FC = () => {
    const { path } = useRouter();

    const renderPage = () => {
        switch (path) {
            case '/generator': return <GeneratorPage />;
            case '/analyzer': return <AnalyzerPage />;
            case '/reports': return <ReportsPage />;
            case '/desafios': return <ChallengesPage />;
            case '/biblioteca': return <LibraryPage />;
            case '/perfil': return <ProfilePage />;
            case '/configuracoes': return <SettingsPage />;
            case '/wellness': return <WellnessPlanPage />;
            case '/analysis': return <AnalysisPage />;
            case '/smart-meal': return <SmartMealPage />;
            case '/privacy': return <PrivacyPage />;
            case '/professional': return <ProfessionalDashboardPage />;
            case '/':
            default:
                return <HomePage />;
        }
    };

    if (path === '/presentation') {
        return (
            <Suspense fallback={<PageLoader />}>
                <PresentationPage />
            </Suspense>
        );
    }

    if (path === '/welcome-survey') {
        return (
            <Suspense fallback={<PageLoader />}>
                <WelcomeSurveyPage />
            </Suspense>
        );
    }

    if (path === '/login') {
        return (
            <ToastProvider>
                <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                </Suspense>
            </ToastProvider>
        );
    }

    return (
        <ToastProvider>
            <Layout>
                <Suspense fallback={<PageLoader />}>
                    {renderPage()}
                </Suspense>
            </Layout>
        </ToastProvider>
    );
};

export default App;
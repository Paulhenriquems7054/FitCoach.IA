
import React from 'react';
import { Layout } from './components/layout/Layout';
import { useRouter } from './hooks/useRouter';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';
import AnalyzerPage from './pages/AnalyzerPage';
import GeneratorPage from './pages/GeneratorPage';
import ChallengesPage from './pages/ChallengesPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import WellnessPlanPage from './pages/WellnessPlanPage';
import AnalysisPage from './pages/AnalysisPage';
import SmartMealPage from './pages/SmartMealPage';
import PrivacyPage from './pages/PrivacyPage';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import PremiumPage from './pages/PremiumPage';
import PresentationPage from './pages/PresentationPage';
import LoginPage from './pages/LoginPage';
import WelcomeSurveyPage from './pages/WelcomeSurveyPage';

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
            case '/premium': return <PremiumPage />;
            case '/':
            default:
                return <HomePage />;
        }
    };

    if (path === '/presentation') {
        return <PresentationPage />;
    }

    if (path === '/welcome-survey') {
        return <WelcomeSurveyPage />;
    }

    if (path === '/login') {
        return <LoginPage />;
    }

    return (
        <Layout>
            {renderPage()}
        </Layout>
    );
};

export default App;
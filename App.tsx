
import React from 'react';
import { Layout } from './components/layout/Layout';
import { useRouter } from './hooks/useRouter';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import AnalyzerPage from './pages/AnalyzerPage';
import GeneratorPage from './pages/GeneratorPage';
import ChallengesPage from './pages/ChallengesPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import CommunityPage from './pages/CommunityPage';
import WellnessPlanPage from './pages/WellnessPlanPage';
import AnalysisPage from './pages/AnalysisPage';
import SmartMealPage from './pages/SmartMealPage';
import PrivacyPage from './pages/PrivacyPage';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import PremiumPage from './pages/PremiumPage';

const App: React.FC = () => {
    const { path } = useRouter();

    const renderPage = () => {
        switch (path) {
            case '/generator': return <GeneratorPage />;
            case '/analyzer': return <AnalyzerPage />;
            case '/chat': return <ChatPage />;
            case '/reports': return <ReportsPage />;
            case '/desafios': return <ChallengesPage />;
            case '/biblioteca': return <LibraryPage />;
            case '/comunidade': return <CommunityPage />;
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

    return (
        <Layout>
            {renderPage()}
        </Layout>
    );
};

export default App;
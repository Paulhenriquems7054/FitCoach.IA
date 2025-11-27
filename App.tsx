
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { useRouter } from './hooks/useRouter';
import { Skeleton } from './components/ui/Skeleton';
import { Card } from './components/ui/Card';
import { ToastProvider } from './components/ui/Toast';
import { GymBrandingProvider } from './components/GymBrandingProvider';
import { useUser } from './context/UserContext';
import { useDeviceContext } from './context/DeviceContext';
import { usePermissions } from './hooks/usePermissions';
import { getCurrentUsername } from './services/databaseService';

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
const WelcomeSurveyPage = lazy(() => import('./pages/WelcomeSurveyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const GymAdminPage = lazy(() => import('./pages/GymAdminPage'));
const StudentManagementPage = lazy(() => import('./pages/StudentManagementPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PermissionsManagementPage = lazy(() => import('./pages/PermissionsManagementPage'));
const VideoPresentationPage = lazy(() => import('./pages/VideoPresentationPage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));

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

/**
 * Aplica otimizações específicas do dispositivo
 */
const applyDeviceOptimizations = (device: ReturnType<typeof useDeviceContext>) => {
    if (typeof window === 'undefined') return;

    // Adicionar classes CSS baseadas no dispositivo
    const root = document.documentElement;
    
    // Remover classes anteriores
    root.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'device-touch', 'device-no-touch');
    
    // Adicionar classes baseadas no tipo de dispositivo
    if (device.isMobile) {
        root.classList.add('device-mobile');
    } else if (device.isTablet) {
        root.classList.add('device-tablet');
    } else {
        root.classList.add('device-desktop');
    }
    
    // Adicionar classe de touch
    if (device.isTouch) {
        root.classList.add('device-touch');
    } else {
        root.classList.add('device-no-touch');
    }
    
    // Otimizações específicas para mobile
    if (device.isMobile) {
        // Prevenir zoom em inputs (melhor UX)
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
        }
    }
    
    // Otimizações para desktop
    if (device.isDesktop) {
        // Habilitar hover effects
        root.classList.add('device-hover-enabled');
    }
    
    // Salvar informações do dispositivo no localStorage para referência futura
    try {
        const deviceInfo = {
            type: device.type,
            os: device.os,
            browser: device.browser,
            deviceId: device.deviceId,
            lastSeen: new Date().toISOString()
        };
        localStorage.setItem('fitcoach.device.info', JSON.stringify(deviceInfo));
    } catch (error) {
        console.warn('Não foi possível salvar informações do dispositivo', error);
    }
};

const App: React.FC = () => {
    const { path } = useRouter();
    const { user } = useUser();
    const permissions = usePermissions();
    const device = useDeviceContext();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // Verificar se é o primeiro acesso (apresentação ainda não foi vista)
    const PRESENTATION_SEEN_KEY = 'fitcoach.presentation.seen';
    const [hasSeenPresentation, setHasSeenPresentation] = useState<boolean | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Rotas públicas (não requerem autenticação)
    const publicRoutes = ['/premium', '/presentation', '/login'];
    const isPublicRoute = publicRoutes.includes(path);

    // Inicializar verificação de apresentação e login de forma síncrona
    useEffect(() => {
        // Verificar apresentação de forma síncrona
        // Em mobile, pode pular a apresentação se já foi vista em outro dispositivo
        const checkPresentation = () => {
            if (typeof window !== 'undefined') {
                // Verificar flag global
                const seenGlobal = localStorage.getItem(PRESENTATION_SEEN_KEY) === 'true';
                
                // Verificar flag específica do dispositivo
                const deviceKey = `fitcoach.presentation.seen.${device.deviceId}`;
                const seenDevice = localStorage.getItem(deviceKey) === 'true';
                
                // Se foi visto globalmente OU neste dispositivo específico
                setHasSeenPresentation(seenGlobal || seenDevice);
            } else {
                setHasSeenPresentation(false); // Default: não viu (mostrar apresentação)
            }
        };

        checkPresentation();

        // Listener para mudanças no localStorage (quando apresentação é marcada como vista)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === PRESENTATION_SEEN_KEY) {
                checkPresentation();
            }
        };

        // Listener para evento customizado (quando apresentação é marcada na mesma aba)
        const handlePresentationSeen = () => {
            checkPresentation();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('presentation-seen', handlePresentationSeen);

        // Aplicar otimizações específicas do dispositivo
        applyDeviceOptimizations(device);

        // Verificar se há token na URL para login automático
        const checkTokenLogin = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (token) {
                // Redirecionar para login com token
                window.location.hash = `#/login?token=${token}`;
                // Limpar token da URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };

        // Verificar se usuário está realmente logado
        const checkLogin = async () => {
            try {
                const currentUsername = await getCurrentUsername();
                setIsLoggedIn(!!currentUsername && currentUsername.trim() !== '');
            } catch (error) {
                setIsLoggedIn(false);
            } finally {
                setIsInitialized(true);
            }
        };
        
        checkTokenLogin();
        checkLogin();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('presentation-seen', handlePresentationSeen);
        };
    }, [device]);

    // Aguardar inicialização antes de decidir roteamento
    if (!isInitialized || hasSeenPresentation === null) {
        return <PageLoader />;
    }

    // Se path está vazio (sem hash), decidir baseado na flag de apresentação
    if (!path || path === '') {
        if (!hasSeenPresentation) {
            // Primeiro acesso: redirecionar para apresentação
            window.location.hash = '#/presentation';
            return <PageLoader />;
        } else {
            // Já viu apresentação: redirecionar para login
            window.location.hash = '#/login';
            return <PageLoader />;
        }
    }

    // Lógica de primeiro acesso: se não viu apresentação, só permitir /presentation e /premium
    // Se tentar acessar /login ou qualquer outra rota no primeiro acesso, redirecionar para apresentação
    if (!hasSeenPresentation && path !== '/presentation' && path !== '/premium') {
        window.location.hash = '#/presentation';
        return <PageLoader />;
    }

    // Se for rota pública, permitir acesso sem verificar autenticação
    if (isPublicRoute && path === '/premium') {
        return (
            <GymBrandingProvider>
                <ToastProvider>
                    <Layout>
                        <Suspense fallback={<PageLoader />}>
                            <PremiumPage />
                        </Suspense>
                    </Layout>
                </ToastProvider>
            </GymBrandingProvider>
        );
    }

    // Se ainda está verificando login, mostrar loading (apenas para rotas privadas)
    if (isLoggedIn === null && !isPublicRoute) {
        return <PageLoader />;
    }

    // Verificar se é aluno tentando acessar rotas administrativas ou restritas (apenas se logado)
    const isStudent = isLoggedIn && user.gymRole === 'student';
    const adminRoutes = ['/gym-admin', '/student-management', '/professional'];
    const restrictedRoutes = ['/privacy', '/configuracoes'];
    const isAccessingAdminRoute = adminRoutes.includes(path);
    const isAccessingRestrictedRoute = restrictedRoutes.includes(path);

    // Se aluno tentar acessar rota administrativa ou restrita, redirecionar para home
    // (exceto welcome-survey que é permitida)
    if (isStudent && (isAccessingAdminRoute || isAccessingRestrictedRoute) && path !== '/welcome-survey') {
        window.location.hash = '#/';
        return null;
    }

    // Verificar se é admin (apenas se estiver logado)
    const isDefaultAdmin = isLoggedIn && (user.username === 'Administrador' || user.username === 'Desenvolvedor');
    const isAdmin = isLoggedIn && (user.gymRole === 'admin' || isDefaultAdmin);

    // Rotas permitidas para administradores
    const adminAllowedRoutes = ['/', '/privacy', '/configuracoes', '/perfil', '/student-management', '/gym-admin', '/permissions', '/premium'];
    const isAdminAccessingStudentRoute = isAdmin && !adminAllowedRoutes.includes(path) && path !== '/admin-dashboard';

    // Se admin tentar acessar rota de aluno, redirecionar para dashboard
    if (isAdminAccessingStudentRoute) {
        window.location.hash = '#/';
        return null;
    }

    // Verificar se aluno precisa responder a enquete
    // O flag da enquete é específico por usuário (username)
    const SURVEY_STORAGE_FLAG = user.username ? `nutriIA_enquete_v2_done_${user.username}` : 'nutriIA_enquete_v2_done';
    const hasAnsweredSurvey = typeof window !== 'undefined' ? localStorage.getItem(SURVEY_STORAGE_FLAG) : null;
    const isStudentNeedingSurvey = isStudent && !hasAnsweredSurvey && path !== '/welcome-survey';

    // Se aluno não respondeu a enquete, redirecionar
    if (isStudentNeedingSurvey) {
        window.location.hash = '#/welcome-survey';
        return null;
    }

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
            case '/gym-admin': return <GymAdminPage />;
            case '/student-management': return <StudentManagementPage />;
            case '/admin-dashboard': return <AdminDashboardPage />;
            case '/permissions': return <PermissionsManagementPage />;
            case '/premium': return <PremiumPage />;
            case '/':
            default:
                // Se for admin, mostrar dashboard administrativo; caso contrário, mostrar home do aluno
                if (isAdmin) {
                    return <AdminDashboardPage />;
                }
                return <HomePage />;
        }
    };


    if (path === '/presentation') {
        return (
            <Suspense fallback={<PageLoader />}>
                <VideoPresentationPage />
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

    if (path === '/welcome-survey') {
        return (
            <Suspense fallback={<PageLoader />}>
                <WelcomeSurveyPage />
            </Suspense>
        );
    }

    return (
        <GymBrandingProvider>
            <ToastProvider>
                <Layout>
                    <Suspense fallback={<PageLoader />}>
                        {renderPage()}
                    </Suspense>
                </Layout>
            </ToastProvider>
        </GymBrandingProvider>
    );
};

export default App;
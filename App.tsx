
import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
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
// Removidos: InviteCodeEntry e LoginOrRegister - LoginPage já tem toda a funcionalidade
import { authService } from './services/supabaseService';
import { Logo } from './components/Logo';
import { Gender } from './types';
import { getAccountType } from './utils/accountType';

// Função auxiliar para normalizar path do hash
const normalizePath = (hash: string) => {
  if (!hash || hash === '#') {
    return '';
  }
  if (hash === '#/') {
    return '/';
  }
  const hashWithoutQuery = hash.split('?')[0];
  const newPath = hashWithoutQuery.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

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
const LandingPage = lazy(() => import('./pages/LandingPage'));
const WelcomeSurveyPage = lazy(() => import('./pages/WelcomeSurveyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const GymAdminPage = lazy(() => import('./pages/GymAdminPage'));
const StudentManagementPage = lazy(() => import('./pages/StudentManagementPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PermissionsManagementPage = lazy(() => import('./pages/PermissionsManagementPage'));
const TrainerWorkoutPage = lazy(() => import('./pages/TrainerWorkoutPage'));
const VideoPresentationPage = lazy(() => import('./pages/VideoPresentationPage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
const ActivationScreen = lazy(() => import('./pages/ActivationScreen'));
const ActivationSuccessPage = lazy(() => import('./pages/ActivationSuccessPage'));
const SubscriptionStatusScreen = lazy(() => import('./pages/SubscriptionStatusScreen'));
const ChangePlanPage = lazy(() => import('./pages/ChangePlanPage'));
const CreateDefaultUsersPage = lazy(() => import('./pages/CreateDefaultUsersPage'));
const StudentAiPlansPage = lazy(() => import('./pages/StudentAiPlansPage'));
const Onboarding = lazy(() => import('./components/Onboarding'));

// Componente de loading
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8 max-w-md">
            <Card>
                <div className="p-6 space-y-4">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            FitCoach.IA
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Carregando...
                        </p>
                    </div>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>
            </Card>
        </div>
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
    const { user, setUser } = useUser();
    const permissions = usePermissions();
    const device = useDeviceContext();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // Verificar se é o primeiro acesso (landing)
    const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
    const [hasSeenLanding, setHasSeenLanding] = useState<boolean | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Removido: inviteFlowState - LoginPage já gerencia todo o fluxo de login/cadastro/convite
    
    // Ref para evitar múltiplos redirecionamentos simultâneos
    const redirectingRef = useRef(false);
    const lastRedirectHashRef = useRef<string>('');
    const loginCheckRef = useRef(false);
    const lastLogKeyRef = useRef<string>('');

    // Rotas públicas (não requerem autenticação)
    const publicRoutes = ['/premium', '/presentation', '/login', '/landing'];
    const isPublicRoute = publicRoutes.includes(path);

    // Inicializar verificação de landing, apresentação e login de forma síncrona
    useEffect(() => {
        // Verificar landing de forma síncrona
        const checkLanding = () => {
            if (typeof window !== 'undefined') {
                const seen = localStorage.getItem(LANDING_SEEN_KEY) === 'true';
                setHasSeenLanding(seen);
            } else {
                setHasSeenLanding(false);
            }
        };

        checkLanding();

        // Listener para mudanças no localStorage
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === LANDING_SEEN_KEY) {
                checkLanding();
            }
        };

        // Listener para eventos customizados
        const handleLandingSeen = () => {
            checkLanding();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('landing-seen', handleLandingSeen);

        // Aplicar otimizações específicas do dispositivo (apenas uma vez)
        if (typeof window !== 'undefined') {
            applyDeviceOptimizations(device);
        }

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

                // Verificar se usuário está realmente logado (apenas uma vez)
                const checkLogin = async () => {
                    // Evitar múltiplas execuções
                    if (loginCheckRef.current || isInitialized) {
                        return;
                    }
                    
                    loginCheckRef.current = true;
                    
                    try {
                        console.log('[App] Verificando login...');
                        
                        // Verificar se o usuário está explicitamente na rota de login
                        // Se estiver, não fazer login automático mesmo que haja sessão
                        const currentHash = window.location.hash;
                        const currentPath = normalizePath(currentHash);
                        const isOnLoginPage = currentPath === '/login' || currentHash === '#/login';
                        
                        // Adicionar timeout para evitar travamento
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            setTimeout(() => {
                                reject(new Error('Timeout ao verificar login (5s)'));
                            }, 5000);
                        });

                        await Promise.race([
                            (async () => {
                                // Se estiver na página de login OU hash estiver vazio (raiz), não fazer login automático
                                // Isso permite que o fluxo de redirecionamento (landing -> presentation -> login) funcione
                                const isEmptyHash = !currentHash || currentHash === '' || currentHash === '#';
                                
                                if (isOnLoginPage || isEmptyHash) {
                                    console.log('[App] Hash vazio ou na página de login, não fazer login automático');
                                    setIsLoggedIn(false);
                                    setIsInitialized(true);
                                    return;
                                }
                                
                                // Primeiro tentar verificar no Supabase Auth
                                const supabaseUser = await authService.getCurrentUserProfile();
                                if (supabaseUser) {
                                    console.log('[App] Usuário encontrado no Supabase');
                                    
                                    // Atualizar status de trial antes de definir usuário
                                    const { updateTrialStatus } = await import('./services/trialAccessService');
                                    const updatedUser = await updateTrialStatus(supabaseUser);
                                    
                                    // Só atualizar se realmente mudou para evitar loops
                                    setUser(prevUser => {
                                        // Comparar apenas campos essenciais para evitar atualizações desnecessárias
                                        if (prevUser.username === updatedUser.username && 
                                            prevUser.subscriptionStatus === updatedUser.subscriptionStatus) {
                                            return prevUser;
                                        }
                                        return updatedUser;
                                    });
                                    setIsLoggedIn(true);
                                    setIsInitialized(true);
                                    return;
                                }

                                // Fallback para IndexedDB
                                console.log('[App] Verificando IndexedDB...');
                                const currentUsername = await getCurrentUsername();
                                const isLoggedInValue = !!currentUsername && currentUsername.trim() !== '';
                                setIsLoggedIn(isLoggedInValue);
                                console.log('[App] Login verificado:', isLoggedInValue);
                            })(),
                            timeoutPromise
                        ]);
                    } catch (error) {
                        console.warn('[App] Erro ao verificar login, assumindo não logado:', error);
                        setIsLoggedIn(false);
                    } finally {
                        setIsInitialized(true);
                        console.log('[App] Inicialização concluída');
                    }
                };
        
        checkTokenLogin();
        checkLogin();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('landing-seen', handleLandingSeen);
        };
    }, []); // Removido 'device' das dependências para evitar re-execuções
    
    // Verificar e atualizar status de trial periodicamente
    useEffect(() => {
        if (!isLoggedIn || !user) return;
        
        const checkTrialStatus = async () => {
            try {
                const { updateTrialStatus } = await import('./services/trialAccessService');
                const { getAiAccessStatus } = await import('./services/aiAccessService');
                const updatedUser = await updateTrialStatus(user);
                
                // Verificar trial de conta expirado
                if (updatedUser.subscriptionStatus === 'expired') {
                    const currentPath = normalizePath(window.location.hash);
                    const accountType = updatedUser.accountType || 'individual';
                    const isStudent = updatedUser.tenantRole === 'student' && updatedUser.academyId;
                    
                    // Se não é aluno, aplicar bloqueio de trial de conta
                    if (!isStudent) {
                        // Rotas permitidas após trial expirado
                        const allowedRoutes = ['/premium', '/admin-dashboard'];
                        if (accountType === 'academy') {
                            allowedRoutes.push('/gym-admin');
                        }
                        
                        // Se não está em rota permitida, redirecionar para premium
                        if (!allowedRoutes.includes(currentPath) && !currentPath.startsWith('/gym-admin')) {
                            console.log('[App] Trial expirado, redirecionando para premium...');
                            window.location.hash = '#/premium';
                            return;
                        }
                    }
                }
                
                // Verificar trial de IA expirado (para alunos)
                if (updatedUser.tenantRole === 'student' && updatedUser.academyId) {
                    const aiAccessStatus = await getAiAccessStatus(updatedUser);
                    if (!aiAccessStatus.hasAccess && aiAccessStatus.reason === 'trial_expired') {
                        const currentPath = normalizePath(window.location.hash);
                        const allowedRoutes = ['/student-ai-plans', '/premium'];
                        
                        // Se não está em rota permitida, redirecionar para planos de IA
                        if (!allowedRoutes.includes(currentPath)) {
                            console.log('[App] Trial de IA expirado para aluno, redirecionando para planos...');
                            window.location.hash = '#/student-ai-plans';
                            return;
                        }
                    }
                }
                
                // Atualizar usuário com status atualizado
                if (updatedUser !== user) {
                    setUser(updatedUser);
                }
            } catch (error) {
                console.warn('[App] Erro ao verificar status de trial:', error);
            }
        };
        
        checkTrialStatus();
        
        // Verificar a cada 5 minutos
        const interval = setInterval(checkTrialStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isLoggedIn, user]);

    // Lógica de redirecionamento simplificada - apenas para fluxo inicial
    // IMPORTANTE: useEffect DEVE vir ANTES de qualquer return condicional (regras dos hooks do React)
    // CRÍTICO: Apenas redirecionar no fluxo inicial (landing -> login)
    useEffect(() => {
        // Não redirecionar se ainda está inicializando
        if (!isInitialized || hasSeenLanding === null) {
            return;
        }

        // Apenas redirecionar no fluxo inicial, não após login
        const currentHash = window.location.hash;
        const currentPath = normalizePath(currentHash);
        let targetPath = '';
        
        // Se usuário está logado e path está vazio OU hash está vazio, redirecionar para home
        // MAS apenas se não estiver já em #/ ou /
        if (isLoggedIn && (!currentPath || currentPath === '') && currentHash !== '#/' && currentHash !== '') {
            targetPath = '#/';
        }
        // Apenas fluxo inicial: landing -> login
        else if (!isLoggedIn) {
            // Se hash está vazio (primeira visita), sempre mostrar landing primeiro
            if (!currentHash || currentHash === '' || currentHash === '#') {
                targetPath = '#/landing';
            } 
            // Se não está na landing e não está no login/premium, ir para landing
            else if (currentPath !== '/landing' && currentPath !== '/login' && currentPath !== '/premium' && currentHash !== '#/landing' && currentHash !== '#/login') {
                targetPath = '#/landing';
            }
            // Se já está na landing e já completou (hasSeenLanding), não redirecionar (deixar landing redirecionar quando completar)
            // Não forçar redirecionamento automático de landing para login - deixar a LandingPage fazer isso
        }

        // Só redirecionar se:
        // 1. Há um targetPath definido
        // 2. É diferente do hash atual
        // 3. É diferente do último hash que tentamos navegar (evitar loops)
        // 4. Não estiver redirecionando no momento
        // 5. O hash atual não é já o target (verificação adicional)
        if (targetPath && 
            currentHash !== targetPath && 
            lastRedirectHashRef.current !== targetPath && 
            !redirectingRef.current &&
            normalizePath(targetPath) !== currentPath) {
            
            console.log('[App] Redirecionando para:', targetPath, 'de', currentHash);
            redirectingRef.current = true;
            lastRedirectHashRef.current = targetPath;
            
            // Usar requestAnimationFrame para garantir que o redirecionamento aconteça após o render
            requestAnimationFrame(() => {
                window.location.hash = targetPath;
                // Resetar flag após delay para permitir que o hash mude
                setTimeout(() => {
                    redirectingRef.current = false;
                    // Limpar lastRedirectHashRef após mais tempo para permitir redirecionamentos futuros
                    setTimeout(() => {
                        if (normalizePath(window.location.hash) === normalizePath(targetPath)) {
                            lastRedirectHashRef.current = '';
                        }
                    }, 500);
                }, 500);
            });
        } else if (!targetPath) {
            // Se não há targetPath, significa que estamos na rota correta
            // Limpar flags de redirecionamento
            redirectingRef.current = false;
            // Só limpar lastRedirectHashRef se realmente estamos na rota correta
            if (currentPath === normalizePath(lastRedirectHashRef.current)) {
                lastRedirectHashRef.current = '';
            }
        }
    }, [hasSeenLanding, isLoggedIn, isInitialized]); // Não incluir 'path' para evitar loops

    // Aguardar inicialização antes de decidir roteamento
    // IMPORTANTE: Este return vem DEPOIS de todos os hooks
    if (!isInitialized || hasSeenLanding === null) {
        console.log('[App] Aguardando inicialização...', { isInitialized, hasSeenLanding });
        return <PageLoader />;
    }

    // Debug: Log do estado atual (apenas uma vez por mudança de estado)
    const logKey = `${path}-${isLoggedIn}-${isInitialized}`;
    if (lastLogKeyRef.current !== logKey) {
        console.log('[App] Estado atual:', { 
            path, 
            isLoggedIn, 
            hasSeenLanding, 
            isInitialized,
            redirectingRef: redirectingRef.current,
            userRole: user?.gymRole,
            username: user?.username
        });
        lastLogKeyRef.current = logKey;
    }

    // Se usuário está logado, não precisa verificar landing/presentation
    // Ir direto para a home ou rota solicitada
    if (!isLoggedIn) {
        // Usuário não logado: verificar se está na rota correta
        // Se estiver na rota correta, não bloquear (deixar renderizar)
        // Quando path está vazio (hash vazio), considerar que precisa redirecionar
        const isEmptyPath = !path || path === '';
        const isOnCorrectRoute = 
            path === '/landing' || // Sempre permitir estar na landing
            path === '/login' || // Sempre permitir estar no login
            path === '/premium' || // Sempre permitir estar no premium
            (isEmptyPath); // Path vazio - será redirecionado para landing
        
        // Só mostrar loader se NÃO está na rota correta E está redirecionando
        // Isso evita loop porque não bloqueia quando já está na rota correta
        if (!isOnCorrectRoute && redirectingRef.current) {
            console.log('[App] Redirecionando (usuário não logado)...', { path, hasSeenLanding, isOnCorrectRoute });
            return <PageLoader />;
        }
        
        // Se não está na rota correta e ainda não iniciou redirecionamento, 
        // o useEffect vai iniciar o redirecionamento, mas não bloqueamos aqui para evitar loop
    } else {
        // Usuário logado: se path está vazio, tratar como '/' (home)
        if (!path || path === '') {
            console.log('[App] Usuário logado com path vazio, tratando como home...');
            // Não fazer nada aqui, deixar o useEffect redirecionar ou renderizar como '/'
        }
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

    // Normalizar path vazio para '/' antes de todas as verificações
    const normalizedPath = !path || path === '' ? '/' : path;
    
    // IMPORTANTE: Verificar rotas públicas ANTES de qualquer verificação de permissão
    // Isso evita que rotas como landing, presentation, welcome-survey sejam bloqueadas incorretamente
    
    // Página de Landing (Logo) - DEVE SER VERIFICADA PRIMEIRO
    if (normalizedPath === '/landing') {
        return (
            <GymBrandingProvider>
                <ToastProvider>
                    <Suspense fallback={<PageLoader />}>
                        <LandingPage
                            onGetStarted={() => {
                                // Marcar landing como vista
                                try {
                                    localStorage.setItem('fitcoach.landing.seen', 'true');
                                    window.dispatchEvent(new Event('landing-seen'));
                                } catch (error) {
                                    console.warn('Erro ao salvar flag de landing', error);
                                }
                                // Redirecionar para onboarding ou login
                                if (!isLoggedIn) {
                                    window.location.hash = '#/login';
                                } else {
                                    window.location.hash = '#/';
                                }
                            }}
                            onAnalyze={() => {
                                // Abrir scanner de foto (se implementado)
                                window.location.hash = '#/analyzer';
                            }}
                            onDevSkip={() => {
                                // Pular onboarding (dev mode)
                                if (user) {
                                    window.location.hash = '#/';
                                }
                            }}
                        />
                    </Suspense>
                </ToastProvider>
            </GymBrandingProvider>
        );
    }
    
    // Página de Apresentação (Vídeo)
    if (normalizedPath === '/presentation') {
        return (
            <Suspense fallback={<PageLoader />}>
                <VideoPresentationPage />
            </Suspense>
        );
    }
    
    // Welcome Survey
    if (normalizedPath === '/welcome-survey') {
        return (
            <GymBrandingProvider>
                <ToastProvider>
                    <Suspense fallback={<PageLoader />}>
                        <WelcomeSurveyPage />
                    </Suspense>
                </ToastProvider>
            </GymBrandingProvider>
        );
    }
    
    // Verificar se é aluno tentando acessar rotas administrativas ou restritas (apenas se logado)
    // Usar tenantRole (B2B2C) como prioridade, fallback para gymRole (compatibilidade)
    // IMPORTANTE: Apenas alunos vinculados a academia (com academyId) são considerados alunos reais
    // Usuários B2C individuais (sem academyId) NÃO são alunos
    const isStudent = isLoggedIn && user && (
        (user.tenantRole === 'student' && user.academyId) || // Aluno vinculado a academia (B2B2C)
        (user.gymRole === 'student' && user.gymId) // Aluno com gymId (compatibilidade)
    );
    const adminRoutes = ['/gym-admin', '/student-management', '/professional'];
    const restrictedRoutes = ['/privacy', '/configuracoes'];
    const isAccessingAdminRoute = adminRoutes.includes(normalizedPath);
    const isAccessingRestrictedRoute = restrictedRoutes.includes(normalizedPath);

    // Se aluno tentar acessar rota administrativa ou restrita, mostrar loader (redirecionamento será feito pelo useEffect)
    if (isStudent && (isAccessingAdminRoute || isAccessingRestrictedRoute) && normalizedPath !== '/welcome-survey') {
        console.log('[App] Bloqueado: Aluno tentando acessar rota administrativa');
        return <PageLoader />;
    }

    // Verificar se é admin (apenas se estiver logado)
    const isDefaultAdmin = isLoggedIn && user && (user.username === 'Administrador' || user.username === 'Desenvolvedor');
    const isAdmin = isLoggedIn && user && (user.gymRole === 'admin' || isDefaultAdmin);
    const isDeveloper = isLoggedIn && user && (user.username === 'Desenvolvedor' || user.username === 'dev123');

    // Se for desenvolvedor, mostrar loader (redirecionamento será feito pelo useEffect)
    // Permitir '/' (home) para desenvolvedores também
    if (isDeveloper && normalizedPath !== '/admin-dashboard' && normalizedPath !== '/') {
        console.log('[App] Bloqueado: Desenvolvedor precisa ir para admin-dashboard');
        return <PageLoader />;
    }

    // Rotas permitidas para administradores (incluindo welcome-survey e onboarding)
    const adminAllowedRoutes = ['/', '/privacy', '/configuracoes', '/perfil', '/student-management', '/gym-admin', '/permissions', '/premium', '/welcome-survey', '/onboarding'];
    const isAdminAccessingStudentRoute = isAdmin && !isDeveloper && !adminAllowedRoutes.includes(normalizedPath) && normalizedPath !== '/admin-dashboard';

    // Se admin tentar acessar rota de aluno, mostrar loader (redirecionamento será feito pelo useEffect)
    // Apenas bloquear se realmente for admin e não desenvolvedor
    if (isAdminAccessingStudentRoute && isLoggedIn && user) {
        console.log('[App] Bloqueado: Admin tentando acessar rota de aluno', { normalizedPath, adminAllowedRoutes, isAdmin, isDeveloper });
        return <PageLoader />;
    }

    // Verificar trial expirado ANTES de qualquer outra verificação
    // Se trial expirou, bloquear acesso a todas as rotas exceto premium/admin
    if (isLoggedIn && user) {
        try {
            const accountType = user.accountType || 'individual';
            const isStudent = user.tenantRole === 'student' && user.academyId;
            let isExpired = user.subscriptionStatus === 'expired';
            let isAiTrialExpired = false;
            
            // Verificar data de expiração do trial de conta de forma segura
            if (user.trialEndDate) {
                try {
                    const trialEndDate = new Date(user.trialEndDate);
                    const now = new Date();
                    if (!isNaN(trialEndDate.getTime())) {
                        isExpired = isExpired || trialEndDate < now;
                    }
                } catch (dateError) {
                    console.warn('[App] Erro ao verificar trialEndDate:', dateError);
                }
            }
            
            // Verificar trial de IA expirado (para alunos)
            if (isStudent && user.aiSubscriptionStatus) {
                if (user.aiSubscriptionStatus === 'expired') {
                    isAiTrialExpired = true;
                } else if (user.aiTrialEndAt) {
                    try {
                        const aiTrialEndDate = new Date(user.aiTrialEndAt);
                        const now = new Date();
                        if (!isNaN(aiTrialEndDate.getTime())) {
                            isAiTrialExpired = aiTrialEndDate < now;
                        }
                    } catch (dateError) {
                        console.warn('[App] Erro ao verificar aiTrialEndAt:', dateError);
                    }
                }
            }
            
            // Se trial de conta expirou
            if (isExpired && !isStudent) {
                // Rotas permitidas após trial expirado
                const allowedRoutes = ['/premium'];
                if (accountType === 'academy') {
                    allowedRoutes.push('/admin-dashboard', '/gym-admin');
                }
                
                // Se não está em rota permitida, redirecionar para premium
                if (!allowedRoutes.includes(normalizedPath) && !normalizedPath.startsWith('/gym-admin')) {
                    console.log('[App] Trial expirado, bloqueando acesso a:', normalizedPath);
                    window.location.hash = '#/premium';
                    return <PageLoader />;
                }
            }
            
            // Se trial de IA expirou (para alunos)
            if (isAiTrialExpired && isStudent) {
                // Rotas permitidas após trial de IA expirado
                const allowedRoutes = ['/student-ai-plans', '/premium'];
                
                // Se não está em rota permitida, redirecionar para planos de IA
                if (!allowedRoutes.includes(normalizedPath)) {
                    console.log('[App] Trial de IA expirado para aluno, bloqueando acesso a:', normalizedPath);
                    window.location.hash = '#/student-ai-plans';
                    return <PageLoader />;
                }
            }
        } catch (error) {
            console.error('[App] Erro ao verificar trial expirado:', error);
            // Em caso de erro, continuar o fluxo normal (não bloquear o app)
        }
    }

    // Verificar se usuário precisa responder a enquete (APENAS APÓS LOGIN)
    // A enquete só aparece após login bem-sucedido
    if (isLoggedIn && user) {
        try {
            // Obter chave de storage com sufixo de domínio (para evitar conflitos)
            const getSurveyStorageFlag = (username?: string) => {
                const userSuffix = username ? `_${username}` : '';
                const domainSuffix = typeof window !== 'undefined' 
                    ? `_${window.location.hostname.replace(/\./g, '_')}` 
                    : '';
                return `nutriIA_enquete_v2_done${userSuffix}${domainSuffix}`;
            };
            
            const SURVEY_STORAGE_FLAG = getSurveyStorageFlag(user?.username);
            const hasAnsweredSurvey = typeof window !== 'undefined' ? localStorage.getItem(SURVEY_STORAGE_FLAG) : null;
            
            // Verificar tipo de conta (com fallback seguro)
            let accountType: string = 'individual';
            try {
                accountType = getAccountType(user);
            } catch (error) {
                console.warn('[App] Erro ao obter accountType, usando fallback:', error);
                accountType = user?.accountType || 'individual';
            }
            
            // Usuário precisa da enquete se:
            // 1. Está logado
            // 2. É ALUNO (tenantRole === 'student') - APENAS alunos no modelo B2B2C
            // 3. NÃO é usuário B2C individual (accountType === 'individual' sem tenantRole)
            // 4. Não respondeu a enquete ainda
            // 5. Não está na página da enquete
            // IMPORTANTE: Enquete é APENAS para alunos vinculados a academia, NÃO para B2C puro
            const isRealStudent = user?.tenantRole === 'student' && user?.academyId; // Aluno vinculado a academia
            const isB2CIndividual = accountType === 'individual' && !user?.tenantRole && !user?.academyId; // B2C puro sem vínculo
            
            const isUserNeedingSurvey = (
                isRealStudent && // Apenas alunos reais vinculados a academia
                !isB2CIndividual && // Não é B2C puro
                !hasAnsweredSurvey && 
                normalizedPath !== '/welcome-survey'
            );

            // Se usuário não respondeu a enquete, mostrar loader (redirecionamento será feito pelo useEffect)
            // IMPORTANTE: Enquete é APENAS para alunos vinculados a academia (tenantRole === 'student' && academyId)
            if (isUserNeedingSurvey) {
                console.log('[App] Aluno precisa responder enquete no primeiro acesso', { 
                    isRealStudent, 
                    isB2CIndividual,
                    tenantRole: user?.tenantRole, 
                    gymRole: user?.gymRole,
                    academyId: user?.academyId,
                    accountType,
                    hasAnsweredSurvey, 
                    normalizedPath 
                });
                // Redirecionar para welcome-survey se ainda não estiver lá
                if (normalizedPath !== '/welcome-survey' && !redirectingRef.current) {
                    window.location.hash = '#/welcome-survey';
                    redirectingRef.current = true;
                    setTimeout(() => {
                        redirectingRef.current = false;
                    }, 1000);
                }
                return <PageLoader />;
            }
        } catch (error) {
            console.error('[App] Erro ao verificar enquete:', error);
            // Em caso de erro, continuar o fluxo normal (não bloquear o app)
        }
    }

    // Debug: Se chegou até aqui, deve renderizar
    console.log('[App] ✅ Todas as verificações passadas, renderizando página...', { 
        normalizedPath, 
        isLoggedIn, 
        isStudent, 
        isAdmin, 
        isDeveloper,
        userRole: user?.gymRole,
        tenantRole: user?.tenantRole,
        accountType: user?.accountType,
        academyId: user?.academyId,
        username: user?.username,
        subscriptionStatus: user?.subscriptionStatus,
        trialEndDate: user?.trialEndDate
    });

    const renderPage = () => {
        // Usar normalizedPath que já foi definido acima
        switch (normalizedPath) {
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
            case '/trainer-workout': return <TrainerWorkoutPage />;
            case '/admin-dashboard': return <AdminDashboardPage />;
            case '/permissions': return <PermissionsManagementPage />;
            case '/premium': return <PremiumPage />;
            case '/student-ai-plans': return <StudentAiPlansPage />;
            case '/activation': return <ActivationScreen />;
            case '/activation-success': return <ActivationSuccessPage />;
            case '/subscription-status': return <SubscriptionStatusScreen />;
            case '/change-plan': return <ChangePlanPage />;
            case '/create-default-users': return <CreateDefaultUsersPage />;
            case '/':
            default:
                // Se for desenvolvedor, sempre mostrar admin-dashboard
                if (isDeveloper) {
                    return <AdminDashboardPage />;
                }
                // Se for admin, mostrar dashboard administrativo; caso contrário, mostrar home do aluno
                if (isAdmin) {
                    return <AdminDashboardPage />;
                }
                return <HomePage />;
        }
    };



    // REMOVIDO: Fluxo de escolha duplicado - LoginPage já tem toda a funcionalidade necessária
    // O LoginPage já permite inserir código de convite, fazer login e cadastro

    if (normalizedPath === '/login') {
        return (
            <ToastProvider>
                <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                </Suspense>
            </ToastProvider>
        );
    }

    // welcome-survey já foi verificado acima (antes das verificações de permissão)
    // Não precisa verificar novamente aqui

    if (normalizedPath === '/onboarding') {
        return (
            <Suspense fallback={<PageLoader />}>
                <Onboarding 
                    onComplete={async (profile) => {
                        // Converter UserProfile para User e salvar
                        const { saveUser } = await import('./services/databaseService');
                        const userData = {
                            nome: profile.name,
                            idade: profile.age,
                            genero: (profile.gender === Gender.Male ? 'Masculino' : profile.gender === Gender.Female ? 'Feminino' : 'Masculino') as 'Masculino' | 'Feminino',
                            peso: profile.weight,
                            altura: profile.height,
                            objetivo: profile.goal,
                            points: 0,
                            disciplineScore: 0,
                            completedChallengeIds: [],
                            isAnonymized: false,
                            weightHistory: [],
                            role: 'user' as const,
                            subscription: 'free' as const,
                        };
                        await saveUser(userData);
                        setUser(userData as any);
                        setIsLoggedIn(true);
                        window.location.hash = '#/';
                    }}
                />
            </Suspense>
        );
    }

    // Debug final antes de renderizar
    console.log('[App] Renderizando página principal...', { 
        path, 
        isLoggedIn, 
        willRender: renderPage() !== null 
    });

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
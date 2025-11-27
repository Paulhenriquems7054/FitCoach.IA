import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { loginUser, usernameExists, saveLoginSession, resetPassword, getUserByUsername, registerUser } from '../services/databaseService';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';
import { XIcon } from '../components/icons/XIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { useToast } from '../components/ui/Toast';
import { getSupabaseClient, getUserFromSupabase } from '../services/supabaseService';
import { validateCoupon, applyCouponToUser } from '../services/couponService';
import type { LoginCredentials } from '../types';
import { sanitizeInput, sanitizeEmail } from '../utils/security';

const LoginPage: React.FC = () => {
    const { user, setUser } = useUser();
    const { theme, themeSetting, setThemeSetting } = useTheme();
    const { showSuccess, showError } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordUsername, setForgotPasswordUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    
    // Estados para cadastro
    const [showSignup, setShowSignup] = useState(false);
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupCouponCode, setSignupCouponCode] = useState('');
    const [signupError, setSignupError] = useState<string | null>(null);
    const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
    const [couponValidated, setCouponValidated] = useState(false);
    const [validatedCouponPlan, setValidatedCouponPlan] = useState<string | null>(null);

    // Processar token de acesso do email (quando usuário clica no link do email)
    useEffect(() => {
        // Ler token tanto da query string quanto do hash (para compatibilidade)
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        
        // Se não encontrou na query string, tentar no hash
        if (!token && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            token = hashParams.get('token');
        }
        
        if (token) {
            handleTokenLogin(token);
        }
    }, []);

    const handleTokenLogin = async (token: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Decodificar token (formato: userId:timestamp em base64)
            // O token pode ter caracteres removidos, então tentar decodificar de forma mais robusta
            let decoded: string;
            try {
                // Tentar decodificar diretamente
                decoded = atob(token);
            } catch (e) {
                // Se falhar, tentar adicionar padding se necessário
                try {
                    const paddedToken = token + '='.repeat((4 - token.length % 4) % 4);
                    decoded = atob(paddedToken);
                } catch (e2) {
                    throw new Error('Token inválido: formato incorreto');
                }
            }
            
            const [userId] = decoded.split(':');
            
            if (!userId) {
                throw new Error('Token inválido: ID do usuário não encontrado');
            }

            // Buscar usuário no Supabase
            const supabase = getSupabaseClient();
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error('Erro ao buscar usuário:', userError);
                if (userError.code === 'PGRST116') {
                    throw new Error('Usuário não encontrado. Por favor, entre em contato com o suporte.');
                }
                throw new Error(`Erro ao buscar usuário: ${userError.message}`);
            }

            if (!userData) {
                throw new Error('Usuário não encontrado no banco de dados');
            }

            // Converter para formato local e fazer login
            const localUser = await getUserFromSupabase(userId);
            
            if (localUser) {
                await saveLoginSession(localUser);
                setUser(localUser);
                showSuccess('Login realizado com sucesso! Bem-vindo ao FitCoach.IA!');
                
                // Limpar o token da URL após login bem-sucedido
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Verificar se é o primeiro acesso (apresentação ainda não foi vista)
                const PRESENTATION_SEEN_KEY = 'fitcoach.presentation.seen';
                const hasSeenPresentation = localStorage.getItem(PRESENTATION_SEEN_KEY) === 'true';
                
                // Redirecionar para presentation apenas se for o primeiro acesso
                // Caso contrário, redirecionar para home
                if (!hasSeenPresentation) {
                    window.location.hash = '#/presentation';
                } else {
                    window.location.hash = '#/';
                }
            } else {
                throw new Error('Erro ao carregar dados do usuário. Tente fazer login manualmente.');
            }
        } catch (error: any) {
            console.error('Erro no login por token:', error);
            const errorMsg = error.message || 'Erro ao processar token de acesso. Tente fazer login manualmente.';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTheme = () => {
        if (themeSetting === 'dark') {
            setThemeSetting('light');
        } else if (themeSetting === 'light') {
            setThemeSetting('system');
        } else {
            setThemeSetting('dark');
        }
    };

    const getThemeIcon = () => {
        if (themeSetting === 'system') {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
                    />
                </svg>
            );
        }
        return theme === 'dark' ? (
            <MoonIcon className="w-5 h-5" />
        ) : (
            <SunIcon className="w-5 h-5" />
        );
    };

    const getThemeLabel = () => {
        if (themeSetting === 'system') return 'Sistema';
        return theme === 'dark' ? 'Escuro' : 'Claro';
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError(null);
        setForgotPasswordSuccess(null);
        setIsResettingPassword(true);

        try {
            // Validações
            if (!forgotPasswordUsername.trim()) {
                setForgotPasswordError('Por favor, informe seu nome de usuário');
                setIsResettingPassword(false);
                return;
            }

            if (!newPassword.trim()) {
                setForgotPasswordError('Por favor, informe a nova senha');
                setIsResettingPassword(false);
                return;
            }

            if (newPassword.length < 6) {
                setForgotPasswordError('A senha deve ter pelo menos 6 caracteres');
                setIsResettingPassword(false);
                return;
            }

            if (newPassword !== confirmNewPassword) {
                setForgotPasswordError('As senhas não coincidem');
                setIsResettingPassword(false);
                return;
            }

            // Verificar se username existe
            const exists = await usernameExists(forgotPasswordUsername.trim());
            if (!exists) {
                setForgotPasswordError('Nome de usuário não encontrado');
                setIsResettingPassword(false);
                return;
            }

            // Redefinir senha
            const success = await resetPassword(forgotPasswordUsername.trim(), newPassword);
            
            if (success) {
                setForgotPasswordSuccess('Senha redefinida com sucesso! Você já pode fazer login.');
                // Limpar campos
                setNewPassword('');
                setConfirmNewPassword('');
                setShowNewPassword(false);
                setShowConfirmNewPassword(false);
                // Fechar modal após 2 segundos
                setTimeout(() => {
                    setShowForgotPassword(false);
                    setForgotPasswordUsername('');
                    setForgotPasswordSuccess(null);
                }, 2000);
            } else {
                setForgotPasswordError('Erro ao redefinir senha. Tente novamente.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao redefinir senha. Tente novamente.';
            setForgotPasswordError(errorMessage);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleValidateCoupon = async () => {
        if (!signupCouponCode.trim()) {
            setSignupError('Por favor, informe o código de convite');
            setCouponValidated(false);
            setValidatedCouponPlan(null);
            return;
        }

        setSignupError(null);
        const validation = await validateCoupon(signupCouponCode.trim());
        
        if (validation.isValid && validation.coupon) {
            setCouponValidated(true);
            setValidatedCouponPlan(validation.coupon.planLinked);
            showSuccess(`Código válido! Você receberá o plano: ${validation.coupon.planLinked}`);
        } else {
            setCouponValidated(false);
            setValidatedCouponPlan(null);
            const errorMsg = validation.error || 'Código de convite inválido';
            setSignupError(errorMsg);
            showError(errorMsg);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError(null);
        setSignupSuccess(null);
        setIsSigningUp(true);

        try {
            // Validações básicas
            if (!signupName.trim()) {
                setSignupError('Por favor, informe seu nome');
                setIsSigningUp(false);
                return;
            }

            if (!signupEmail.trim()) {
                setSignupError('Por favor, informe seu e-mail');
                setIsSigningUp(false);
                return;
            }

            const sanitizedEmail = sanitizeEmail(signupEmail.trim());
            if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
                setSignupError('Por favor, informe um e-mail válido');
                setIsSigningUp(false);
                return;
            }

            if (!signupPassword.trim()) {
                setSignupError('Por favor, informe uma senha');
                setIsSigningUp(false);
                return;
            }

            if (signupPassword.length < 6) {
                setSignupError('A senha deve ter pelo menos 6 caracteres');
                setIsSigningUp(false);
                return;
            }

            if (signupPassword !== signupConfirmPassword) {
                setSignupError('As senhas não coincidem');
                setIsSigningUp(false);
                return;
            }

            // Validar cupom se fornecido
            let couponPlan: string | null = null;
            if (signupCouponCode.trim()) {
                const validation = await validateCoupon(signupCouponCode.trim());
                if (!validation.isValid) {
                    setSignupError(validation.error || 'Código de convite inválido');
                    setIsSigningUp(false);
                    return;
                }
                if (validation.coupon) {
                    couponPlan = validation.coupon.planLinked;
                }
            }

            // Criar usuário no Supabase Auth
            const supabase = getSupabaseClient();
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: sanitizedEmail,
                password: signupPassword,
                options: {
                    data: {
                        nome: sanitizeInput(signupName.trim(), 100),
                        username: sanitizeInput(signupName.trim().toLowerCase().replace(/\s+/g, '_'), 50),
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message || 'Erro ao criar conta');
            }

            if (!authData.user) {
                throw new Error('Erro ao criar usuário');
            }

            const userId = authData.user.id;
            const username = sanitizeInput(signupName.trim().toLowerCase().replace(/\s+/g, '_'), 50);

            // Verificar se username já existe
            const exists = await usernameExists(username);
            if (exists) {
                // Se já existe, adicionar número
                let newUsername = username;
                let counter = 1;
                while (await usernameExists(newUsername)) {
                    newUsername = `${username}_${counter}`;
                    counter++;
                }
            }

            // Criar registro na tabela users com plano do cupom
            const userData = {
                nome: sanitizeInput(signupName.trim(), 100),
                username: username,
                idade: 0,
                genero: 'Masculino' as const,
                peso: 0,
                altura: 0,
                objetivo: 'perder peso' as const,
                points: 0,
                disciplineScore: 0,
                completedChallengeIds: [],
                isAnonymized: false,
                weightHistory: [],
                role: 'user' as const,
                subscription: 'free' as const,
                // Aplicar plano do cupom se houver
                planType: couponPlan ? couponPlan as any : 'free',
                subscriptionStatus: couponPlan ? 'active' as const : 'active' as const,
            };

            // Criar usuário no banco local (IndexedDB)
            const newUser = await registerUser(username, signupPassword, userData);

            // Criar usuário no Supabase
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    nome: userData.nome,
                    username: userData.username,
                    email: sanitizedEmail,
                    idade: userData.idade,
                    genero: userData.genero,
                    peso: userData.peso,
                    altura: userData.altura,
                    objetivo: userData.objetivo,
                    points: userData.points,
                    discipline_score: userData.disciplineScore,
                    completed_challenge_ids: userData.completedChallengeIds,
                    is_anonymized: userData.isAnonymized,
                    role: userData.role,
                    plan_type: userData.planType,
                    subscription_status: userData.subscriptionStatus,
                    voice_daily_limit_seconds: 900,
                    voice_used_today_seconds: 0,
                    voice_balance_upsell: 0,
                    text_msg_count_today: 0,
                });

            if (userError) {
                console.error('Erro ao criar usuário no Supabase:', userError);
                // Continuar mesmo se houver erro no Supabase
            }

            // Aplicar cupom se fornecido
            if (signupCouponCode.trim() && couponPlan) {
                const applyResult = await applyCouponToUser(signupCouponCode.trim(), userId);
                if (!applyResult.success) {
                    console.warn('Erro ao aplicar cupom:', applyResult.error);
                    // Não bloquear o cadastro se falhar aplicar o cupom
                }
            }

            setSignupSuccess('Conta criada com sucesso! Você já pode fazer login.');
            showSuccess('Conta criada com sucesso!');

            // Limpar formulário
            setSignupName('');
            setSignupEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setSignupCouponCode('');
            setCouponValidated(false);
            setValidatedCouponPlan(null);

            // Fechar modal e voltar para login após 2 segundos
            setTimeout(() => {
                setShowSignup(false);
                setSignupSuccess(null);
            }, 2000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
            setSignupError(errorMessage);
            showError(errorMessage);
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Sanitizar inputs
            const sanitizedUsername = sanitizeInput(username.trim(), 50);
            const sanitizedPassword = password.trim();

            if (!sanitizedUsername || !sanitizedPassword) {
                const errorMsg = 'Por favor, preencha todos os campos';
                setError(errorMsg);
                showError(errorMsg);
                setIsLoading(false);
                return;
            }

            const credentials: LoginCredentials = { 
                username: sanitizedUsername, 
                password: sanitizedPassword 
            };
            const user = await loginUser(credentials);

            if (user) {
                // Para alunos, sincronizar status com servidor antes de verificar bloqueio
                if (user.gymRole === 'student') {
                    try {
                        const { syncBlockStatus } = await import('../services/syncService');
                        await syncBlockStatus(user.username || sanitizedUsername);
                        // Recarregar usuário após sincronização usando a função importada
                        const { getUserByUsername: getUserByUsernameFn } = await import('../services/databaseService');
                        const syncedUser = await getUserByUsernameFn(user.username || sanitizedUsername);
                        if (syncedUser) {
                            Object.assign(user, syncedUser);
                        }
                    } catch (error) {
                        // Se falhar a sincronização, continuar com dados locais
                        console.warn('Erro ao sincronizar status no login:', error);
                    }
                }

                // Verificar se o aluno está com acesso bloqueado
                if (user.gymRole === 'student' && user.accessBlocked) {
                    const blockedMsg = user.blockedReason || 'Seu acesso está bloqueado. Entre em contato com a administração da academia.';
                    setError(blockedMsg);
                    showError(blockedMsg);
                    setIsLoading(false);
                    return;
                }

                // Salvar sessão
                await saveLoginSession(user.username || sanitizedUsername);
                
                // Atualizar contexto do usuário
                setUser(user);
                
                const successMsg = 'Login realizado com sucesso!';
                setSuccess(successMsg);
                showSuccess(successMsg);
                
                // Verificar se é aluno e se já respondeu a enquete
                // O flag da enquete é específico por usuário (username)
                const usernameForSurvey = user.username || sanitizedUsername;
                const SURVEY_STORAGE_FLAG = `nutriIA_enquete_v2_done_${usernameForSurvey}`;
                const hasAnsweredSurvey = localStorage.getItem(SURVEY_STORAGE_FLAG);
                
                console.log('LoginPage - Verificação de enquete:', {
                    username: usernameForSurvey,
                    gymRole: user.gymRole,
                    flag: SURVEY_STORAGE_FLAG,
                    hasAnswered: hasAnsweredSurvey
                });
                
                // Redirecionar baseado no role
                let redirectPath = '#/';
                if (user.gymRole === 'admin') {
                    redirectPath = '#/';
                } else if (user.gymRole === 'trainer') {
                    redirectPath = '#/';
                } else if (user.gymRole === 'student') {
                    // Se aluno não respondeu a enquete, redirecionar para ela (primeiro acesso)
                    if (!hasAnsweredSurvey) {
                        console.log('LoginPage - Aluno não respondeu enquete, redirecionando para /welcome-survey');
                        redirectPath = '#/welcome-survey';
                    } else {
                        console.log('LoginPage - Aluno já respondeu enquete, redirecionando para home');
                        redirectPath = '#/';
                    }
                }
                
                // Redirecionar após 1 segundo
                setTimeout(() => {
                    window.location.hash = redirectPath;
                }, 1000);
            } else {
                const errorMsg = 'Nome de usuário ou senha incorretos';
                setError(errorMsg);
                showError(errorMsg);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold">
                        <span className="text-primary-600">FitCoach</span>
                        <span className="text-slate-800 dark:text-slate-200">.IA</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                        Fazer Login
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Entre com seu nome e senha
                    </p>
                </div>

                <Card>
                    <div className="p-6">
                        {/* Theme toggle button - inside card, top right */}
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleToggleTheme}
                                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group"
                                aria-label={`Alternar tema (${getThemeLabel()})`}
                                title={`Tema: ${getThemeLabel()}`}
                            >
                                {getThemeIcon()}
                                <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {getThemeLabel()}
                                </span>
                            </button>
                        </div>


                        {/* Messages */}
                        {error && (
                            <Alert type="error" title="Erro" className="mb-4">
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert type="success" title="Sucesso" className="mb-4">
                                {success}
                            </Alert>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome *
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Seu nome"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Senha *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processando...' : 'Entrar'}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowSignup(true)}
                                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                                >
                                    Criar conta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    🔑 Esqueci a senha
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal Esqueci a Senha */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" aria-modal="true">
                    <Card className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 truncate pr-2">
                                🔑 Redefinir Senha
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotPasswordUsername('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                    setForgotPasswordError(null);
                                    setForgotPasswordSuccess(null);
                                    setShowNewPassword(false);
                                    setShowConfirmNewPassword(false);
                                }}
                                className="p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                                aria-label="Fechar"
                            >
                                <XIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Informe seu nome de usuário e defina uma nova senha.
                            </p>

                            {forgotPasswordError && (
                                <Alert type="error" title="Erro" className="mb-4">
                                    {forgotPasswordError}
                                </Alert>
                            )}
                            {forgotPasswordSuccess && (
                                <Alert type="success" title="Sucesso" className="mb-4">
                                    {forgotPasswordSuccess}
                                </Alert>
                            )}

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div>
                                    <label htmlFor="forgotUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome de Usuário *
                                    </label>
                                    <input
                                        id="forgotUsername"
                                        type="text"
                                        value={forgotPasswordUsername}
                                        onChange={(e) => setForgotPasswordUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="seu_usuario"
                                        required
                                        autoComplete="username"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nova Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
                                            aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showNewPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Mínimo de 6 caracteres
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Nova Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmNewPassword"
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
                                            aria-label={showConfirmNewPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showConfirmNewPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setForgotPasswordUsername('');
                                            setNewPassword('');
                                            setConfirmNewPassword('');
                                            setForgotPasswordError(null);
                                            setForgotPasswordSuccess(null);
                                            setShowNewPassword(false);
                                            setShowConfirmNewPassword(false);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={isResettingPassword}
                                    >
                                        {isResettingPassword ? 'Redefinindo...' : 'Redefinir Senha'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Cadastro */}
            {showSignup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" aria-modal="true">
                    <Card className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 truncate pr-2">
                                ✨ Criar Conta
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSignup(false);
                                    setSignupName('');
                                    setSignupEmail('');
                                    setSignupPassword('');
                                    setSignupConfirmPassword('');
                                    setSignupCouponCode('');
                                    setSignupError(null);
                                    setSignupSuccess(null);
                                    setCouponValidated(false);
                                    setValidatedCouponPlan(null);
                                }}
                                className="p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                                aria-label="Fechar"
                            >
                                <XIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {signupError && (
                                <Alert type="error" title="Erro" className="mb-4">
                                    {signupError}
                                </Alert>
                            )}
                            {signupSuccess && (
                                <Alert type="success" title="Sucesso" className="mb-4">
                                    {signupSuccess}
                                </Alert>
                            )}

                            <form onSubmit={handleSignup} className="space-y-4">
                                {/* Campo de Código de Convite */}
                                <div>
                                    <label htmlFor="couponCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Possui código de convite? (Opcional)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="couponCode"
                                            type="text"
                                            value={signupCouponCode}
                                            onChange={(e) => {
                                                setSignupCouponCode(e.target.value.toUpperCase());
                                                setCouponValidated(false);
                                                setValidatedCouponPlan(null);
                                                setSignupError(null);
                                            }}
                                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Ex: ACADEMIA-VIP"
                                            autoComplete="off"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleValidateCoupon}
                                            disabled={!signupCouponCode.trim() || couponValidated}
                                        >
                                            {couponValidated ? '✓' : 'Validar'}
                                        </Button>
                                    </div>
                                    {couponValidated && validatedCouponPlan && (
                                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                            ✓ Código válido! Plano: {validatedCouponPlan}
                                        </p>
                                    )}
                                </div>

                                {/* Nome */}
                                <div>
                                    <label htmlFor="signupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome Completo *
                                    </label>
                                    <input
                                        id="signupName"
                                        type="text"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Seu nome completo"
                                        required
                                        autoComplete="name"
                                    />
                                </div>

                                {/* E-mail */}
                                <div>
                                    <label htmlFor="signupEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        E-mail *
                                    </label>
                                    <input
                                        id="signupEmail"
                                        type="email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="seu@email.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>

                                {/* Senha */}
                                <div>
                                    <label htmlFor="signupPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="signupPassword"
                                            type={showSignupPassword ? "text" : "password"}
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
                                            aria-label={showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showSignupPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Mínimo de 6 caracteres
                                    </p>
                                </div>

                                {/* Confirmar Senha */}
                                <div>
                                    <label htmlFor="signupConfirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="signupConfirmPassword"
                                            type={showSignupConfirmPassword ? "text" : "password"}
                                            value={signupConfirmPassword}
                                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
                                            aria-label={showSignupConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                                        >
                                            {showSignupConfirmPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowSignup(false);
                                            setSignupName('');
                                            setSignupEmail('');
                                            setSignupPassword('');
                                            setSignupConfirmPassword('');
                                            setSignupCouponCode('');
                                            setSignupError(null);
                                            setSignupSuccess(null);
                                            setCouponValidated(false);
                                            setValidatedCouponPlan(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={isSigningUp}
                                    >
                                        {isSigningUp ? 'Criando...' : 'Criar Conta'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LoginPage;

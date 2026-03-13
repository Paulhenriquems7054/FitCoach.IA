import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { loginUser, usernameExists, saveLoginSession, resetPassword, getUserByUsername, registerUser, saveUser } from '../services/databaseService';
import type { User } from '../types';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';
import { XIcon } from '../components/icons/XIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { useToast } from '../components/ui/Toast';
import { getSupabaseClient, getUserFromSupabase } from '../services/supabaseService';
import { getDemoUser } from '../services/demoService';
import { validateCoupon, applyCouponToUser } from '../services/couponService';
import type { LoginCredentials } from '../types';
import { sanitizeInput, sanitizeEmail } from '../utils/security';
import { getAccountType } from '../utils/accountType';
import { logger } from '../utils/logger';
import { acceptInvite, validateInvite } from '../services/inviteService';

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
    
    // Estados para cadastro com código de convite
    const [showSignup, setShowSignup] = useState(false);
    const [signupStep, setSignupStep] = useState<1 | 2>(1); // 1: código, 2: dados de acesso
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
    // Convite B2B2C (academy -> aluno/personal)
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteInfo, setInviteInfo] = useState<{ academyId: string; invitedRole: 'student' | 'personal' } | null>(null);
    // NOVO: Escolha de teste (COM IA ou SEM IA) - apenas para novos usuários sem código
    const [testeComIA, setTesteComIA] = useState<boolean | null>(null);

    // Processar token de acesso do email (quando usuário clica no link do email)
    useEffect(() => {
        // Ler tanto token quanto invite da query string e do hash
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');
        let inviteParam = urlParams.get('invite');

        if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
            if (!token) {
                token = hashParams.get('token');
            }
            if (!inviteParam) {
                inviteParam = hashParams.get('invite');
            }
        }

        if (token) {
            handleTokenLogin(token);
        }

        // Se houver código de convite, validar e armazenar
        if (inviteParam) {
            const cleaned = inviteParam.trim().toUpperCase();
            setInviteCode(cleaned);
            (async () => {
                try {
                    const result = await validateInvite(cleaned);
                    if (!result.valid || !result.academyId || !result.invitedRole) {
                        setInviteError(result.error || 'Convite inválido ou expirado.');
                        // Garantir que inviteInfo seja null quando inválido
                        setInviteInfo(null);
                    } else {
                        setInviteInfo({
                            academyId: result.academyId,
                            invitedRole: result.invitedRole,
                        });
                        setInviteError(null);
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Erro ao validar convite.';
                    setInviteError(msg);
                    // Garantir que inviteInfo seja null em caso de erro
                    setInviteInfo(null);
                }
            })();
        } else {
            // Garantir que inviteInfo seja null quando não há parâmetro invite
            setInviteInfo(null);
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

            // Buscar usuário no Supabase usando getUserFromSupabase que trata erros corretamente
            const localUser = await getUserFromSupabase(userId);
            
            if (!localUser) {
                throw new Error('Usuário não encontrado no banco de dados. Verifique se o cadastro foi concluído corretamente.');
            }

            
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            logger.error('Erro no login por token', 'LoginPage', error);
            const errorMsg = error.message || 'Erro ao processar token de acesso. Tente fazer login manualmente.';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTheme = () => {
        setThemeSetting(theme === 'dark' ? 'light' : 'dark');
    };

    const getThemeIcon = () => {
        return theme === 'dark' ? (
            <MoonIcon className="w-5 h-5" />
        ) : (
            <SunIcon className="w-5 h-5" />
        );
    };

    const getThemeLabel = () => {
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

    const handleEnterDemoMode = async () => {
        try {
            setIsLoading(true);
            const demoUser = await getDemoUser();
            await saveLoginSession(demoUser);
            setUser(demoUser);
            showSuccess('Modo demo ativado! Você está usando uma conta de demonstração.');
            window.location.hash = '#/';
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Não foi possível iniciar o modo demo. Tente novamente.';
            showError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleValidateCoupon = async () => {
        if (!signupCouponCode.trim()) {
            setSignupError('Por favor, informe o código de convite ou código mestre');
            setCouponValidated(false);
            setValidatedCouponPlan(null);
            return;
        }

        setSignupError(null);
        
        // Primeiro, tentar validar como código mestre (master_code)
        const { validateMasterCode } = await import('../services/masterCodeService');
        const masterCodeValidation = await validateMasterCode(signupCouponCode.trim().toUpperCase());
        
        if (masterCodeValidation.isValid && masterCodeValidation.company) {
            // Código mestre válido
            setSignupError(null); // Limpar erros anteriores
            setCouponValidated(true);
            setValidatedCouponPlan(masterCodeValidation.company.planType);
            showSuccess(`Código mestre válido! Você será vinculado à academia: ${masterCodeValidation.company.name}`);
            // Avançar para a etapa 2 (criação de conta) apenas se estiver na etapa 1
            if (signupStep === 1) {
                setSignupStep(2);
            }
            return;
        }
        
        // Se não for código mestre, tentar validar como cupom
        const validation = await validateCoupon(signupCouponCode.trim());
        
        if (validation.isValid && validation.coupon) {
            setSignupError(null); // Limpar erros anteriores
            setCouponValidated(true);
            setValidatedCouponPlan(validation.coupon.planLinked);
            showSuccess(`Código válido! Você receberá o plano: ${validation.coupon.planLinked}`);
            // Avançar para a etapa 2 (criação de conta) apenas se estiver na etapa 1
            if (signupStep === 1) {
                setSignupStep(2);
            }
        } else {
            setCouponValidated(false);
            setValidatedCouponPlan(null);
            // Mostrar erro do código mestre se cupom também falhar
            const errorMsg = masterCodeValidation.error || validation.error || 'Código de convite ou código mestre inválido';
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
            // Fluxo de convite acadêmico (B2B2C) via ?invite=CODE
            // Se há inviteCode válido, não obrigar cupom/código mestre
            // Se não há cupom nem invite, permitir criar conta com trial de 3 dias
            const hasCouponOrInvite = inviteInfo || (signupCouponCode.trim() && couponValidated);
            
            if (!inviteInfo && !signupCouponCode.trim()) {
                // Sem cupom e sem invite - permitir trial gratuito de 3 dias
                // Não precisa validar nada, apenas continuar o fluxo
            } else if (!inviteInfo && signupCouponCode.trim() && !couponValidated) {
                // Tem cupom mas não foi validado - precisa validar
                setSignupError('Por favor, valide seu código de convite antes de concluir o cadastro.');
                    setIsSigningUp(false);
                    return;
            }

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

            // Validar cupom ou código mestre se fornecido
            let couponPlan: string | null = null;
            let isMasterCode = false;
            
            if (signupCouponCode.trim()) {
                // Primeiro, tentar validar como código mestre
                const { validateMasterCode } = await import('../services/masterCodeService');
                const masterCodeValidation = await validateMasterCode(signupCouponCode.trim().toUpperCase());
                
                if (masterCodeValidation.isValid && masterCodeValidation.company) {
                    // É código mestre válido
                    isMasterCode = true;
                    couponPlan = masterCodeValidation.company.planType;
                } else {
                    // Se não for código mestre, tentar validar como cupom
                    const validation = await validateCoupon(signupCouponCode.trim());
                    if (!validation.isValid) {
                        setSignupError(validation.error || 'Código de convite ou código mestre inválido');
                        setIsSigningUp(false);
                        return;
                    }
                    if (validation.coupon) {
                        couponPlan = validation.coupon.planLinked;
                    }
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
                logger.error('Erro ao criar conta no Supabase Auth', 'LoginPage', authError);
                throw new Error(authError.message || 'Erro ao criar conta');
            }

            if (!authData.user) {
                logger.error('Signup retornou sucesso mas sem usuário', 'LoginPage', authData);
                throw new Error('Erro ao criar usuário');
            }

            const userId = authData.user.id;
            logger.info(`Usuário criado no Supabase Auth com ID: ${userId}`, 'LoginPage');
            
            // Verificar se email precisa ser confirmado
            const needsEmailConfirmation = authData.user.email_confirmed_at === null;
            if (needsEmailConfirmation) {
                logger.info('Email precisa ser confirmado antes de fazer login', 'LoginPage');
            }

            // IMPORTANTE: Aguardar um pouco para garantir que o usuário foi commitado em auth.users
            // Isso previne erro de foreign key constraint
            logger.info('Aguardando confirmação de criação do usuário em auth.users...', 'LoginPage');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // NOTA: Não tentar fazer login imediatamente se email confirmation estiver habilitado
            // A função RPC com SECURITY DEFINER pode criar o perfil mesmo sem sessão ativa
            // Tentar fazer login apenas se necessário, mas não bloquear se falhar
            let sessionActive = false;
            try {
                const { data: { user: authUserCheck } } = await supabase.auth.getUser();
                if (authUserCheck && authUserCheck.id === userId) {
                    sessionActive = true;
                    logger.info('Sessão já está ativa após signup', 'LoginPage');
                }
            } catch (checkError) {
                logger.debug('Verificação de sessão falhou (esperado se email confirmation estiver habilitado)', 'LoginPage');
            }

            // Tentar fazer login apenas se a sessão não estiver ativa
            // Se email confirmation estiver habilitado, o login falhará, mas isso é OK
            if (!sessionActive) {
                logger.info('Tentando fazer login após signup para garantir sessão ativa', 'LoginPage');
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: sanitizedEmail,
                    password: signupPassword,
                });

                if (signInError) {
                    // Se email confirmation estiver habilitado, isso é esperado
                    logger.warn('Erro ao fazer login após signup (pode ser email confirmation habilitado)', 'LoginPage', signInError);
                    logger.info('Continuando com criação de perfil usando função RPC (funciona sem sessão)', 'LoginPage');
                    // Continuar mesmo assim - função RPC com SECURITY DEFINER funciona sem sessão
                } else if (signInData?.user) {
                    sessionActive = true;
                    logger.info('Login após signup bem-sucedido, sessão ativa', 'LoginPage');
                }
            }
            const username = sanitizeInput(signupName.trim().toLowerCase().replace(/\s+/g, '_'), 50);

            // Verificar se username já existe (local E Supabase)
            // Primeiro verificar no Supabase (fonte de verdade)
            let usernameToUse = username;
            const { data: existingUserSupabase } = await supabase
                .from('users')
                .select('username')
                .eq('username', usernameToUse)
                .maybeSingle();
            
            // Se não existe no Supabase, verificar local (pode ter sido criado localmente)
            let exists = !!existingUserSupabase;
            if (!exists) {
                exists = await usernameExists(usernameToUse);
            }
            
            if (exists) {
                // Se já existe, adicionar número até encontrar um disponível
                let counter = 1;
                while (exists) {
                    usernameToUse = `${username}_${counter}`;
                    // Verificar no Supabase primeiro
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('username')
                        .eq('username', usernameToUse)
                        .maybeSingle();
                    
                    exists = !!existingUser;
                    if (!exists) {
                        // Verificar local também
                        exists = await usernameExists(usernameToUse);
                    }
                    counter++;
                }
            }

            // Determinar tipo de conta e inicializar trial
            const accountType: 'individual' | 'academy' = (couponPlan && (couponPlan.includes('academy') || couponPlan.includes('personal'))) 
                ? 'academy' 
                : 'individual';
            
            const now = new Date();
            
            // Se não há cupom nem invite (usuário comum sem cupom), criar trial de 3 dias
            const isTrialWithoutCoupon = !hasCouponOrInvite;
            const trialDays = isTrialWithoutCoupon ? 3 : (accountType === 'individual' ? 7 : 14);
            const trialEndDate = new Date(now);
            trialEndDate.setDate(trialEndDate.getDate() + trialDays);
            
            // Se cupom válido e plano pago, usar 'active', senão iniciar com 'trial'
            const subscriptionStatus = (couponPlan && couponPlan !== 'free') ? 'active' as const : 'trial' as const;
            
            // Criar registro na tabela users com plano do cupom
            const userData = {
                nome: sanitizeInput(signupName.trim(), 100),
                username: usernameToUse,
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
                subscriptionStatus: subscriptionStatus,
                accountType: accountType,
                // Para trial de 3 dias (sem cupom), usar expiryDate em vez de trialEndDate
                expiryDate: subscriptionStatus === 'trial' ? trialEndDate.toISOString() : undefined,
                trialStartDate: subscriptionStatus === 'trial' ? now.toISOString() : undefined,
                trialEndDate: subscriptionStatus === 'trial' ? trialEndDate.toISOString() : undefined,
                // Limite de voz diário: 300 segundos (5 minutos) para trial sem cupom, 900 (15 minutos) para premium
                voiceDailyLimitSeconds: isTrialWithoutCoupon ? 300 : 900,
                // Campos de IA B2B2C: se veio de invite de aluno, trial de IA será setado em acceptInvite
                aiSubscriptionStatus: inviteInfo && inviteInfo.invitedRole === 'student' ? 'trial' : 'none',
                aiTrialStartAt: inviteInfo && inviteInfo.invitedRole === 'student' ? now.toISOString() : null,
                aiTrialEndAt: inviteInfo && inviteInfo.invitedRole === 'student' ? trialEndDate.toISOString() : null,
            };

            // Criar usuário no banco local (IndexedDB)
            // Nota: usernameToUse pode ser diferente de username se houve conflito
            // IMPORTANTE: Se usernameToUse existe apenas localmente (mas não no Supabase),
            // podemos sobrescrever usando saveUser em vez de registerUser
            let newUser: User;
            try {
                newUser = await registerUser(usernameToUse, signupPassword, userData);
            } catch (registerError) {
                // Se registerUser falhou porque username existe localmente,
                // mas não existe no Supabase, podemos sobrescrever o registro local
                const errorMsg = registerError instanceof Error ? registerError.message : '';
                if (errorMsg.includes('já está em uso')) {
                    // Verificar novamente no Supabase para ter certeza
                    const { data: checkUser } = await supabase
                        .from('users')
                        .select('username')
                        .eq('username', usernameToUse)
                        .maybeSingle();
                    
                    if (!checkUser) {
                        // Não existe no Supabase, mas existe localmente - sobrescrever
                        logger.warn(`Username ${usernameToUse} existe localmente mas não no Supabase. Sobrescrevendo registro local.`, 'LoginPage');
                        const existingUser = await getUserByUsername(usernameToUse);
                        if (existingUser) {
                            // Atualizar usuário existente com novos dados
                            await saveUser({ ...userData, username: usernameToUse });
                            newUser = { ...userData, username: usernameToUse } as User;
                        } else {
                            throw registerError;
                        }
                    } else {
                        // Existe no Supabase também - realmente está em uso
                        throw registerError;
                    }
                } else {
                    throw registerError;
                }
            }

            // ✅ NOVO FLUXO: O trigger automático cria o perfil, apenas precisamos aguardar e buscar
            // O trigger handle_new_user() cria o perfil automaticamente após signup
            logger.info('Aguardando trigger criar perfil automaticamente...', 'LoginPage');
            
            // Aguardar um pouco para o trigger processar
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Buscar o perfil criado pelo trigger (com retry para lidar com timing)
            let userProfile = null;
            const maxRetries = 5;
            const retryDelay = 500;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    logger.info(`Buscando perfil do usuário (tentativa ${attempt + 1}/${maxRetries})...`, 'LoginPage');
                    
                    const { data: profileData, error: profileError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle(); // maybeSingle retorna null se não encontrar (não lança erro)
                    
                    if (profileError) {
                        // Se for erro 406 (Not Acceptable) ou 403 (Forbidden), pode ser que o perfil ainda não existe
                        // ou RLS está bloqueando. Aguardar e tentar novamente.
                        if (profileError.code === 'PGRST116' || (profileError as any).status === 406 || (profileError as any).status === 403) {
                            if (attempt < maxRetries - 1) {
                                logger.info(`Perfil ainda não encontrado (tentativa ${attempt + 1}), aguardando ${retryDelay}ms...`, 'LoginPage');
                                await new Promise(resolve => setTimeout(resolve, retryDelay));
                                continue;
                            }
                        } else {
                            // Outro tipo de erro, logar e continuar tentando
                            logger.warn(`Erro ao buscar perfil (tentativa ${attempt + 1}):`, 'LoginPage', profileError);
                            if (attempt < maxRetries - 1) {
                                await new Promise(resolve => setTimeout(resolve, retryDelay));
                                continue;
                            }
                        }
                    } else if (profileData) {
                        // Perfil encontrado!
                        userProfile = profileData;
                        logger.info('✅ Perfil encontrado!', 'LoginPage', { userId: profileData.id, username: profileData.username });
                        break;
                    } else {
                        // Perfil não encontrado ainda, aguardar e tentar novamente
                        if (attempt < maxRetries - 1) {
                            logger.info(`Perfil ainda não criado (tentativa ${attempt + 1}), aguardando ${retryDelay}ms...`, 'LoginPage');
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                            continue;
                        }
                    }
                } catch (err) {
                    logger.warn(`Exceção ao buscar perfil (tentativa ${attempt + 1}):`, 'LoginPage', err);
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }
            }
            
            // Se o perfil não foi encontrado após todas as tentativas
            if (!userProfile) {
                logger.warn('Perfil não foi encontrado após todas as tentativas. O trigger pode não ter executado ainda.', 'LoginPage');
                // Não lançar erro - o perfil pode ser criado posteriormente pelo trigger
                // O usuário pode fazer login depois quando o perfil estiver disponível
            } else {
                logger.info('Perfil do usuário criado com sucesso pelo trigger!', 'LoginPage');
            }

            // Aplicar cupom ou vincular via código mestre (apenas se fornecido)
            if (signupCouponCode.trim()) {
                // Primeiro, tentar vincular via código mestre
                const { validateMasterCode, linkUserToCompanyByMasterCode } = await import('../services/masterCodeService');
                const masterCodeValidation = await validateMasterCode(signupCouponCode.trim().toUpperCase());
                
                if (masterCodeValidation.isValid && masterCodeValidation.company) {
                    // Vincular usuário à academia via código mestre
                    // Passar o email para permitir verificação automática de admin
                    const linkResult = await linkUserToCompanyByMasterCode(
                        signupCouponCode.trim().toUpperCase(), 
                        userId,
                        sanitizedEmail // Passar email para verificação de admin
                    );
                    if (!linkResult.success) {
                        logger.warn('Erro ao vincular via código mestre', 'LoginPage', { error: linkResult.error });
                        // Não bloquear o cadastro se falhar vincular
                    } else {
                        if (linkResult.isAdmin) {
                            logger.info(`Usuário ${userId} vinculado à academia ${linkResult.companyId} via master_code como ADMINISTRADOR`, 'LoginPage');
                        } else {
                            logger.info(`Usuário ${userId} vinculado à academia ${linkResult.companyId} via master_code como ALUNO`, 'LoginPage');
                        }
                    }
                } else if (couponPlan) {
                    // Se não for código mestre, tentar aplicar cupom
                    const applyResult = await applyCouponToUser(signupCouponCode.trim(), userId);
                    if (!applyResult.success) {
                        logger.warn('Erro ao aplicar cupom', 'LoginPage', { error: applyResult.error });
                        // Não bloquear o cadastro se falhar aplicar o cupom
                    }
                }
            }

            // NOVA LÓGICA: Trial apenas para usuários indicados (sem código de academia)
            // Se o usuário NÃO tem código de convite da academia, dar trial de 3 dias
            const isReferredUser = !inviteCode && !signupCouponCode.trim();
            
            if (isReferredUser) {
                try {
                    const now = new Date();
                    // NOVO MODELO: Ativar modo demo (3 interações) apenas se escolheu "Testar COM IA"
                    // Se escolheu "Testar SEM IA", não ativa modo demo
                    if (testeComIA === true) {
                        try {
                            const { deveAtivarModoDemo } = await import('../services/novoAiAccessService');
                            const { getUser } = await import('../services/databaseService');
                            const userData = await getUser();
                            
                            if (userData) {
                                await deveAtivarModoDemo(userData);
                                logger.info(`Modo demo ativado para novo usuário ${userId} (escolheu COM IA)`, 'LoginPage');
                            }
                        } catch (err) {
                            logger.warn('Erro ao ativar modo demo para usuário indicado', 'LoginPage', err);
                        }
                    } else if (testeComIA === false) {
                        // Usuário escolheu "SEM IA" - registrar data de início do teste (3 dias)
                        try {
                            const supabase = getSupabaseClient();
                            const { error: updateError } = await supabase
                                .from('users')
                                .update({
                                    teste_sem_ia_inicio: new Date().toISOString()
                                })
                                .eq('id', userId);
                            
                            if (updateError) {
                                logger.warn('Erro ao registrar início do teste SEM IA', 'LoginPage', updateError);
                            } else {
                                logger.info(`Teste SEM IA iniciado para usuário ${userId} - expira em 3 dias`, 'LoginPage');
                            }
                        } catch (err) {
                            logger.warn('Erro ao processar início do teste SEM IA', 'LoginPage', err);
                        }
                    }
                } catch (err) {
                    logger.warn('Erro ao processar modo demo para usuário indicado', 'LoginPage', err);
                }
            }

            // Se veio de invite acadêmico, aceitar convite (vincular academy_id/tenant_role - SEM trial)
            if (inviteCode && inviteInfo) {
                try {
                    await acceptInvite(inviteCode, userId);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Erro ao vincular convite da academia.';
                    logger.warn(msg, 'LoginPage');
                }
            }

            // Mensagem de sucesso com instruções claras
            let successMessage = `Conta criada com sucesso!`;
            if (needsEmailConfirmation) {
                successMessage += `\n\n📧 Verifique sua caixa de entrada e confirme o email antes de fazer login.`;
                successMessage += `\n\nApós confirmar, use o email "${sanitizedEmail}" para fazer login.`;
            } else {
                successMessage += `\n\nUse o email "${sanitizedEmail}" para fazer login.`;
            }
            
            setSignupSuccess(successMessage);
            showSuccess(needsEmailConfirmation 
                ? 'Conta criada! Verifique seu email para confirmar antes de fazer login.'
                : `Conta criada com sucesso! Use o email "${sanitizedEmail}" para fazer login.`
            );

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

            // Backdoor de desenvolvedor: acesso total com usuário/senha fixos
            // Aceita "dev", "dev123" ou "Desenvolvedor" como username, sempre com senha "dev123"
            if ((sanitizedUsername === 'dev' || sanitizedUsername === 'dev123' || sanitizedUsername === 'Desenvolvedor') && sanitizedPassword === 'dev123') {
                // Importante: encerrar qualquer sessão Supabase anterior (ex.: Paulo) para não sobrescrever o usuário dev
                try {
                    const supabase = getSupabaseClient();
                    await supabase.auth.signOut();
                } catch (signOutError) {
                    logger.warn('Não foi possível fazer signOut do Supabase ao entrar como desenvolvedor', 'LoginPage', signOutError);
                }

                const devUser = {
                    id: 'dev123',
                    nome: 'Desenvolvedor',
                    username: 'dev123',
                    idade: 30,
                    genero: 'Masculino' as const,
                    peso: 80,
                    altura: 175,
                    objetivo: 'perder peso' as const,
                    points: 0,
                    disciplineScore: 0,
                    completedChallengeIds: [] as string[],
                    isAnonymized: false,
                    weightHistory: [] as any[],
                    role: 'user' as const,
                    subscription: 'free' as const,
                    planType: 'free' as const,
                    subscriptionStatus: 'active' as const,
                    gymRole: 'admin' as const,
                };

                // Limpar sessão anterior e salvar nova
                const { clearLoginSession } = await import('../services/databaseService');
                await clearLoginSession();
                // IMPORTANTE: Salvar usuário no IndexedDB para que checkVoiceUsage() possa encontrá-lo
                await saveUser(devUser as any);
                await saveLoginSession(devUser.username);
                setUser(devUser as any);
                showSuccess('Login como Desenvolvedor realizado com sucesso!');
                setTimeout(() => {
                    window.location.hash = '#/admin-dashboard';
                }, 1000);
                setIsLoading(false);
                return;
            }

            // Tratamento especial para Administrador: garantir que o login funcione corretamente
            if (sanitizedUsername === 'Administrador' || sanitizedUsername.toLowerCase() === 'administrador') {
                // Encerrar qualquer sessão Supabase anterior para evitar conflitos
                try {
                    const supabase = getSupabaseClient();
                    await supabase.auth.signOut();
                } catch (signOutError) {
                    logger.warn('Não foi possível fazer signOut do Supabase ao entrar como Administrador', 'LoginPage', signOutError);
                }

                // Tentar buscar o usuário Administrador no banco local primeiro
                const adminUser = await getUserByUsername('Administrador');
                if (adminUser) {
                    // Verificar senha
                    const { loginUser } = await import('../services/databaseService');
                    const credentials: LoginCredentials = { 
                        username: 'Administrador', 
                        password: sanitizedPassword 
                    };
                    const loggedInAdmin = await loginUser(credentials);
                    
                    if (loggedInAdmin) {
                        // Limpar sessão anterior e salvar nova
                        const { clearLoginSession } = await import('../services/databaseService');
                        await clearLoginSession();
                        await saveLoginSession('Administrador');
                        await new Promise(resolve => setTimeout(resolve, 100));
                        setUser(loggedInAdmin);
                        showSuccess('Login como Administrador realizado com sucesso!');
                        setTimeout(() => {
                            window.location.hash = '#/';
                        }, 1000);
                        setIsLoading(false);
                        return;
                    }
                }
                // Se não encontrou ou senha incorreta, continuar com fluxo normal
            }

            let user: any = null;
            let loginMethod = '';

            // Tentar login no Supabase primeiro (usuários criados com email/Supabase)
            let emailFromDB: string | null = null; // Declarar fora do try para uso posterior
            let emailAttempts: string[] = []; // Declarar fora do try para uso no erro
            let lastSupabaseError: { message: string; code?: string; details?: string } | null = null; // Armazenar último erro do Supabase
            try {
                const supabase = getSupabaseClient();
                
                // Primeiro, tentar buscar o usuário na tabela users pelo username, email OU nome para obter o email
                let userIdFromDB: string | null = null;
                try {
                    // Se o input parece email, buscar por email primeiro
                    if (sanitizedUsername.includes('@')) {
                        const { data: userDataByEmail } = await supabase
                            .from('users')
                            .select('id, username, email')
                            .eq('email', sanitizedUsername)
                            .maybeSingle();
                        
                        if (userDataByEmail) {
                            userIdFromDB = userDataByEmail.id;
                            emailFromDB = userDataByEmail.email || sanitizedUsername;
                        }
                    }

                    // Se não encontrou por email, buscar por username
                    if (!emailFromDB) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('id, username, email')
                            .eq('username', sanitizedUsername)
                            .maybeSingle();
                        
                        if (userData) {
                            userIdFromDB = userData.id;
                            emailFromDB = userData.email || null; // Email salvo na tabela users
                        }
                    }

                    // Se ainda não encontrou e o input NÃO parece email, tentar pelo nome (nome completo ou primeiro nome)
                    if (!emailFromDB && !sanitizedUsername.includes('@')) {
                        // 1) Tentar match exato de nome (case insensitive)
                        const { data: userByFullName } = await supabase
                            .from('users')
                            .select('id, username, email, nome')
                            .ilike('nome', sanitizedUsername)
                            .maybeSingle();

                        if (userByFullName) {
                            userIdFromDB = userByFullName.id;
                            emailFromDB = userByFullName.email || null;
                        } else {
                            // 2) Tentar pelo primeiro nome (primeira palavra)
                            const firstName = sanitizedUsername.split(' ')[0];
                            if (firstName) {
                                const { data: userByFirstName } = await supabase
                                    .from('users')
                                    .select('id, username, email, nome')
                                    .ilike('nome', `${firstName}%`)
                                    .maybeSingle();

                                if (userByFirstName) {
                                    userIdFromDB = userByFirstName.id;
                                    emailFromDB = userByFirstName.email || null;
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Ignorar erro ao buscar usuário
                    logger.debug('Erro ao buscar usuário na tabela users', 'LoginPage', e);
                }
                
                // Tentar múltiplas variações de email
                emailAttempts = [
                    // PRIORIDADE 1: Email da tabela users (se encontrado) ou input se parece email
                    emailFromDB || (sanitizedUsername.includes('@') ? sanitizedUsername : null),
                    // PRIORIDADE 2: Se username parece email, usar diretamente (já incluído acima se emailFromDB não existe)
                    sanitizedUsername.includes('@') && !emailFromDB ? sanitizedUsername : null,
                    // PRIORIDADE 3: Tentar username@fitcoach.ia (padrão usado no cadastro) - apenas se não parece email
                    !sanitizedUsername.includes('@') ? `${sanitizedUsername}@fitcoach.ia` : null,
                    // PRIORIDADE 4: Username direto (pode funcionar se email = username) - apenas se não parece email
                    !sanitizedUsername.includes('@') ? sanitizedUsername : null,
                ].filter(Boolean) as string[];

                logger.info(`Tentando login com ${emailAttempts.length} variações de email:`, 'LoginPage', emailAttempts);

                for (const email of emailAttempts) {
                    try {
                        logger.info(`Tentando login com email: ${email}`, 'LoginPage');
                        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                            email: email,
                            password: sanitizedPassword,
                        });

                        if (authData?.user && !authError) {
                            // Login no Supabase bem-sucedido
                            loginMethod = 'supabase';
                            logger.info(`✅ Login bem-sucedido para usuário ${authData.user.id} (${email})`, 'LoginPage');
                            
                            // Buscar perfil do usuário usando getUserFromSupabase (evita erro 406)
                            let userProfile = null;
                            try {
                                userProfile = await getUserFromSupabase(authData.user.id);
                            } catch (profileError) {
                                logger.warn('Erro ao buscar perfil com getUserFromSupabase:', 'LoginPage', profileError);
                                // Continuar tentando outras formas
                            }
                            
                            // Se não encontrou perfil, tentar buscar usando authService como fallback
                            if (!userProfile) {
                                try {
                                    const { authService } = await import('../services/supabaseService');
                                    userProfile = await authService.getCurrentUserProfile();
                                } catch (serviceError) {
                                    logger.warn('Erro ao buscar perfil com authService:', 'LoginPage', serviceError);
                                }
                            }
                            
                            // Se ainda não encontrou perfil, aguardar um pouco e tentar novamente
                            // O trigger deve criar o perfil automaticamente após signup
                            if (!userProfile) {
                                logger.info(`Perfil não encontrado para usuário ${authData.user.id}, aguardando trigger criar...`, 'LoginPage');
                                
                                // Aguardar um pouco para o trigger processar
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                
                                // Tentar buscar novamente (com retry)
                                for (let retryAttempt = 0; retryAttempt < 5; retryAttempt++) {
                                    try {
                                        const { data: retryProfile, error: retryError } = await supabase
                                            .from('users')
                                            .select('*')
                                            .eq('id', authData.user.id)
                                            .maybeSingle();
                                        
                                        if (retryProfile) {
                                            userProfile = retryProfile;
                                            logger.info(`✅ Perfil encontrado após retry (tentativa ${retryAttempt + 1})!`, 'LoginPage');
                                            break;
                                        } else if (retryError) {
                                            // Logar erros que não sejam "não encontrado"
                                            if (retryError.code !== 'PGRST116' && retryError.code !== 'PGRST301') {
                                                logger.warn(`Erro ao buscar perfil (tentativa ${retryAttempt + 1}):`, 'LoginPage', {
                                                    code: retryError.code,
                                                    message: retryError.message,
                                                    status: (retryError as any).status
                                                });
                                            }
                                        }
                                    } catch (retryErr) {
                                        logger.warn(`Exceção ao buscar perfil (tentativa ${retryAttempt + 1}):`, 'LoginPage', retryErr);
                                    }
                                    
                                    if (retryAttempt < 4) {
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                    }
                                }
                                
                                if (!userProfile) {
                                    logger.error(`❌ Perfil não encontrado após todas as tentativas para usuário ${authData.user.id}`, 'LoginPage');
                                    
                                    // Informar ao usuário sobre o problema - lançar erro específico
                                    const profileError = new Error(`Login bem-sucedido, mas perfil não encontrado.\n\nO seu email e senha estão corretos, mas o perfil não foi criado na tabela 'users'.\n\nEmail: ${email}\nID do usuário: ${authData.user.id}\n\nPossíveis causas:\n• O trigger não executou após o cadastro\n• O perfil foi criado com outro ID\n• Problema com Row Level Security (RLS)\n\nSolução:\n• Verifique no Supabase Dashboard:\n  - Authentication → Users (procure pelo email)\n  - Table Editor → users (procure pelo ID acima)\n• Execute a migration 008_trigger_perfil_simples.sql se ainda não foi executada\n• Entre em contato com o suporte se o problema persistir`);
                                    
                                    // Armazenar erro para exibir na mensagem final
                                    lastSupabaseError = {
                                        message: profileError.message,
                                        code: 'PROFILE_NOT_FOUND',
                                        details: `Usuário autenticado com sucesso (ID: ${authData.user.id}), mas perfil não encontrado na tabela users`
                                    };
                                    
                                    throw profileError;
                                }
                            }
                            
                            if (userProfile) {
                                user = userProfile;
                                logger.info(`✅ Perfil carregado com sucesso para ${email}`, 'LoginPage');
                                break;
                            }
                        } else if (authError) {
                            // Verificar tipo de erro específico
                            const errorMsg = authError.message || '';
                            const errorCode = (authError as any).code || (authError as any).statusCode || '';
                            const errorDetails = (authError as any).error_description || (authError as any).msg || '';
                            
                            // Armazenar erro para exibir na mensagem final
                            lastSupabaseError = {
                                message: errorMsg,
                                code: errorCode,
                                details: errorDetails
                            };
                            
                            // Log detalhado para debugging
                            logger.warn(`❌ Login falhou para email "${email}":`, 'LoginPage', {
                                error: errorMsg,
                                status: authError.status,
                                code: errorCode,
                                details: errorDetails,
                                fullError: authError
                            });
                            
                            // Log também no console para o usuário ver
                            console.error('[LoginPage] Erro do Supabase:', {
                                email,
                                message: errorMsg,
                                code: errorCode,
                                details: errorDetails,
                                status: authError.status
                            });
                            
                            // Verificar se é email não confirmado (pode aparecer em diferentes formatos)
                            const isEmailNotConfirmed = 
                                errorMsg.toLowerCase().includes('email not confirmed') ||
                                errorMsg.toLowerCase().includes('email_not_confirmed') ||
                                errorMsg.toLowerCase().includes('email address not confirmed') ||
                                errorMsg.toLowerCase().includes('email not verified') ||
                                errorMsg.toLowerCase().includes('verification') ||
                                errorCode === 'email_not_confirmed' ||
                                errorDetails.toLowerCase().includes('email not confirmed');
                            
                            if (isEmailNotConfirmed) {
                                // Email não confirmado - mostrar mensagem específica
                                logger.error(`Email "${email}" não foi confirmado`, 'LoginPage');
                                throw new Error(`Email não confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.\n\nEmail tentado: ${email}`);
                            }
                            
                            // Verificar rate limit
                            if (errorMsg.includes('rate limit') || 
                                errorMsg.includes('For security purposes') ||
                                errorMsg.includes('Too Many Requests') ||
                                authError.status === 429) {
                                // Rate limit - propagar erro com mensagem amigável
                                const match = errorMsg.match(/(\d+)\s*seconds?/i);
                                const seconds = match ? match[1] : 'alguns';
                                throw new Error(`Muitas tentativas de login. Por segurança, aguarde ${seconds} segundos antes de tentar novamente.`);
                            }
                            
                            // Erros 400 (Bad Request) - credenciais inválidas ou usuário não existe
                            if (authError.status === 400) {
                                // Verificar se é a última tentativa de email
                                const isLastEmail = email === emailAttempts[emailAttempts.length - 1];
                                
                                if (isLastEmail) {
                                    // Se é a última tentativa, lançar erro com detalhes
                                    const specificError = errorMsg || errorDetails || 'Credenciais inválidas';
                                    logger.error(`Todas as tentativas de login falharam. Último erro: ${specificError}`, 'LoginPage');
                                    
                                    // Criar mensagem de erro detalhada
                                    let detailedError = `Erro ao fazer login: ${specificError}`;
                                    
                                    // Verificar se o erro indica que o usuário não existe
                                    const userNotFound = 
                                        errorMsg.toLowerCase().includes('user not found') ||
                                        errorMsg.toLowerCase().includes('no user found') ||
                                        errorMsg.toLowerCase().includes('invalid login') ||
                                        errorMsg.toLowerCase().includes('invalid credentials');
                                    
                                    if (userNotFound) {
                                        detailedError = `Usuário não encontrado ou credenciais inválidas.\n\nErro do Supabase: ${specificError}\n\nVerifique:\n• Se o email "${email}" está correto\n• Se você completou o cadastro\n• Se a senha está correta\n• Se o email foi confirmado (verifique sua caixa de entrada)`;
                                    }
                                    
                                    throw new Error(detailedError);
                                } else {
                                    // Não é a última tentativa, continuar
                                    logger.debug(`Credenciais inválidas para email "${email}", tentando próxima variação...`, 'LoginPage');
                                    continue;
                                }
                            }
                            
                            // Outros erros - logar e tentar próxima variação
                            logger.warn(`Erro desconhecido ao tentar login com "${email}": ${errorMsg}`, 'LoginPage');
                            continue;
                        }
                    } catch (supabaseError) {
                        // Capturar erro lançado ou erro de rede
                        if (supabaseError instanceof Error) {
                            // Se for um erro que lançamos intencionalmente (email não confirmado, etc), propagar
                            if (supabaseError.message.includes('Email não confirmado') ||
                                supabaseError.message.includes('Muitas tentativas') ||
                                supabaseError.message.includes('Usuário não encontrado') ||
                                supabaseError.message.includes('Erro ao fazer login')) {
                                throw supabaseError;
                            }
                            
                            // Se for rate limit, propagar
                            if (supabaseError.message.includes('rate limit') || 
                                supabaseError.message.includes('For security purposes')) {
                                throw supabaseError;
                            }
                        }
                        
                        // Silenciar outros erros do Supabase e continuar para próxima tentativa ou login local
                        logger.debug(`Erro capturado no catch, tentando próxima variação ou login local`, 'LoginPage', supabaseError);
                        continue;
                    }
                }
            } catch (supabaseError) {
                // Se for um erro que lançamos intencionalmente, propagar diretamente
                if (supabaseError instanceof Error) {
                    // Erros que devem ser mostrados ao usuário
                    if (supabaseError.message.includes('Email não confirmado') ||
                        supabaseError.message.includes('Usuário não encontrado') ||
                        supabaseError.message.includes('Erro ao fazer login') ||
                        supabaseError.message.includes('Login bem-sucedido, mas perfil não encontrado')) {
                        throw supabaseError;
                    }
                    
                    // Rate limit - propagar com mensagem amigável
                    if (supabaseError.message.includes('rate limit') || 
                        supabaseError.message.includes('For security purposes')) {
                        const match = supabaseError.message.match(/(\d+)\s*seconds?/i);
                        const seconds = match ? match[1] : 'alguns';
                        throw new Error(`Muitas tentativas de login. Por segurança, aguarde ${seconds} segundos antes de tentar novamente.`);
                    }
                }
                
                // Se não for erro crítico, continuar para login local
                logger.debug('Erro do Supabase capturado, tentando login local', 'LoginPage', supabaseError);
            }

            // Se não conseguiu login no Supabase, tentar login local (IndexedDB)
            // Mas apenas se não tentamos Supabase (ou seja, se emailFromDB não foi encontrado)
            // Se tentamos Supabase mas falhou, provavelmente é um usuário do Supabase com credenciais erradas
            if (!user) {
                // Primeiro, tentar buscar o email novamente na tabela users para garantir
                // que não perdemos nenhuma oportunidade
                let finalEmailAttempt: string | null = null;
                if (!emailFromDB) {
                    try {
                        const supabase = getSupabaseClient();
                        // Se input parece email, buscar por email
                        if (sanitizedUsername.includes('@')) {
                            const { data: userDataByEmail } = await supabase
                                .from('users')
                                .select('email')
                                .eq('email', sanitizedUsername)
                                .maybeSingle();
                            if (userDataByEmail?.email) {
                                finalEmailAttempt = userDataByEmail.email;
                            }
                        }
                        
                        // Se não encontrou por email, buscar por username
                        if (!finalEmailAttempt) {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('email')
                                .eq('username', sanitizedUsername)
                                .maybeSingle();
                            if (userData?.email) {
                                finalEmailAttempt = userData.email;
                            }
                        }
                        
                        // Tentar login no Supabase com o email encontrado
                        if (finalEmailAttempt) {
                            try {
                                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                                    email: finalEmailAttempt,
                                    password: sanitizedPassword,
                                });
                                
                                if (authData?.user && !authError) {
                                    // Buscar dados do usuário
                                    const { data: userData } = await supabase
                                        .from('users')
                                        .select('*')
                                        .eq('id', authData.user.id)
                                        .maybeSingle();
                                    
                                    if (userData) {
                                        user = {
                                            id: userData.id,
                                            nome: userData.nome || sanitizedUsername,
                                            username: userData.username || sanitizedUsername,
                                            email: userData.email || finalEmailAttempt,
                                            idade: userData.idade || 0,
                                            genero: userData.genero || 'Masculino',
                                            peso: userData.peso || 0,
                                            altura: userData.altura || 0,
                                            objetivo: (userData.objetivo || 'perder peso') as any,
                                            points: userData.points || 0,
                                            disciplineScore: userData.discipline_score || 0,
                                            completedChallengeIds: userData.completed_challenge_ids || [],
                                            isAnonymized: userData.is_anonymized || false,
                                            weightHistory: [],
                                            role: userData.role || 'user',
                                            subscription: 'free',
                                            planType: (userData.plan_type as any) || 'free',
                                            subscriptionStatus: (userData.subscription_status as any) || 'active',
                                        };
                                        loginMethod = 'supabase';
                                    }
                                }
                            } catch (e) {
                                // Ignorar erro e tentar login local
                                logger.debug('Tentativa final de login Supabase falhou, tentando login local', 'LoginPage');
                            }
                        }
                    } catch (e) {
                        // Ignorar erro e tentar login local
                        logger.debug('Erro ao buscar email final, tentando login local', 'LoginPage');
                    }
                }
                
                // Se ainda não conseguiu, tentar login local (IndexedDB)
                if (!user) {
                    const credentials: LoginCredentials = { 
                        username: sanitizedUsername, 
                        password: sanitizedPassword 
                    };
                    user = await loginUser(credentials);
                    if (user) {
                        loginMethod = 'local';
                    }
                }
            }

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
                        logger.warn('Erro ao sincronizar status no login', 'LoginPage', error);
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

                // IMPORTANTE: Salvar sessão ANTES de atualizar o contexto
                // Isso garante que o current_username seja atualizado antes de qualquer recarregamento
                const usernameToSave = user.username || sanitizedUsername;
                
                // Limpar sessão anterior para evitar conflitos
                const { clearLoginSession } = await import('../services/databaseService');
                await clearLoginSession();
                
                // Aguardar um pouco para garantir que a limpeza foi concluída
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Salvar nova sessão
                await saveLoginSession(usernameToSave);
                
                // Aguardar um pouco para garantir que o saveLoginSession foi concluído
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Atualizar contexto do usuário com o usuário do login
                setUser(user);
                
                // Forçar recarregamento do usuário do banco para garantir consistência
                // Usar o username exato que foi usado no login
                try {
                    const reloadedUser = await getUserByUsername(usernameToSave);
                    if (reloadedUser && (reloadedUser.username === usernameToSave || reloadedUser.nome === usernameToSave)) {
                        // Verificar se é realmente o usuário correto
                        setUser(reloadedUser);
                        logger.info(`Usuário recarregado após login: ${usernameToSave}`, 'LoginPage');
                    } else {
                        // Se não encontrou ou não corresponde, usar o usuário do login
                        logger.warn(`Usuário recarregado não corresponde ao login esperado. Usando usuário do login.`, 'LoginPage');
                    }
                } catch (reloadError) {
                    // Se falhar ao recarregar, usar o usuário do login
                    logger.warn('Erro ao recarregar usuário após login', 'LoginPage', reloadError);
                }
                
                const successMsg = 'Login realizado com sucesso!';
                setSuccess(successMsg);
                showSuccess(successMsg);
                
                // Verificar se é aluno e se já respondeu a enquete
                // O flag da enquete é específico por usuário (username)
                const usernameForSurvey = user.username || sanitizedUsername;
                const SURVEY_STORAGE_FLAG = `nutriIA_enquete_v2_done_${usernameForSurvey}`;
                const hasAnsweredSurvey = localStorage.getItem(SURVEY_STORAGE_FLAG);

                const accountType = getAccountType(user);
                
                // Debug: verificação de enquete (apenas em DEV)
                if (import.meta.env?.MODE === 'development' || import.meta.env?.DEV) {
                  logger.debug('Verificação de enquete', 'LoginPage', {
                    username: usernameForSurvey,
                    gymRole: user.gymRole,
                    flag: SURVEY_STORAGE_FLAG,
                    hasAnswered: hasAnsweredSurvey,
                    accountType,
                  });
                }
                
                // Redirecionar baseado no tipo de conta
                // - USER_PERSONAL: Progresso como home (/analysis)
                // - USER_GYM/USER_B2C: mantêm lógica atual (survey para aluno, home para demais)
                let redirectPath = '#/';

                if (accountType === 'USER_PERSONAL') {
                    redirectPath = '#/analysis';
                } else {
                    // Verificar se usuário não respondeu a enquete (para alunos e usuários B2C)
                    // A enquete deve aparecer para:
                    // 1. Alunos (gymRole === 'student')
                    // 2. Usuários B2C (accountType === 'USER_B2C' e sem gymRole)
                    const shouldShowSurvey = !hasAnsweredSurvey && (
                        user.gymRole === 'student' || 
                        (accountType === 'USER_B2C' && !user.gymRole)
                    );
                    
                    if (shouldShowSurvey) {
                        redirectPath = '#/welcome-survey';
                    } else {
                        redirectPath = '#/';
                    }
                }
                
                // Redirecionar após 1 segundo
                setTimeout(() => {
                    window.location.hash = redirectPath;
                }, 1000);
            } else {
                // Mensagem de erro mais clara e específica
                let errorMsg = '❌ Login falhou.';
                
                // Adicionar informações sobre o que foi tentado
                const attemptedEmails = emailAttempts || [];
                if (attemptedEmails.length > 0) {
                    errorMsg += `\n\n📧 Emails tentados: ${attemptedEmails.join(', ')}`;
                }
                
                // Adicionar erro específico do Supabase se disponível
                if (lastSupabaseError) {
                    const supabaseMsg = lastSupabaseError.message || lastSupabaseError.details || '';
                    if (supabaseMsg) {
                        errorMsg += `\n\n🔍 Erro do Supabase: ${supabaseMsg}`;
                        
                        // Traduzir erros comuns do Supabase
                        if (supabaseMsg.toLowerCase().includes('invalid login credentials') ||
                            supabaseMsg.toLowerCase().includes('invalid credentials') ||
                            supabaseMsg.toLowerCase().includes('invalid password')) {
                            errorMsg += '\n\n💡 Tradução: Email ou senha incorretos.';
                        } else if (supabaseMsg.toLowerCase().includes('email not confirmed') ||
                                  supabaseMsg.toLowerCase().includes('email_not_confirmed')) {
                            errorMsg += '\n\n💡 Tradução: Email não confirmado. Verifique sua caixa de entrada.';
                        } else if (supabaseMsg.toLowerCase().includes('user not found')) {
                            errorMsg += '\n\n💡 Tradução: Usuário não encontrado. Verifique se o cadastro foi completado.';
                        }
                    }
                }
                
                // Mensagem específica baseada no input
                if (sanitizedUsername.includes('@')) {
                    errorMsg += `\n\n🔍 Você tentou fazer login com: "${sanitizedUsername}"`;
                    errorMsg += '\n\n💡 Possíveis causas:';
                    errorMsg += '\n1. ❌ Email não confirmado - Verifique sua caixa de entrada e clique no link de confirmação';
                    errorMsg += '\n2. ❌ Senha incorreta - Use a senha EXATA que você digitou no cadastro';
                    errorMsg += '\n3. ❌ Email incorreto - Use o email EXATO que apareceu na mensagem de sucesso do cadastro';
                    errorMsg += '\n4. ❌ Usuário não existe - O cadastro pode não ter sido completado';
                    errorMsg += '\n\n📋 Checklist rápido:';
                    errorMsg += '\n• Abra o console (F12 → Console) e veja os logs detalhados acima';
                    errorMsg += '\n• Verifique se você recebeu um email de confirmação do Supabase';
                    errorMsg += '\n• Verifique se você completou o cadastro com sucesso';
                    errorMsg += '\n• No Supabase Dashboard: Authentication → Users → Procure pelo seu email';
                    errorMsg += '\n• Tente fazer um novo cadastro se necessário';
                } else {
                    errorMsg += `\n\n⚠️ Você tentou fazer login com: "${sanitizedUsername}"`;
                    errorMsg += '\n\n❌ ERRO: O login deve ser feito com EMAIL, não com nome ou username!';
                    errorMsg += '\n\n✅ Solução:';
                    errorMsg += '\n• Use o EMAIL completo que você digitou no cadastro';
                    errorMsg += '\n• Exemplo: se você cadastrou com "usuario@email.com", use "usuario@email.com" no login';
                    errorMsg += '\n\n💡 Onde encontrar o email correto:';
                    errorMsg += '\n• A mensagem de sucesso do cadastro mostra o email que você deve usar';
                    errorMsg += '\n• Exemplo: "Use o email "seuemail@exemplo.com" para fazer login"';
                    if (attemptedEmails.length > 0) {
                        errorMsg += `\n\n📧 O sistema tentou automaticamente: ${attemptedEmails.join(', ')}`;
                        errorMsg += '\n• Mas nenhum funcionou. Verifique o email exato do cadastro.';
                    }
                }
                
                logger.error('Login falhou após todas as tentativas', 'LoginPage', {
                    input: sanitizedUsername,
                    attemptedEmails: emailAttempts,
                    emailFromDB: emailFromDB,
                    lastError: lastSupabaseError,
                    error: 'Todos os emails tentados retornaram 400 Bad Request'
                });
                
                setError(errorMsg);
                showError('Login falhou. Abra o console (F12) para ver detalhes do erro do Supabase.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.';
            
            // Se o erro já contém informações detalhadas, usar diretamente
            if (err instanceof Error && (errorMessage.includes('Email não confirmado') ||
                errorMessage.includes('Usuário não encontrado') ||
                errorMessage.includes('Erro ao fazer login') ||
                errorMessage.includes('Login bem-sucedido, mas perfil não encontrado'))) {
                setError(errorMessage);
                showError(errorMessage.split('\n')[0]); // Mostrar primeira linha no toast
            } else {
                // Erro genérico
                setError(errorMessage);
                showError(errorMessage);
            }
            
            logger.error('Erro no handleLogin:', 'LoginPage', err);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8 relative overflow-y-auto">
            {/* Logo de fundo suave */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img
                    src="/icons/play_store_512.png"
                    alt="Logo FitCoach.IA"
                    className="select-none opacity-25 dark:opacity-15 w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] object-contain"
                />
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold">
                        <span className="text-primary-600">FitCoach</span>
                        <span className="text-slate-800 dark:text-slate-200">.IA</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                        Bem-vindo
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Primeiro acesso? Use seu <span className="font-semibold">código de convite</span>. Já tem conta? Faça login abaixo.
                    </p>
                </div>

                <Card className="overflow-visible">
                    <div className="p-6 pb-8">
                        {/* Logo centralizada e Theme toggle - inside card, top */}
                        <div className="flex items-center justify-center mb-6 relative">
                            <img
                                src="/icons/play_store_512.png"
                                alt="Logo FitCoach.IA"
                                className="h-16 w-auto object-contain sm:h-20"
                                onError={(e) => {
                                    // Garantir que sempre use uma imagem, nunca vídeo
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/icons/favicon.svg') {
                                        target.src = '/icons/favicon.svg';
                                    }
                                }}
                            />
                            <button
                                onClick={handleToggleTheme}
                                className="absolute right-0 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                aria-label={`Alternar tema (${getThemeLabel()})`}
                                title={`Tema: ${getThemeLabel()}`}
                            >
                                {getThemeIcon()}
                                <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {getThemeLabel()}
                                </span>
                            </button>
                        </div>


                        {/* Mensagens */}
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

                        {/* Bloco: Primeiro acesso */}
                        <div className="mb-6 p-4 rounded-lg border border-dashed border-slate-300/70 dark:border-slate-600/70 bg-slate-100/50 dark:bg-slate-800/60">
                            <p className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-3">
                                Primeiro acesso?
                            </p>
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        // Resetar estados antes de abrir
                                        setSignupStep(2); // Ir direto para o formulário de cadastro
                                        setTesteComIA(null); // Resetar escolha de teste
                                        setSignupCouponCode(''); // Limpar código
                                        setCouponValidated(false); // Resetar validação
                                        setValidatedCouponPlan(null);
                                        setSignupError(null);
                                        setSignupSuccess(null);
                                        // Abrir modal após definir estados
                                        setShowSignup(true);
                                    }}
                                    variant="primary"
                                    className="w-full"
                                >
                                    Criar Conta
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowSignup(true);
                                        setSignupStep(1);
                                    }}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Tenho Código de Convite
                                </Button>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 mb-2 leading-relaxed break-words">
                                Crie sua conta para testar o app. Se você recebeu um código da sua academia, use o botão acima.
                            </p>
                            {/* NOVO MODELO: Trial removido - modo demo será ativado automaticamente para novos usuários não vinculados a academias */}
                            {/* Mensagem informativa para alunos que vêm via convite */}
                            {inviteInfo && inviteInfo.invitedRole === 'student' && (
                                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 text-center">
                                    Você foi convidado pela sua academia. Use o código de convite acima para criar sua conta.
                                </p>
                            )}
                        </div>

                        {/* Formulário: Já tenho conta */}
                        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Já tenho conta
                        </p>
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
                            <div className="flex justify-end">
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
                                ✨ Criar Conta {signupStep === 1 ? '(Código opcional)' : ''}
                            </h2>
                            <button
                            type="button"
                            onClick={() => {
                            setShowSignup(false);
                            setSignupStep(1);
                            setSignupName('');
                            setSignupEmail('');
                            setSignupPassword('');
                            setSignupConfirmPassword('');
                            setSignupCouponCode('');
                            setTesteComIA(null);
                            setCouponValidated(false);
                            setValidatedCouponPlan(null);
                            setSignupError(null);
                            setSignupError(null);
                            setSignupSuccess(null);
                            setCouponValidated(false);
                            setValidatedCouponPlan(null);
                            setTesteComIA(null);
                            setSignupStep(1);
                                }}
                                className="p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
                                aria-label="Fechar"
                            >
                                <XIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                            </button>
                        </div>
                        {/* Logo do sistema no topo da modal de código de convite */}
                        <div className="flex justify-center mt-4">
                            <img
                                src="/icons/play_store_512.png"
                                alt="Logo FitCoach.IA"
                                className="h-16 w-auto object-contain sm:h-20"
                                onError={(e) => {
                                    // Garantir que sempre use uma imagem, nunca vídeo
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/icons/favicon.svg') {
                                        target.src = '/icons/favicon.svg';
                                    }
                                }}
                            />
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

                            {/* Etapa 1: Inserir Código de Convite (Opcional) */}
                            {signupStep === 1 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Se você recebeu um código de convite ou código mestre, insira abaixo. Caso contrário, você pode pular esta etapa e criar uma conta gratuita.
                                    </p>
                                    <form onSubmit={(e) => { e.preventDefault(); if (signupCouponCode.trim()) handleValidateCoupon(); }} className="space-y-4">
                                        <div>
                                            <label htmlFor="couponCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Código de Convite ou Código Mestre (Opcional)
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
                                                    placeholder="Ex: ACADEMIA-VIP (opcional)"
                                                    autoComplete="off"
                                                />
                                                {signupCouponCode.trim() && (
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                    >
                                                        Validar
                                                    </Button>
                                                )}
                                            </div>
                                            {couponValidated && validatedCouponPlan && (
                                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                    ✓ Código válido! Plano: {validatedCouponPlan}
                                                </p>
                                            )}
                                        </div>
                                    </form>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => setSignupStep(2)}
                                            className="flex-1"
                                        >
                                            Continuar sem código
                                        </Button>
                                        {signupCouponCode.trim() && couponValidated && (
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => setSignupStep(2)}
                                                className="flex-1"
                                            >
                                                Continuar com código
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Etapa 2: Criar Conta (E-mail e Senha) */}
                            {signupStep === 2 && (
                                <form onSubmit={handleSignup} className="space-y-4">
                                    {/* Mensagem de código validado (se houver) */}
                                    {signupCouponCode.trim() && couponValidated && (
                                        <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                ✓ Código de convite validado: <span className="font-medium">{signupCouponCode}</span>
                                            </p>
                                            {validatedCouponPlan && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                                    Plano liberado: {validatedCouponPlan}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Campo opcional de código (se não foi validado ainda) */}
                                    {!couponValidated && (
                                        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                Tem um código de convite? (Opcional)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={signupCouponCode}
                                                    onChange={(e) => setSignupCouponCode(e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Ex: ACADEMIA-VIP"
                                                />
                                            {signupCouponCode.trim() && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleValidateCoupon();
                                                    }}
                                                >
                                                    Validar
                                                </Button>
                                            )}
                                        </div>
                                        {signupError && signupCouponCode.trim() && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{signupError}</p>
                                        )}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                Se não tiver código, pode continuar e criar uma conta gratuita para testar.
                                            </p>
                                        </div>
                                    )}

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

                                    {/* NOVO: Escolha de Teste (apenas se não tem código de convite) */}
                                    {!signupCouponCode.trim() && (
                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                                Como deseja testar o app? *
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setTesteComIA(true)}
                                                    aria-pressed={testeComIA === true}
                                                    className={`p-4 rounded-lg border-2 transition-all ${
                                                        testeComIA === true
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md ring-2 ring-primary-400 dark:ring-primary-500 scale-[1.02]'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
                                                    }`}
                                                >
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center gap-2 mb-2">
                                                            <span className="text-2xl">🤖</span>
                                                            {testeComIA === true && (
                                                                <span className="inline-flex items-center rounded-full bg-primary-500 text-white text-[10px] font-semibold px-2 py-0.5">
                                                                    Selecionado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                                                            COM IA
                                                        </div>
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                                            3 interações grátis
                                                        </div>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTesteComIA(false)}
                                                    aria-pressed={testeComIA === false}
                                                    className={`p-4 rounded-lg border-2 transition-all ${
                                                        testeComIA === false
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md ring-2 ring-primary-400 dark:ring-primary-500 scale-[1.02]'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
                                                    }`}
                                                >
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center gap-2 mb-2">
                                                            <span className="text-2xl">📝</span>
                                                            {testeComIA === false && (
                                                                <span className="inline-flex items-center rounded-full bg-primary-500 text-white text-[10px] font-semibold px-2 py-0.5">
                                                                    Selecionado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                                                            SEM IA
                                                        </div>
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                                            Apenas gestão manual
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                                                Após o teste, você será direcionado para escolher seu plano
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowSignup(false);
                                                setSignupStep(1);
                                                setSignupName('');
                                                setSignupEmail('');
                                                setSignupPassword('');
                                                setSignupConfirmPassword('');
                                                setSignupCouponCode('');
                                                setTesteComIA(null);
                                                setCouponValidated(false);
                                                setValidatedCouponPlan(null);
                                                setSignupError(null);
                                                setSignupSuccess(null);
                                                setCouponValidated(false);
                                                setValidatedCouponPlan(null);
                                                setTesteComIA(null);
                                                setSignupStep(1);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="flex-1"
                                            disabled={isSigningUp || (!signupCouponCode.trim() && testeComIA === null)}
                                        >
                                            {isSigningUp ? 'Criando...' : 'Concluir Cadastro'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LoginPage;

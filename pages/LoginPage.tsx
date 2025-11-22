import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { loginUser, usernameExists, saveLoginSession, resetPassword } from '../services/databaseService';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';
import { XIcon } from '../components/icons/XIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import type { LoginCredentials } from '../types';
import { sanitizeInput, sanitizeEmail } from '../utils/security';
import { useToast } from '../components/ui/Toast';

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
                        // Recarregar usuário após sincronização
                        const syncedUser = await getUserByUsername(user.username || sanitizedUsername);
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
                
                // Redirecionar baseado no role
                let redirectPath = '#/';
                if (user.gymRole === 'admin') {
                    redirectPath = '#/student-management';
                } else if (user.gymRole === 'trainer') {
                    redirectPath = '#/';
                } else if (user.gymRole === 'student') {
                    redirectPath = '#/';
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
                            <div className="flex items-center justify-end">
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
        </div>
    );
};

export default LoginPage;

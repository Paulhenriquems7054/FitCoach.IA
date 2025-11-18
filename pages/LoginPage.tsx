import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { loginUser, registerUser, usernameExists, saveLoginSession, resetPassword } from '../services/databaseService';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';
import { XIcon } from '../components/icons/XIcon';
import type { LoginCredentials } from '../types';
import { sanitizeInput, sanitizeEmail } from '../utils/security';
import { useToast } from '../components/ui/Toast';

const LoginPage: React.FC = () => {
    const { setUser } = useUser();
    const { theme, themeSetting, setThemeSetting } = useTheme();
    const { showSuccess, showError } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nome, setNome] = useState('');
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
                // Salvar sessão
                await saveLoginSession(user.username || sanitizedUsername);
                
                // Atualizar contexto do usuário
                setUser(user);
                
                const successMsg = 'Login realizado com sucesso!';
                setSuccess(successMsg);
                showSuccess(successMsg);
                
                // Redirecionar após 1 segundo
                setTimeout(() => {
                    window.location.hash = '#/';
                }, 1000);
            } else {
                const errorMsg = 'Nome de usuário ou senha incorretos';
                setError(errorMsg);
                showError(errorMsg);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.';
            setError(errorMessage);
            showError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Validações
            if (!username.trim() || !password.trim() || !nome.trim()) {
                setError('Por favor, preencha todos os campos obrigatórios');
                setIsLoading(false);
                return;
            }

            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres');
                setIsLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError('As senhas não coincidem');
                setIsLoading(false);
                return;
            }

            // Verificar se username já existe
            const exists = await usernameExists(sanitizedUsername);
            if (exists) {
                const errorMsg = 'Nome de usuário já está em uso';
                setError(errorMsg);
                showError(errorMsg);
                setIsLoading(false);
                return;
            }

            // Registrar usuário
            const newUser = await registerUser(
                sanitizedUsername,
                sanitizedPassword,
                { nome: sanitizedNome }
            );

            // Salvar sessão
            await saveLoginSession(newUser.username || sanitizedUsername);
            
            // Atualizar contexto do usuário
            setUser(newUser);
            
            const successMsg = 'Conta criada com sucesso!';
            setSuccess(successMsg);
            showSuccess(successMsg);
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.hash = '#/';
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
            setError(errorMessage);
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
                        <span className="text-primary-600">Nutri</span>
                        <span className="text-slate-800 dark:text-slate-200">.IA</span>
                    </h1>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                        {isLogin ? 'Fazer Login' : 'Criar Conta'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {isLogin 
                            ? 'Entre com seu nome de usuário e senha'
                            : 'Crie sua conta para começar sua jornada nutricional'
                        }
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

                        {/* Toggle Login/Register */}
                        <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(true);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                                    isLogin
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(false);
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                                    !isLogin
                                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                Registrar
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
                        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome Completo *
                                    </label>
                                    <input
                                        id="nome"
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Seu nome completo"
                                        required={!isLogin}
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome de Usuário *
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="seu_usuario"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Senha *
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="••••••••"
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    minLength={6}
                                />
                                {!isLogin && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Mínimo de 6 caracteres
                                    </p>
                                )}
                            </div>

                            {!isLogin && (
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Senha *
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="••••••••"
                                        required={!isLogin}
                                        autoComplete="new-password"
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6">
                            {isLogin ? (
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                        🔑 Esqueci a senha
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(true)}
                                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                                    >
                                        ← Já tenho uma conta
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modal Esqueci a Senha */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-modal="true">
                    <Card className="w-full max-w-md mx-4 animate-fade-in-up">
                        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold flex items-center gap-2">
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
                                }}
                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <XIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6">
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
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Mínimo de 6 caracteres
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Nova Senha *
                                    </label>
                                    <input
                                        id="confirmNewPassword"
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
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

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { authFlowService, authService } from '../services/supabaseService';
import { useUser } from '../context/UserContext';
import { useToast } from './ui/Toast';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { useRouter } from '../hooks/useRouter';

interface LoginOrRegisterProps {
  couponCode: string;
  onSuccess: () => void;
  onBack?: () => void;
}

export const LoginOrRegister: React.FC<LoginOrRegisterProps> = ({ 
  couponCode, 
  onSuccess,
  onBack 
}) => {
  const { setUser } = useUser();
  const { push } = useRouter();
  const { showToast } = useToast();
  
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      // Usar login do Supabase Auth
      const { getSupabaseClient } = await import('../services/supabaseService');
      const supabase = getSupabaseClient();
      
      // Tentar login por email primeiro, depois por username
      let authData = null;
      let authError = null;
      
      // Se username parece ser um email, usar diretamente
      if (username.includes('@')) {
        const result = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });
        authData = result.data;
        authError = result.error;
      } else {
        // Tentar buscar usuário por username e usar o email
        const { data: userData } = await supabase
          .from('users')
          .select('email, username')
          .eq('username', username)
          .maybeSingle();
        
        if (userData && userData.email) {
          const result = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: password,
          });
          authData = result.data;
          authError = result.error;
        } else {
          throw new Error('Usuário não encontrado');
        }
      }

      if (authError || !authData?.user) {
        throw new Error(authError?.message || 'Credenciais inválidas');
      }

      // Buscar perfil do usuário
      const userProfile = await authService.getCurrentUserProfile();
      if (!userProfile) {
        throw new Error('Erro ao carregar perfil do usuário');
      }

      setUser(userProfile);
      showToast('Login realizado com sucesso!', 'success');
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!name.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }

    if (!username.trim()) {
      setError('Por favor, informe um nome de usuário');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu email');
      return;
    }

    if (!password.trim()) {
      setError('Por favor, informe uma senha');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authFlowService.registerWithInvite(
        username.trim(),
        password,
        {
          nome: name.trim(),
          email: email.trim(),
          idade: 0,
          genero: 'Masculino',
          peso: 0,
          altura: 0,
          objetivo: 'perder peso' as any,
          points: 0,
          disciplineScore: 0,
          completedChallengeIds: [],
          isAnonymized: false,
          weightHistory: [],
          role: 'user',
          subscription: 'free',
        },
        couponCode
      );

      setUser(result.user);
      showToast('Conta criada com sucesso!', 'success');
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? 'Login' : 'Criar Conta'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin 
                ? 'Entre com suas credenciais para acessar o FitCoach.IA'
                : 'Complete seu cadastro para começar a usar o FitCoach.IA'
              }
            </p>
          </div>

          {error && (
            <Alert type="error" title="Erro">
              {error}
            </Alert>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome de usuário ou Email
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário ou email"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !username.trim() || !password.trim()}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome de Usuário *
                </label>
                <input
                  id="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="nomeusuario"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !name.trim() || !username.trim() || !email.trim() || !password.trim() || password !== confirmPassword}
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          )}

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
            </button>

            {onBack && (
              <div>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};


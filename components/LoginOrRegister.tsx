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
import { logger } from '../utils/logger';

interface LoginOrRegisterProps {
  couponCode?: string; // Opcional: código de convite
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
        // Tentar múltiplas estratégias para login com username
        
        // Estratégia 1: Tentar username@fitcoach.ia (padrão usado no cadastro)
        let loginAttempts = [
          { email: `${username}@fitcoach.ia`, description: 'username@fitcoach.ia' },
          { email: username, description: 'username direto' },
        ];
        
        // Estratégia 2: Buscar usuário na tabela users para obter email real
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .eq('username', username)
            .maybeSingle();
          
          if (userData && userData.id) {
            // Usuário encontrado na tabela, tentar fazer login
            // Primeiro tentar com o padrão username@fitcoach.ia
            for (const attempt of loginAttempts) {
              try {
                const result = await supabase.auth.signInWithPassword({
                  email: attempt.email,
                  password: password,
                });
                
                if (result.data && result.data.user) {
                  authData = result.data;
                  authError = null;
                  logger.info(`Login bem-sucedido usando: ${attempt.description}`, 'LoginOrRegister');
                  break;
                } else if (result.error) {
                  authError = result.error;
                  // Continuar para próxima tentativa
                }
              } catch (e) {
                // Continuar para próxima tentativa
                continue;
              }
            }
          } else {
            // Usuário não encontrado na tabela, mas pode estar no Auth
            // Tentar fazer login mesmo assim
            logger.warn(`Usuário não encontrado na tabela users, tentando login direto: ${username}`, 'LoginOrRegister');
            
            for (const attempt of loginAttempts) {
              try {
                const result = await supabase.auth.signInWithPassword({
                  email: attempt.email,
                  password: password,
                });
                
                if (result.data && result.data.user) {
                  authData = result.data;
                  authError = null;
                  logger.info(`Login bem-sucedido usando: ${attempt.description}`, 'LoginOrRegister');
                  break;
                } else if (result.error) {
                  authError = result.error;
                }
              } catch (e) {
                continue;
              }
            }
          }
        } catch (searchError) {
          logger.warn('Erro ao buscar usuário na tabela, tentando login direto', 'LoginOrRegister', searchError);
          // Tentar login direto mesmo com erro na busca
          for (const attempt of loginAttempts) {
            try {
              const result = await supabase.auth.signInWithPassword({
                email: attempt.email,
                password: password,
              });
              
              if (result.data && result.data.user) {
                authData = result.data;
                authError = null;
                break;
              } else if (result.error) {
                authError = result.error;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        // Se ainda não conseguiu fazer login
        if (!authData || !authData.user) {
          if (authError?.message?.includes('Invalid login credentials') || authError?.message?.includes('Email not confirmed')) {
            throw new Error(authError.message);
          }
          throw new Error('Usuário não encontrado ou credenciais inválidas. Verifique se você usou o email correto no cadastro.');
        }
      }

      if (authError || !authData?.user) {
        throw new Error(authError?.message || 'Credenciais inválidas');
      }

      // Buscar perfil do usuário
      const userProfile = await authService.getCurrentUserProfile();
      if (!userProfile) {
        // Se não encontrou o perfil, pode ser que ainda não foi criado
        // Tentar aguardar e buscar novamente
        logger.warn('Perfil não encontrado imediatamente após login, aguardando...', 'LoginOrRegister');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryProfile = await authService.getCurrentUserProfile();
        
        if (!retryProfile) {
          throw new Error('Perfil do usuário não encontrado. O perfil pode ainda estar sendo criado. Tente novamente em alguns segundos.');
        }
        
        setUser(retryProfile);
      } else {
        setUser(userProfile);
      }
      
      showToast('Login realizado com sucesso!', 'success');
      onSuccess();
    } catch (err) {
      let errorMessage = 'Erro ao fazer login';
      
      if (err instanceof Error) {
        // Tratar rate limiting do Supabase
        if (err.message.includes('For security purposes') || err.message.includes('rate limit') || err.message.includes('seconds')) {
          const match = err.message.match(/(\d+)\s*seconds?/);
          const seconds = match ? match[1] : 'alguns';
          errorMessage = `Muitas tentativas. Aguarde ${seconds} segundos antes de tentar novamente.`;
        } else {
          errorMessage = err.message;
        }
      }
      
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
      let result;
      
      // Se houver código de convite, usar registerWithInvite
      if (couponCode && couponCode.trim()) {
        result = await authFlowService.registerWithInvite(
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
          couponCode.trim()
        );
      } else {
        // Cadastro sem cupom (free)
        const userProfile = await authService.signUp(email.trim(), password);
        result = { user: userProfile };
      }

      // Validar se o usuário foi retornado corretamente
      if (!result || !result.user) {
        throw new Error('Erro ao criar conta: usuário não foi retornado');
      }

      // Validar campos obrigatórios do usuário
      if (!result.user.id || !result.user.nome) {
        throw new Error('Erro ao criar conta: dados do usuário incompletos');
      }

      // Definir o usuário no contexto
      setUser(result.user);
      showToast('Conta criada com sucesso!', 'success');
      
      // Aguardar um pouco antes de chamar onSuccess para garantir que o usuário foi definido
      await new Promise(resolve => setTimeout(resolve, 100));
      
      onSuccess();
    } catch (err) {
      let errorMessage = 'Erro ao criar conta';
      let showWaitMessage = false;
      let waitSeconds = 0;
      
      if (err instanceof Error) {
        // Tratar rate limiting do Supabase
        if (err.message.includes('For security purposes') || err.message.includes('rate limit') || err.message.includes('seconds') || err.message.includes('after')) {
          const match = err.message.match(/(\d+)\s*seconds?/i);
          waitSeconds = match ? parseInt(match[1], 10) : 10;
          showWaitMessage = true;
          errorMessage = `⏱️ Muitas tentativas de cadastro detectadas.\n\nPor segurança, o Supabase bloqueou temporariamente novos cadastros.\n\n⏳ Aguarde ${waitSeconds} segundos antes de tentar novamente.\n\n💡 Dica: Se você já criou uma conta, tente fazer login ao invés de criar uma nova.`;
        } else if (err.message.includes('User already registered') || err.message.includes('already registered')) {
          errorMessage = '✅ Este email já está cadastrado!\n\nTente fazer login ao invés de criar uma nova conta.';
        } else if (err.message.includes('Password') || err.message.includes('password')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (err.message.includes('Email signups are disabled')) {
          errorMessage = '⚠️ Cadastros por email estão desabilitados no Supabase.\n\nEntre em contato com o suporte ou tente fazer login se já tiver uma conta.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
      
      // Se for rate limit, mostrar mensagem adicional após alguns segundos
      if (showWaitMessage && waitSeconds > 0) {
        setTimeout(() => {
          showToast(`⏳ Você pode tentar novamente em ${Math.max(0, waitSeconds - 5)} segundos...`, 'info');
        }, 5000);
      }
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
              onClick={(e) => {
                // Prevenir múltiplos cliques
                if (isLoading) {
                  e.preventDefault();
                  return;
                }
              }}
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


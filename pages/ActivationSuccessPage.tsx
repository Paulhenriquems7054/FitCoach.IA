import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getSupabaseClient } from '../services/supabaseService';
import { useRouter } from '../hooks/useRouter';
import { Logo } from '../components/Logo';

const ActivationSuccessPage: React.FC = () => {
  const { path } = useRouter();
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [masterCode, setMasterCode] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ler parâmetros da URL (Cakto pode enviar ?email= ou ?customer_email=)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    
    // Tentar obter email de múltiplas fontes
    const customerEmail = 
      urlParams.get('email') || 
      urlParams.get('customer_email') || 
      hashParams.get('email') || 
      hashParams.get('customer_email');

    if (customerEmail) {
      loadActivationData(customerEmail);
    } else {
      setError('Email não encontrado na URL. Verifique seu email para receber o código de convite.');
      setLoading(false);
    }
  }, []);

  const loadActivationData = async (customerEmail: string) => {
    try {
      const supabase = getSupabaseClient();
      setEmail(customerEmail);

      // 1. Buscar empresa pelo email
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, master_code, name, email')
        .eq('email', customerEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyError || !company) {
        setError('Empresa não encontrada. O pagamento pode ainda estar sendo processado. Verifique seu email para receber o código de convite.');
        setLoading(false);
        return;
      }

      setMasterCode(company.master_code);
      setCompanyName(company.name);

      // 2. Buscar código de convite padrão criado automaticamente
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('code, expires_at, created_at')
        .eq('academy_id', company.id)
        .eq('invited_role', 'student')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!inviteError && invite) {
        setInviteCode(invite.code);
      }

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados de ativação:', err);
      setError('Erro ao carregar informações. Tente novamente mais tarde ou verifique seu email.');
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`${label} copiado!`);
      }).catch(() => {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`${label} copiado!`);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Carregando suas informações...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl">
        {error ? (
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Informação não encontrada
            </h1>
            <div className="text-red-600 dark:text-red-400 mb-6">{error}</div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Verifique sua caixa de entrada e spam. Você receberá um email com todas as informações necessárias.
              </p>
            </div>
            <Button onClick={() => window.location.href = '/#/login'}>
              Ir para Login
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Pagamento Confirmado!
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Sua academia foi ativada com sucesso
              </p>
              {companyName && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {companyName}
                </p>
              )}
            </div>

            <div className="space-y-6">
              {/* Código de Convite */}
              {inviteCode && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📧</span>
                    <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                      Código de Convite para Alunos
                    </h2>
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                    Use este código para convidar seus alunos. Eles receberão <strong>3 dias grátis</strong> de IA automaticamente ao se cadastrarem.
                  </p>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border-2 border-emerald-400 dark:border-emerald-600 shadow-inner">
                    <p className="text-4xl font-bold text-center text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">
                      {inviteCode}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => copyToClipboard(inviteCode, 'Código de convite')}
                    >
                      📋 Copiar Código
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-emerald-300 dark:border-emerald-700"
                      onClick={() => {
                        const link = `${window.location.origin}/#/login?invite=${inviteCode}`;
                        copyToClipboard(link, 'Link de convite');
                      }}
                    >
                      🔗 Copiar Link Completo
                    </Button>
                  </div>
                </div>
              )}

              {/* Master Code */}
              {masterCode && (
                <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔑</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Código Mestre da Academia
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Este é o identificador único da sua academia. Guarde este código com segurança.
                  </p>
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                    <p className="text-2xl font-bold text-center text-slate-700 dark:text-slate-300 font-mono">
                      {masterCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => copyToClipboard(masterCode, 'Código mestre')}
                  >
                    📋 Copiar Código Mestre
                  </Button>
                </div>
              )}

              {/* Próximos Passos */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🚀</span>
                  <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    Próximos Passos
                  </h2>
                </div>
                <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    <strong>Crie sua conta de administrador</strong> usando o email: <strong className="font-mono">{email}</strong>
                  </li>
                  <li>
                    <strong>Use o código de convite</strong> acima para convidar seus alunos
                  </li>
                  <li>
                    <strong>Seus alunos receberão 3 dias grátis</strong> de IA automaticamente ao se cadastrarem
                  </li>
                  <li>
                    <strong>Após o trial,</strong> seus alunos podem assinar planos individuais de IA
                  </li>
                </ol>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    window.location.href = `/#/login?email=${encodeURIComponent(email || '')}`;
                  }}
                >
                  Criar Conta / Fazer Login
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = '/#/';
                  }}
                >
                  Ir para Home
                </Button>
              </div>

              {/* Informação sobre Email */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mt-6">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  📬 <strong>Importante:</strong> Você também receberá um email com todas essas informações. Verifique sua caixa de entrada e spam.
                </p>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ActivationSuccessPage;


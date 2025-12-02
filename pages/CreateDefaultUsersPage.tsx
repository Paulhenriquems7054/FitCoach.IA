/**
 * Página para criar usuários padrões no Supabase
 * Acesse via: #/create-default-users
 */

import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { createAllDefaultUsers } from '../services/createDefaultUsers';

export function CreateDefaultUsersPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ user: string; success: boolean; error?: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUsers = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await createAllDefaultUsers();
      setResults(result.results);

      if (!result.success) {
        setError('Alguns usuários não foram criados. Verifique os detalhes abaixo.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuários padrões');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Criar Usuários Padrões no Supabase
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Esta página cria os usuários padrões necessários para desenvolvimento e administração:
        </p>

        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mb-6 space-y-2">
          <li><strong>Desenvolvedor</strong> - Usuário: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">dev123</code>, Senha: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">dev123</code></li>
          <li><strong>Administrador</strong> - Usuário: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">admin123</code>, Senha: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">admin123</code></li>
        </ul>

        <Alert type="info" className="mb-6">
          <p>
            <strong>Nota:</strong> Se os usuários já existirem no Supabase, eles serão atualizados com as configurações corretas.
            Se você não tiver permissões de admin no Supabase, pode ser necessário desabilitar a confirmação de email nas configurações do projeto.
          </p>
        </Alert>

        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Button
          onClick={handleCreateUsers}
          disabled={loading}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {loading ? 'Criando usuários...' : 'Criar Usuários Padrões'}
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Resultados:
            </h2>
            {results.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {result.user}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {result.error}
                      </p>
                    )}
                  </div>
                  <div>
                    {result.success ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">✓ Criado</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-semibold">✗ Erro</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Como usar após criar:
          </h3>
          <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-2">
            <li>Faça logout do app atual (se estiver logado)</li>
            <li>Na tela de login, use um dos usuários criados acima</li>
            <li>Você terá acesso total como admin/premium</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}


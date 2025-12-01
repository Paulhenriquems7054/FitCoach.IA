/**
 * Tela de ativação de código para planos B2B e Personais
 * Conforme documentação de lógica de planos
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { activateUserWithCode } from '../services/activationCodeService';

export function ActivationScreen() {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleActivate() {
    if (!code.trim() || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await activateUserWithCode(user.id, code);

      if (result.success) {
        setSuccess(true);
        // Redirecionar para home após 2 segundos
        setTimeout(() => {
          window.location.hash = '#/home';
        }, 2000);
      } else {
        setError(result.error || 'Erro ao ativar código');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="activation-screen">
      <h1>Ativar Código Premium</h1>
      <p>Digite o código fornecido pela sua academia ou personal trainer</p>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Ex: ACADEMIA-X"
        maxLength={20}
      />

      {error && <div className="error">{error}</div>}
      {success && (
        <div className="success">
          Código ativado com sucesso! Redirecionando...
        </div>
      )}

      <button
        onClick={handleActivate}
        disabled={loading || !code.trim()}
      >
        {loading ? 'Ativando...' : 'Ativar Código'}
      </button>
    </div>
  );
}


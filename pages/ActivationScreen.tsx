/**
 * Tela de ativação de código para planos B2B e Personais
 * Conforme documentação de lógica de planos
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { validateAndActivateCode } from '../services/activationCodeService';
import { validatePromotionalCode, applyPromotionalCode } from '../services/promotionalCodeService';

export function ActivationScreen() {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  async function handleActivate() {
    if (!code.trim() || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await validateAndActivateCode(user.id, code);

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

  async function handleApplyPromo() {
    if (!promoCode.trim() || !user?.id) return;

    setIsApplyingPromo(true);
    setPromoError(null);
    setPromoMessage(null);

    try {
      const validation = await validatePromotionalCode(promoCode);
      if (!validation.valid) {
        setPromoError(validation.message || 'Código promocional inválido.');
        return;
      }

      const result = await applyPromotionalCode(user.id, promoCode);
      if (result.success) {
        setPromoMessage(result.message || 'Código aplicado com sucesso!');
      } else {
        setPromoError(result.message || 'Não foi possível aplicar o código.');
      }
    } catch (err) {
      setPromoError('Erro inesperado ao aplicar código promocional. Tente novamente.');
    } finally {
      setIsApplyingPromo(false);
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

      <hr className="my-6" />

      <h2>Código Promocional</h2>
      <p>Se você possui um código promocional (teste, desconto, acesso especial), digite abaixo:</p>

      <input
        type="text"
        value={promoCode}
        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
        placeholder="Ex: TESTE-7DIAS"
        maxLength={30}
      />

      {promoError && <div className="error">{promoError}</div>}
      {promoMessage && <div className="success">{promoMessage}</div>}

      <button
        onClick={handleApplyPromo}
        disabled={isApplyingPromo || !promoCode.trim()}
      >
        {isApplyingPromo ? 'Aplicando...' : 'Aplicar Código Promocional'}
      </button>
    </div>
  );
}


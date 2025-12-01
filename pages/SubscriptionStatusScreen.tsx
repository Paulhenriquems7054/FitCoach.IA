/**
 * Tela de Status de Assinatura
 * Conforme documentação de lógica de planos
 */

import { useSubscription } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';

export function SubscriptionStatusScreen() {
  const { status, loading, isPremium, planType, refresh } = useSubscription();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isPremium) {
    return (
      <div className="subscription-status">
        <h2>Você não possui assinatura ativa</h2>
        <p>Assine um plano para ter acesso completo a todos os recursos.</p>
        <Button onClick={() => { window.location.hash = '#/premium'; }}>
          Ver Planos
        </Button>
      </div>
    );
  }

  return (
    <div className="subscription-status">
      <h2>Assinatura Ativa</h2>
      <p>Plano: {planType}</p>

      {status?.features.voiceUnlimitedUntil && (
        <div className="unlimited-badge">
          Passe Livre Ativo até {new Date(status.features.voiceUnlimitedUntil).toLocaleDateString()}
        </div>
      )}

      <div className="voice-status">
        <h3>Minutos de Voz</h3>
        {status?.features.voiceUnlimitedUntil ? (
          <p>Ilimitado</p>
        ) : (
          <>
            <p>Diário: {status?.features.voiceMinutesDaily || 0} min restantes</p>
            <p>Banco: {status?.features.voiceMinutesTotal || 0} min disponíveis</p>
          </>
        )}
      </div>

      <Button onClick={() => { window.location.hash = '#/premium'; }}>
        Recarregar Minutos
      </Button>
      <Button variant="outline" onClick={refresh}>
        Atualizar Status
      </Button>
    </div>
  );
}

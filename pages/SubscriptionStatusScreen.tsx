/**
 * Tela de Status de Assinatura
 * Conforme documentação de lógica de planos
 */

import { useSubscription } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
import { useToast } from '../components/ui/Toast';
import { startTrialPeriod } from '../services/trialService';

export function SubscriptionStatusScreen() {
  const { status, loading, isPremium, planType, refresh } = useSubscription();
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const [isStartingTrial, setIsStartingTrial] = React.useState(false);

  const handleStartTrial = async () => {
    if (!user?.id) {
      showError('Você precisa estar autenticado para iniciar o período de teste.');
      return;
    }

    try {
      setIsStartingTrial(true);
      await startTrialPeriod(user.id);
      showSuccess('Período de teste Premium de 7 dias ativado com sucesso!');
      await refresh();
    } catch (error: any) {
      const message = error?.message || 'Não foi possível iniciar o período de teste.';
      showError(message);
    } finally {
      setIsStartingTrial(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isPremium) {
    return (
      <div className="subscription-status">
        <h2>Você não possui assinatura ativa</h2>
        <p>Assine um plano para ter acesso completo a todos os recursos.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
          <Button onClick={() => { window.location.hash = '#/premium'; }}>
            Ver Planos
          </Button>
          <Button
            variant="secondary"
            onClick={handleStartTrial}
            disabled={isStartingTrial}
          >
            {isStartingTrial ? 'Ativando teste...' : 'Ativar teste Premium 7 dias'}
          </Button>
        </div>
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

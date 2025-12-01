/**
 * Página para upgrade/downgrade de planos
 * Permite ao usuário alterar seu plano de assinatura
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useSubscription } from '../hooks/useSubscription';
import { changePlan, getAvailablePlansForChange } from '../services/upgradeDowngradeService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';

export function ChangePlanPage() {
  const { user } = useUser();
  const { status, refresh } = useSubscription();
  const { showSuccess, showError } = useToast();
  const [plans, setPlans] = useState<{ current: any; available: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [user?.id]);

  async function loadPlans() {
    if (!user?.id) return;

    try {
      const availablePlans = await getAvailablePlansForChange(user.id);
      setPlans(availablePlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  }

  async function handleChangePlan(planName: string) {
    if (!user?.id || changing) return;

    setChanging(planName);
    try {
      const result = await changePlan(user.id, planName);

      if (result.success) {
        showSuccess('Plano alterado com sucesso!');
        await refresh();
        await loadPlans();
      } else {
        showError(result.error || 'Erro ao alterar plano');
      }
    } catch (error) {
      showError('Erro inesperado ao alterar plano');
    } finally {
      setChanging(null);
    }
  }

  if (!plans) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center">Carregando planos...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Alterar Plano
      </h1>

      {plans.current && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Plano Atual
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {plans.current.display_name || plans.current.name}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.available.map((plan) => {
          const isCurrent = plans.current?.id === plan.id;
          const isChanging = changing === plan.name;

          return (
            <Card key={plan.id} className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {plan.display_name || plan.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                {plan.description || ''}
              </p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  R$ {plan.price_monthly?.toFixed(2) || '0.00'}
                </span>
                <span className="text-slate-600 dark:text-slate-400">/mês</span>
              </div>
              <Button
                onClick={() => handleChangePlan(plan.name)}
                disabled={isCurrent || isChanging}
                variant={isCurrent ? 'outline' : 'primary'}
                className="w-full"
              >
                {isCurrent
                  ? 'Plano Atual'
                  : isChanging
                  ? 'Alterando...'
                  : 'Selecionar Plano'}
              </Button>
            </Card>
          );
        })}
      </div>

      <Alert type="info" className="mt-6">
        <p className="text-sm">
          <strong>Nota:</strong> Ao fazer upgrade, seu plano atual continuará ativo até o final do período.
          Ao fazer downgrade, a mudança será imediata.
        </p>
      </Alert>
    </div>
  );
}


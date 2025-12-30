/**
 * Gate de acesso para funcionalidades de IA (chat, voz, visão, planos)
 * - Usa aiAccessService (assinatura + trial por aluno)
 * - Mostra paywall apenas para alunos (tenantRole === 'student')
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getAiAccessStatus } from '../services/aiAccessService';
import { TrialExpiredPaywall } from './TrialExpiredPaywall';

interface AiAccessGateProps {
  feature: 'chat' | 'voice' | 'vision' | 'plan';
  children: React.ReactNode;
}

export const AiAccessGate: React.FC<AiAccessGateProps> = ({ feature, children }) => {
  const { user } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setAllowed(false);
        return;
      }

      // Desenvolvedor sempre tem acesso
      const isDeveloper = user.username === 'dev123' || user.username === 'dev' || user.nome === 'Desenvolvedor';
      if (isDeveloper) {
        setAllowed(true);
        return;
      }

      // Se não é aluno, não mostra paywall de IA (deixa outros gates cuidarem)
      if (user.tenantRole !== 'student') {
        setAllowed(true);
        return;
      }

      const status = await getAiAccessStatus(user);
      setAllowed(status.hasAccess);
    };

    check();
  }, [user]);

  if (allowed === null) return null;

  if (!allowed && user && user.tenantRole === 'student') {
    return (
      <TrialExpiredPaywall
        feature={feature}
        message="Seu acesso à IA está bloqueado. Assine um plano para continuar usando."
      />
    );
  }

  return <>{children}</>;
};



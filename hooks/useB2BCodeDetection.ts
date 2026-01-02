import { useEffect, useState, useRef } from 'react';
import { getB2BCodesByBusiness } from '../services/b2bCodeService';
import { useUser } from '../context/UserContext';

interface NewCode {
  code: string;
  planType: string;
  maxActivations: number;
}

export function useB2BCodeDetection(enabled: boolean = true) {
  const { user } = useUser();
  const [newCode, setNewCode] = useState<NewCode | null>(null);
  const [knownCodes, setKnownCodes] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopPollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !enabled) return;

    // Buscar códigos existentes inicialmente
    const loadExistingCodes = async () => {
      try {
        const codes = await getB2BCodesByBusiness(user.id!);
        const codeSet = new Set(codes.map(c => c.code));
        setKnownCodes(codeSet);
        isInitializedRef.current = true;
      } catch (error) {
        console.error('Erro ao carregar códigos existentes:', error);
        isInitializedRef.current = true;
      }
    };

    loadExistingCodes();

    // Aguardar inicialização antes de começar polling
    const startPolling = () => {
      if (!isInitializedRef.current) {
        setTimeout(startPolling, 500);
        return;
      }

      // Polling: verificar a cada 5 segundos por até 2 minutos
      let attempts = 0;
      const maxAttempts = 24; // 2 minutos = 24 x 5 segundos

      const checkForNewCodes = async () => {
        attempts++;
        
        try {
          const codes = await getB2BCodesByBusiness(user.id!);
          
          // Encontrar código novo (mais recente que não estava na lista inicial)
          const activeCodes = codes.filter(c => c.status === 'active');
          if (activeCodes.length > 0) {
            const newestCode = activeCodes.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            if (newestCode && !knownCodes.has(newestCode.code)) {
              setNewCode({
                code: newestCode.code,
                planType: newestCode.plan_type,
                maxActivations: newestCode.max_activations
              });
              setKnownCodes(prev => new Set([...prev, newestCode.code]));
              stopPolling(); // Parar polling quando encontrar
              return;
            }
          }
        } catch (error) {
          console.error('Erro ao verificar códigos:', error);
        }

        // Parar após maxAttempts
        if (attempts >= maxAttempts) {
          stopPolling();
        }
      };

      // Primeira verificação após 3 segundos
      setTimeout(checkForNewCodes, 3000);

      // Polling a cada 5 segundos
      pollingIntervalRef.current = setInterval(checkForNewCodes, 5000);

      // Timeout de segurança: parar após 2 minutos
      stopPollingTimeoutRef.current = setTimeout(() => {
        stopPolling();
      }, 120000);
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (stopPollingTimeoutRef.current) {
        clearTimeout(stopPollingTimeoutRef.current);
        stopPollingTimeoutRef.current = null;
      }
    };

    startPolling();

    return () => {
      stopPolling();
    };
  }, [user?.id, enabled]);

  const clearNewCode = () => {
    setNewCode(null);
  };

  return { newCode, clearNewCode };
}

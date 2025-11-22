/**
 * Hook para usar o banco de dados local
 * Fornece funções convenientes para acessar o banco de dados
 */

import { useEffect, useState } from 'react';
import { initDatabase, migrateFromLocalStorage, initializeDefaultUsers } from '../services/databaseService';

let isInitialized = false;

/**
 * Hook para inicializar o banco de dados
 */
export function useDatabase() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isInitialized) {
            setIsReady(true);
            return;
        }

        const initialize = async () => {
            try {
                await initDatabase();
                await migrateFromLocalStorage();
                await initializeDefaultUsers(); // Criar usuários padrão se não existirem
                isInitialized = true;
                setIsReady(true);
            } catch (err) {
                console.error('Erro ao inicializar banco de dados:', err);
                setError(err as Error);
            }
        };

        initialize();
    }, []);

    return { isReady, error };
}


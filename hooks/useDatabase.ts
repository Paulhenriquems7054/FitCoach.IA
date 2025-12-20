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
                console.log('[useDatabase] Iniciando inicialização do banco de dados...');
                
                // Adicionar timeout para evitar travamento infinito
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error('Timeout ao inicializar banco de dados (15s)'));
                    }, 15000);
                });

                await Promise.race([
                    (async () => {
                        console.log('[useDatabase] Chamando initDatabase...');
                        await initDatabase();
                        console.log('[useDatabase] initDatabase concluído');
                        
                        console.log('[useDatabase] Chamando migrateFromLocalStorage...');
                        await migrateFromLocalStorage();
                        console.log('[useDatabase] migrateFromLocalStorage concluído');
                        
                        console.log('[useDatabase] Chamando initializeDefaultUsers...');
                        await initializeDefaultUsers();
                        console.log('[useDatabase] initializeDefaultUsers concluído');
                        
                        isInitialized = true;
                        setIsReady(true);
                        console.log('[useDatabase] Inicialização completa!');
                    })(),
                    timeoutPromise
                ]);
            } catch (err) {
                console.error('[useDatabase] Erro ao inicializar banco de dados:', err);
                // Mesmo com erro, permitir que o app continue (modo degradado)
                // Isso evita que o app fique travado em tela preta
                isInitialized = true;
                setIsReady(true);
                setError(err as Error);
            }
        };

        initialize();
    }, []);

    return { isReady, error };
}


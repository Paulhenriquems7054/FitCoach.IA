import React, { ReactNode } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { Skeleton } from './ui/Skeleton';

interface DatabaseInitializerProps {
    children: ReactNode;
}

/**
 * Componente que inicializa o banco de dados antes de renderizar a aplicação
 */
export const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ children }) => {
    const { isReady, error } = useDatabase();

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                        Erro ao Inicializar Banco de Dados
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Não foi possível inicializar o banco de dados local. Por favor, recarregue a página.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                        Recarregar Página
                    </button>
                </div>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="max-w-md w-full space-y-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Nutri.IA
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Inicializando banco de dados...
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};


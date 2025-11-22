/**
 * Componente para proteger rotas baseado em permissões
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requirePermission?: keyof ReturnType<typeof usePermissions>;
    fallbackMessage?: string;
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requirePermission,
    fallbackMessage = 'Você não tem permissão para acessar esta página.',
    redirectTo,
}) => {
    const permissions = usePermissions();

    // Se não há permissão requerida, renderiza normalmente
    if (!requirePermission) {
        return <>{children}</>;
    }

    // Verificar permissão
    const hasPermission = permissions[requirePermission];

    if (!hasPermission) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert type="error" title="Acesso Negado">
                    {fallbackMessage}
                    {redirectTo && (
                        <div className="mt-4">
                            <Button
                                onClick={() => {
                                    window.location.hash = redirectTo;
                                }}
                                variant="primary"
                            >
                                Voltar
                            </Button>
                        </div>
                    )}
                </Alert>
            </div>
        );
    }

    return <>{children}</>;
};


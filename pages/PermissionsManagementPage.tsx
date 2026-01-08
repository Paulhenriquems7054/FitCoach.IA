/**
 * Página de Gerenciamento de Permissões
 * Permite que administradores configurem permissões para treinadores e recepcionistas
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { useUser } from '../context/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import {
    loadGymRolePermissions,
    saveGymRolePermissions,
    type RolePermissions,
    type GymRolePermissions,
} from '../services/permissionsService';
import { logger } from '../utils/logger';

const PermissionsManagementPage: React.FC = () => {
    const { user } = useUser();
    const { showSuccess, showError, showWarning } = useToast();
    const permissions = usePermissions();
    const mountedRef = useRef(true);
    
    const isAdmin = user.gymRole === 'admin' || user.username === 'Administrador' || user.username === 'Desenvolvedor';
    
    const [trainerPermissions, setTrainerPermissions] = useState<RolePermissions>({
        canViewStudents: true,
        canEditStudents: false,
        canDeleteStudents: false,
        canCreateStudents: false,
        canViewAllData: true,
        canManageGymSettings: false,
        canCreateTrainers: false,
        canCreateReceptionists: false,
        canViewTrainerDashboard: true,
        canViewStudentDashboard: true,
        canManagePermissions: false,
    });
    
    const [receptionistPermissions, setReceptionistPermissions] = useState<RolePermissions>({
        canViewStudents: true,
        canEditStudents: false,
        canDeleteStudents: false,
        canCreateStudents: false,
        canViewAllData: false,
        canManageGymSettings: false,
        canCreateTrainers: false,
        canCreateReceptionists: false,
        canViewTrainerDashboard: false,
        canViewStudentDashboard: true,
        canManagePermissions: false,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        loadPermissions();
        
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadPermissions = async () => {
        if (!mountedRef.current) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            logger.info('Carregando permissões de roles da academia', 'PermissionsManagementPage');
            
            const saved = await loadGymRolePermissions();
            
            if (!mountedRef.current) return;
            
            setTrainerPermissions(saved.trainer);
            setReceptionistPermissions(saved.receptionist);
            setHasChanges(false);
            
            logger.info('Permissões carregadas com sucesso', 'PermissionsManagementPage');
        } catch (error) {
            logger.error('Erro ao carregar permissões', 'PermissionsManagementPage', error);
            
            if (!mountedRef.current) return;
            
            const errorMessage = 'Erro ao carregar permissões. Tente recarregar a página.';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const handleTrainerPermissionChange = (key: keyof RolePermissions, value: boolean) => {
        setTrainerPermissions(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleReceptionistPermissionChange = (key: keyof RolePermissions, value: boolean) => {
        setReceptionistPermissions(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!mountedRef.current) return;
        
        if (!hasChanges) {
            showWarning('Nenhuma alteração para salvar.');
            return;
        }
        
        // Confirmação antes de salvar
        const confirmMessage = 'Tem certeza que deseja salvar as alterações nas permissões? Isso afetará todos os treinadores e recepcionistas da academia.';
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        try {
            setIsSaving(true);
            setError(null);
            
            const permissions: GymRolePermissions = {
                trainer: trainerPermissions,
                receptionist: receptionistPermissions,
            };
            
            logger.info(`Salvando permissões de roles (treinadores: ${Object.values(trainerPermissions).filter(v => v).length} ativas, recepcionistas: ${Object.values(receptionistPermissions).filter(v => v).length} ativas)`, 'PermissionsManagementPage');
            
            await saveGymRolePermissions(permissions);
            
            if (!mountedRef.current) return;
            
            logger.info('Permissões salvas com sucesso', 'PermissionsManagementPage');
            showSuccess('Permissões salvas com sucesso! As alterações já estão ativas.');
            setHasChanges(false);
        } catch (error) {
            logger.error('Erro ao salvar permissões', 'PermissionsManagementPage', error);
            
            if (!mountedRef.current) return;
            
            const errorMessage = 'Erro ao salvar permissões. Verifique sua conexão e tente novamente.';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            if (mountedRef.current) {
                setIsSaving(false);
            }
        }
    };

    const handleReset = () => {
        if (!mountedRef.current) return;
        
        const confirmMessage = '⚠️ ATENÇÃO: Tem certeza que deseja restaurar as permissões padrão?\n\nIsso afetará TODOS os treinadores e recepcionistas da academia. Todas as alterações personalizadas serão perdidas.';
        if (!window.confirm(confirmMessage)) {
            return;
        }
        
        logger.info('Restaurando permissões padrão', 'PermissionsManagementPage');
        loadPermissions();
        showWarning('Permissões restauradas para os valores padrão.');
    };

    const PermissionCheckbox: React.FC<{
        label: string;
        description: string;
        checked: boolean;
        onChange: (checked: boolean) => void;
    }> = ({ label, description, checked, onChange }) => (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
            />
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                    {label}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {description}
                </p>
            </div>
        </div>
    );

    if (!isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <div className="p-6 text-center">
                        <Alert type="error" title="Acesso Negado">
                            <p className="text-slate-600 dark:text-slate-400">
                                Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar permissões.
                            </p>
                        </Alert>
                    </div>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <div className="p-6 text-center">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando permissões...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Gerenciamento de Permissões
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Configure as permissões para treinadores e recepcionistas da academia
                </p>
                
                {/* Informações sobre permissões */}
                <Alert type="info" className="mb-4">
                    <p className="text-sm mb-2">
                        <strong>Como funciona:</strong> As permissões configuradas aqui serão aplicadas a todos os usuários com o role correspondente (treinador ou recepcionista).
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        ⚠️ Alterações nas permissões afetam imediatamente todos os usuários do role. Certifique-se de revisar as alterações antes de salvar.
                    </p>
                </Alert>
                
                {error && (
                    <Alert type="error" className="mb-4">
                        <p className="text-sm">{error}</p>
                    </Alert>
                )}
            </div>

            {/* Permissões de Treinadores */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                👨‍🏫 Permissões de Treinadores
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Defina quais ações os treinadores podem realizar no sistema
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <PermissionCheckbox
                            label="Visualizar Alunos"
                            description="Permite que treinadores vejam a lista de alunos"
                            checked={trainerPermissions.canViewStudents}
                            onChange={(checked) => handleTrainerPermissionChange('canViewStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Editar Alunos"
                            description="Permite que treinadores editem informações dos alunos"
                            checked={trainerPermissions.canEditStudents}
                            onChange={(checked) => handleTrainerPermissionChange('canEditStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Excluir Alunos"
                            description="Permite que treinadores excluam alunos do sistema"
                            checked={trainerPermissions.canDeleteStudents}
                            onChange={(checked) => handleTrainerPermissionChange('canDeleteStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Alunos"
                            description="Permite que treinadores criem novos alunos"
                            checked={trainerPermissions.canCreateStudents}
                            onChange={(checked) => handleTrainerPermissionChange('canCreateStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Todos os Dados"
                            description="Permite acesso completo a todos os dados e relatórios"
                            checked={trainerPermissions.canViewAllData}
                            onChange={(checked) => handleTrainerPermissionChange('canViewAllData', checked)}
                        />
                        <PermissionCheckbox
                            label="Gerenciar Configurações da Academia"
                            description="Permite alterar configurações gerais da academia"
                            checked={trainerPermissions.canManageGymSettings}
                            onChange={(checked) => handleTrainerPermissionChange('canManageGymSettings', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Treinadores"
                            description="Permite que treinadores criem outros treinadores"
                            checked={trainerPermissions.canCreateTrainers}
                            onChange={(checked) => handleTrainerPermissionChange('canCreateTrainers', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Recepcionistas"
                            description="Permite que treinadores criem recepcionistas"
                            checked={trainerPermissions.canCreateReceptionists}
                            onChange={(checked) => handleTrainerPermissionChange('canCreateReceptionists', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Dashboard de Treinador"
                            description="Permite acesso ao dashboard específico para treinadores"
                            checked={trainerPermissions.canViewTrainerDashboard}
                            onChange={(checked) => handleTrainerPermissionChange('canViewTrainerDashboard', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Dashboard de Aluno"
                            description="Permite acesso ao dashboard de alunos"
                            checked={trainerPermissions.canViewStudentDashboard}
                            onChange={(checked) => handleTrainerPermissionChange('canViewStudentDashboard', checked)}
                        />
                        <PermissionCheckbox
                            label="Gerenciar Permissões"
                            description="Permite que treinadores alterem permissões de outros usuários"
                            checked={trainerPermissions.canManagePermissions}
                            onChange={(checked) => handleTrainerPermissionChange('canManagePermissions', checked)}
                        />
                    </div>
                </div>
            </Card>

            {/* Permissões de Recepcionistas */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                👤 Permissões de Recepcionistas
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Defina quais ações os recepcionistas podem realizar no sistema
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <PermissionCheckbox
                            label="Visualizar Alunos"
                            description="Permite que recepcionistas vejam a lista de alunos"
                            checked={receptionistPermissions.canViewStudents}
                            onChange={(checked) => handleReceptionistPermissionChange('canViewStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Editar Alunos"
                            description="Permite que recepcionistas editem informações dos alunos"
                            checked={receptionistPermissions.canEditStudents}
                            onChange={(checked) => handleReceptionistPermissionChange('canEditStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Excluir Alunos"
                            description="Permite que recepcionistas excluam alunos do sistema"
                            checked={receptionistPermissions.canDeleteStudents}
                            onChange={(checked) => handleReceptionistPermissionChange('canDeleteStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Alunos"
                            description="Permite que recepcionistas criem novos alunos"
                            checked={receptionistPermissions.canCreateStudents}
                            onChange={(checked) => handleReceptionistPermissionChange('canCreateStudents', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Todos os Dados"
                            description="Permite acesso completo a todos os dados e relatórios"
                            checked={receptionistPermissions.canViewAllData}
                            onChange={(checked) => handleReceptionistPermissionChange('canViewAllData', checked)}
                        />
                        <PermissionCheckbox
                            label="Gerenciar Configurações da Academia"
                            description="Permite alterar configurações gerais da academia"
                            checked={receptionistPermissions.canManageGymSettings}
                            onChange={(checked) => handleReceptionistPermissionChange('canManageGymSettings', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Treinadores"
                            description="Permite que recepcionistas criem treinadores"
                            checked={receptionistPermissions.canCreateTrainers}
                            onChange={(checked) => handleReceptionistPermissionChange('canCreateTrainers', checked)}
                        />
                        <PermissionCheckbox
                            label="Criar Recepcionistas"
                            description="Permite que recepcionistas criem outros recepcionistas"
                            checked={receptionistPermissions.canCreateReceptionists}
                            onChange={(checked) => handleReceptionistPermissionChange('canCreateReceptionists', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Dashboard de Treinador"
                            description="Permite acesso ao dashboard específico para treinadores"
                            checked={receptionistPermissions.canViewTrainerDashboard}
                            onChange={(checked) => handleReceptionistPermissionChange('canViewTrainerDashboard', checked)}
                        />
                        <PermissionCheckbox
                            label="Visualizar Dashboard de Aluno"
                            description="Permite acesso ao dashboard de alunos"
                            checked={receptionistPermissions.canViewStudentDashboard}
                            onChange={(checked) => handleReceptionistPermissionChange('canViewStudentDashboard', checked)}
                        />
                        <PermissionCheckbox
                            label="Gerenciar Permissões"
                            description="Permite que recepcionistas alterem permissões de outros usuários"
                            checked={receptionistPermissions.canManagePermissions}
                            onChange={(checked) => handleReceptionistPermissionChange('canManagePermissions', checked)}
                        />
                    </div>
                </div>
            </Card>

            {/* Botões de Ação */}
            <Card>
                <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1">
                            {hasChanges && (
                                <Alert type="warning" className="mb-0">
                                    <p className="text-sm">
                                        ⚠️ <strong>Há alterações não salvas.</strong> Não esqueça de salvar as alterações antes de sair da página.
                                    </p>
                                </Alert>
                            )}
                            {!hasChanges && !error && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    ✓ Todas as alterações foram salvas
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <Button
                                variant="secondary"
                                onClick={handleReset}
                                disabled={isSaving || isLoading}
                                className="w-full sm:w-auto"
                            >
                                🔄 Restaurar Padrão
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving || isLoading}
                                className="w-full sm:w-auto"
                            >
                                {isSaving ? '⏳ Salvando...' : '💾 Salvar Permissões'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PermissionsManagementPage;


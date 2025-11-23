/**
 * Página de Gerenciamento de Permissões
 * Permite que administradores configurem permissões para treinadores e recepcionistas
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useUser } from '../context/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import {
    loadGymRolePermissions,
    saveGymRolePermissions,
    type RolePermissions,
    type GymRolePermissions,
} from '../services/permissionsService';

const PermissionsManagementPage: React.FC = () => {
    const { user } = useUser();
    const { showSuccess, showError } = useToast();
    const permissions = usePermissions();
    
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

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            setIsLoading(true);
            const saved = await loadGymRolePermissions();
            setTrainerPermissions(saved.trainer);
            setReceptionistPermissions(saved.receptionist);
            setHasChanges(false);
        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
            showError('Erro ao carregar permissões');
        } finally {
            setIsLoading(false);
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
        try {
            setIsSaving(true);
            const permissions: GymRolePermissions = {
                trainer: trainerPermissions,
                receptionist: receptionistPermissions,
            };
            await saveGymRolePermissions(permissions);
            showSuccess('Permissões salvas com sucesso!');
            setHasChanges(false);
        } catch (error) {
            console.error('Erro ao salvar permissões:', error);
            showError('Erro ao salvar permissões');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (!window.confirm('Tem certeza que deseja restaurar as permissões padrão? Isso afetará todos os treinadores e recepcionistas.')) {
            return;
        }
        loadPermissions();
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
                        <p className="text-slate-600 dark:text-slate-400">
                            Você não tem permissão para acessar esta página.
                        </p>
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
                        <p className="text-slate-600 dark:text-slate-400">Carregando permissões...</p>
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
                <p className="text-slate-600 dark:text-slate-400">
                    Configure as permissões para treinadores e recepcionistas da academia
                </p>
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
                        {hasChanges && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                ⚠️ Há alterações não salvas
                            </p>
                        )}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleReset}
                                disabled={isSaving}
                            >
                                🔄 Restaurar Padrão
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
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


/**
 * Hook para verificar permissões do usuário
 * Baseado no gymRole e role do usuário
 */

import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import { getRolePermissions, type RolePermissions } from '../services/permissionsService';

export interface Permissions {
    canViewStudents: boolean;
    canEditStudents: boolean;
    canDeleteStudents: boolean;
    canViewAllData: boolean;
    canManageGymSettings: boolean;
    canCreateStudents: boolean;
    canCreateTrainers: boolean;
    canCreateReceptionists: boolean;
    canViewTrainerDashboard: boolean;
    canViewStudentDashboard: boolean;
    canManagePermissions: boolean;
}

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissions(): Permissions {
    const { user } = useUser();
    const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificar se é Administrador ou Desenvolvedor (usuários padrão)
    const isDefaultAdmin = user.username === 'Administrador' || user.username === 'Desenvolvedor';
    const isAdmin = user.gymRole === 'admin' || isDefaultAdmin;
    const isTrainer = user.gymRole === 'trainer';
    const isReceptionist = user.gymRole === 'receptionist';
    const isStudent = user.gymRole === 'student';

    // Carregar permissões configuradas para o role do usuário
    useEffect(() => {
        const loadPermissions = async () => {
            setIsLoading(true);
            try {
                if (isTrainer) {
                    const perms = await getRolePermissions('trainer');
                    setRolePermissions(perms);
                } else if (isReceptionist) {
                    const perms = await getRolePermissions('receptionist');
                    setRolePermissions(perms);
                } else {
                    setRolePermissions(null);
                }
            } catch (error) {
                console.error('Erro ao carregar permissões:', error);
                setRolePermissions(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadPermissions();
    }, [isTrainer, isReceptionist, user.gymRole]);

    // Se for admin, sempre tem todas as permissões
    if (isAdmin) {
        return {
            canViewStudents: true,
            canEditStudents: true,
            canDeleteStudents: true,
            canViewAllData: true,
            canManageGymSettings: true,
            canCreateStudents: true,
            canCreateTrainers: true,
            canCreateReceptionists: true,
            canViewTrainerDashboard: true,
            canViewStudentDashboard: true,
            canManagePermissions: true,
        };
    }

    // Se ainda está carregando, retornar permissões padrão
    if (isLoading) {
        if (isTrainer) {
            return {
                canViewStudents: true,
                canEditStudents: false,
                canDeleteStudents: false,
                canViewAllData: true,
                canManageGymSettings: false,
                canCreateStudents: false,
                canCreateTrainers: false,
                canCreateReceptionists: false,
                canViewTrainerDashboard: true,
                canViewStudentDashboard: true,
                canManagePermissions: false,
            };
        }
        if (isReceptionist) {
            return {
                canViewStudents: true,
                canEditStudents: false,
                canDeleteStudents: false,
                canViewAllData: false,
                canManageGymSettings: false,
                canCreateStudents: false,
                canCreateTrainers: false,
                canCreateReceptionists: false,
                canViewTrainerDashboard: false,
                canViewStudentDashboard: true,
                canManagePermissions: false,
            };
        }
    }

    // Se for treinador ou recepcionista, usar permissões configuradas
    if (rolePermissions) {
        return {
            canViewStudents: rolePermissions.canViewStudents,
            canEditStudents: rolePermissions.canEditStudents,
            canDeleteStudents: rolePermissions.canDeleteStudents,
            canViewAllData: rolePermissions.canViewAllData,
            canManageGymSettings: rolePermissions.canManageGymSettings,
            canCreateStudents: rolePermissions.canCreateStudents,
            canCreateTrainers: rolePermissions.canCreateTrainers,
            canCreateReceptionists: rolePermissions.canCreateReceptionists,
            canViewTrainerDashboard: rolePermissions.canViewTrainerDashboard,
            canViewStudentDashboard: rolePermissions.canViewStudentDashboard,
            canManagePermissions: rolePermissions.canManagePermissions,
        };
    }

    // Fallback: permissões padrão baseadas no role
    if (isTrainer) {
        return {
            canViewStudents: true,
            canEditStudents: false,
            canDeleteStudents: false,
            canViewAllData: true,
            canManageGymSettings: false,
            canCreateStudents: false,
            canCreateTrainers: false,
            canCreateReceptionists: false,
            canViewTrainerDashboard: true,
            canViewStudentDashboard: true,
            canManagePermissions: false,
        };
    }

    if (isReceptionist) {
        return {
            canViewStudents: true,
            canEditStudents: false,
            canDeleteStudents: false,
            canViewAllData: false,
            canManageGymSettings: false,
            canCreateStudents: false,
            canCreateTrainers: false,
            canCreateReceptionists: false,
            canViewTrainerDashboard: false,
            canViewStudentDashboard: true,
            canManagePermissions: false,
        };
    }

    // Alunos não têm permissões administrativas
    return {
        canViewStudents: false,
        canEditStudents: false,
        canDeleteStudents: false,
        canViewAllData: false,
        canManageGymSettings: false,
        canCreateStudents: false,
        canCreateTrainers: false,
        canCreateReceptionists: false,
        canViewTrainerDashboard: false,
        canViewStudentDashboard: true,
        canManagePermissions: false,
    };
}

/**
 * Hook para verificar se o usuário é admin
 */
export function useIsAdmin(): boolean {
    const { user } = useUser();
    return user.gymRole === 'admin';
}

/**
 * Hook para verificar se o usuário é treinador
 */
export function useIsTrainer(): boolean {
    const { user } = useUser();
    return user.gymRole === 'trainer';
}

/**
 * Hook para verificar se o usuário é aluno
 */
export function useIsStudent(): boolean {
    const { user } = useUser();
    return user.gymRole === 'student';
}


/**
 * Hook para verificar permissões do usuário
 * Baseado no gymRole e role do usuário
 */

import { useUser } from '../context/UserContext';

export interface Permissions {
    canViewStudents: boolean;
    canEditStudents: boolean;
    canDeleteStudents: boolean;
    canViewAllData: boolean;
    canManageGymSettings: boolean;
    canCreateStudents: boolean;
    canCreateTrainers: boolean;
    canViewTrainerDashboard: boolean;
    canViewStudentDashboard: boolean;
}

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissions(): Permissions {
    const { user } = useUser();

    // Verificar se é Administrador ou Desenvolvedor (usuários padrão)
    const isDefaultAdmin = user.username === 'Administrador' || user.username === 'Desenvolvedor';
    const isAdmin = user.gymRole === 'admin' || isDefaultAdmin;
    const isTrainer = user.gymRole === 'trainer';
    const isStudent = user.gymRole === 'student';
    const hasGymId = !!user.gymId;

    return {
        // Apenas Admin e Trainer podem ver alunos (alunos NÃO podem)
        canViewStudents: isAdmin || isTrainer,
        // Apenas Admin pode editar/excluir
        canEditStudents: isAdmin,
        canDeleteStudents: isAdmin,
        // Apenas Admin e Trainer podem ver todos os dados
        canViewAllData: isAdmin || isTrainer,
        // Apenas Admin pode gerenciar configurações
        canManageGymSettings: isAdmin,
        // Apenas Admin pode criar alunos/treinadores
        canCreateStudents: isAdmin,
        canCreateTrainers: isAdmin,
        // Trainer e Admin podem ver dashboard de treinador
        canViewTrainerDashboard: isTrainer || isAdmin,
        // Todos podem ver dashboard de aluno
        canViewStudentDashboard: isStudent || isTrainer || isAdmin,
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


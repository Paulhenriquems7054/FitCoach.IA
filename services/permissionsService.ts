import type { User } from '../types';
import { saveAppSetting, getAppSetting } from './databaseService';

export interface DataPermissions {
  allowWeightHistory: boolean;
  allowMealPlans: boolean;
  allowPhotoAnalysis: boolean;
  allowWorkoutData: boolean;
  allowChatHistory: boolean;
}

export interface RolePermissions {
  canViewStudents: boolean;
  canEditStudents: boolean;
  canDeleteStudents: boolean;
  canCreateStudents: boolean;
  canViewAllData: boolean;
  canManageGymSettings: boolean;
  canCreateTrainers: boolean;
  canCreateReceptionists: boolean;
  canViewTrainerDashboard: boolean;
  canViewStudentDashboard: boolean;
  canManagePermissions: boolean;
}

export interface GymRolePermissions {
  trainer: RolePermissions;
  receptionist: RolePermissions;
}

const DEFAULT_PERMISSIONS: DataPermissions = {
  allowWeightHistory: true,
  allowMealPlans: true,
  allowPhotoAnalysis: true,
  allowWorkoutData: true,
  allowChatHistory: true,
};

// Permissões padrão para treinadores
const DEFAULT_TRAINER_PERMISSIONS: RolePermissions = {
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
};

// Permissões padrão para recepcionistas
const DEFAULT_RECEPTIONIST_PERMISSIONS: RolePermissions = {
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
};

const GYM_ROLE_PERMISSIONS_STORAGE_KEY = 'gym_role_permissions';

/**
 * Obtém as permissões do usuário ou retorna as padrões
 */
export const getUserPermissions = (user: User): DataPermissions => {
  return user.dataPermissions || DEFAULT_PERMISSIONS;
};

/**
 * Atualiza as permissões do usuário
 */
export const updateUserPermissions = (
  user: User,
  permissions: Partial<DataPermissions>
): User => {
  const currentPermissions = getUserPermissions(user);
  return {
    ...user,
    dataPermissions: {
      ...currentPermissions,
      ...permissions,
    },
  };
};

/**
 * Verifica se o usuário permitiu acesso a um tipo de dado
 */
export const hasPermission = (
  user: User,
  permission: keyof DataPermissions
): boolean => {
  const permissions = getUserPermissions(user);
  return permissions[permission] ?? true;
};

/**
 * Carrega as permissões configuradas para roles da academia
 */
export const loadGymRolePermissions = async (): Promise<GymRolePermissions> => {
  try {
    const saved = await getAppSetting<GymRolePermissions>(GYM_ROLE_PERMISSIONS_STORAGE_KEY, null);
    if (saved) {
      return {
        trainer: { ...DEFAULT_TRAINER_PERMISSIONS, ...saved.trainer },
        receptionist: { ...DEFAULT_RECEPTIONIST_PERMISSIONS, ...saved.receptionist },
      };
    }
  } catch (error) {
    console.error('Erro ao carregar permissões de roles:', error);
  }
  
  return {
    trainer: DEFAULT_TRAINER_PERMISSIONS,
    receptionist: DEFAULT_RECEPTIONIST_PERMISSIONS,
  };
};

/**
 * Salva as permissões configuradas para roles da academia
 */
export const saveGymRolePermissions = async (permissions: GymRolePermissions): Promise<void> => {
  try {
    await saveAppSetting(GYM_ROLE_PERMISSIONS_STORAGE_KEY, permissions);
    
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GYM_ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
    }
  } catch (error) {
    console.error('Erro ao salvar permissões de roles:', error);
    throw error;
  }
};

/**
 * Obtém as permissões para um role específico
 */
export const getRolePermissions = async (role: 'trainer' | 'receptionist'): Promise<RolePermissions> => {
  const permissions = await loadGymRolePermissions();
  return permissions[role];
};


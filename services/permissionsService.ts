import type { User } from '../types';

export interface DataPermissions {
  allowWeightHistory: boolean;
  allowMealPlans: boolean;
  allowPhotoAnalysis: boolean;
  allowWorkoutData: boolean;
  allowChatHistory: boolean;
}

const DEFAULT_PERMISSIONS: DataPermissions = {
  allowWeightHistory: true,
  allowMealPlans: true,
  allowPhotoAnalysis: true,
  allowWorkoutData: true,
  allowChatHistory: true,
};

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


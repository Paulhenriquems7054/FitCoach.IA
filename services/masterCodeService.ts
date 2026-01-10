/**
 * Serviço para validação de Código Mestre (Master Code)
 * Permite que alunos se cadastrem usando o código mestre da academia
 */

import { getSupabaseClient } from './supabaseService';
import { getCompanyByMasterCode } from './companyService';
import { logger } from '../utils/logger';

export interface MasterCodeValidationResult {
    isValid: boolean;
    error?: string;
    company?: {
        id: string;
        name: string;
        masterCode: string;
        planType: string;
        status: string;
    };
}

/**
 * Valida um código mestre e retorna informações da academia
 */
export async function validateMasterCode(
    masterCode: string
): Promise<MasterCodeValidationResult> {
    try {
        const supabase = getSupabaseClient();

        // Buscar empresa pelo código mestre
        const result = await getCompanyByMasterCode(masterCode);

        if (!result.success || !result.company) {
            return {
                isValid: false,
                error: result.error || 'Código mestre não encontrado ou academia inativa',
            };
        }

        const company = result.company;

        // Verificar se a academia está ativa
        if (company.status !== 'active') {
            return {
                isValid: false,
                error: `Academia com status: ${company.status}. Entre em contato com a academia.`,
            };
        }

        // Verificar se há licenças disponíveis
        const { data: licenseStats, error: licenseError } = await supabase
            .rpc('get_active_licenses_count', {
                p_company_id: company.id,
            });

        if (licenseError) {
            logger.warn('Erro ao verificar licenças', 'masterCodeService', licenseError);
            // Continuar mesmo se não conseguir verificar licenças
        } else {
            const activeLicenses = licenseStats || 0;
            if (activeLicenses >= company.maxLicenses) {
                return {
                    isValid: false,
                    error: 'Academia atingiu o limite de licenças. Entre em contato com a academia.',
                };
            }
        }

        // Código mestre válido
        return {
            isValid: true,
            company: {
                id: company.id,
                name: company.name,
                masterCode: company.masterCode,
                planType: company.planType || 'academy_starter_mini',
                status: company.status,
            },
        };
    } catch (error) {
        logger.error('Erro ao validar código mestre', 'masterCodeService', error);
        return {
            isValid: false,
            error: 'Erro ao validar código mestre. Tente novamente.',
        };
    }
}

/**
 * Vincula um usuário a uma academia usando o código mestre
 * Esta função deve ser chamada APÓS criar o usuário no Supabase
 * 
 * IMPORTANTE: Se o email do usuário corresponder ao email do owner da empresa,
 * o usuário será automaticamente promovido a administrador (gym_role: 'admin')
 * 
 * @param masterCode - Código mestre da academia
 * @param userId - ID do usuário no Supabase
 * @param userEmail - Email do usuário (opcional, será buscado automaticamente se não fornecido)
 */
export async function linkUserToCompanyByMasterCode(
    masterCode: string,
    userId: string,
    userEmail?: string
): Promise<{ success: boolean; companyId?: string; error?: string; isAdmin?: boolean }> {
    try {
        const validation = await validateMasterCode(masterCode);

        if (!validation.isValid || !validation.company) {
            return {
                success: false,
                error: validation.error || 'Código mestre inválido',
            };
        }

        const supabase = getSupabaseClient();

        // Buscar informações completas da empresa para obter o email do owner
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('email, owner_id')
            .eq('id', validation.company.id)
            .single();

        if (companyError || !companyData) {
            logger.warn('Erro ao buscar dados completos da empresa, continuando...', 'masterCodeService', companyError);
        }

        // Buscar email do usuário
        let finalUserEmail: string | null = userEmail ? userEmail.toLowerCase().trim() : null;
        
        // Se email não foi fornecido, tentar buscar do auth.getUser()
        if (!finalUserEmail) {
            try {
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
                if (authUser && authUser.id === userId && authUser.email) {
                    finalUserEmail = authUser.email.toLowerCase().trim();
                    logger.debug(`Email do usuário obtido via auth.getUser(): ${finalUserEmail}`, 'masterCodeService');
                } else if (authError) {
                    logger.debug(`Erro ao obter usuário via auth.getUser(): ${authError.message}`, 'masterCodeService');
                }
            } catch (authErr) {
                logger.debug('Exceção ao obter email via auth.getUser()', 'masterCodeService', authErr);
            }
        } else {
            logger.debug(`Email do usuário fornecido como parâmetro: ${finalUserEmail}`, 'masterCodeService');
        }

        // Determinar se o usuário deve ser admin
        // Verifica se o email corresponde ao email da empresa OU se o userId corresponde ao owner_id
        let gymRole: 'student' | 'admin' = 'student';
        let isAdmin = false;

        if (companyData) {
            const companyEmail = companyData.email?.toLowerCase().trim();
            const isOwnerEmail = finalUserEmail && companyEmail && finalUserEmail === companyEmail;
            const isOwnerId = companyData.owner_id && companyData.owner_id === userId;

            if (isOwnerEmail || isOwnerId) {
                gymRole = 'admin';
                isAdmin = true;
                logger.info(
                    `Usuário ${userId} (${finalUserEmail || 'email não encontrado'}) identificado como owner da academia ${validation.company.id}. Promovendo a admin.`,
                    'masterCodeService'
                );
            }
        }

        // Atualizar usuário com gym_id e gym_role (admin ou student)
        const { error: updateError } = await supabase
            .from('users')
            .update({
                gym_id: validation.company.id,
                gym_role: gymRole,
                is_gym_managed: true,
                subscription_status: 'active',
                plan_type: validation.company.planType,
            })
            .eq('id', userId);

        if (updateError) {
            logger.error('Erro ao vincular usuário à academia', 'masterCodeService', updateError);
            return {
                success: false,
                error: 'Erro ao vincular à academia. Tente novamente.',
            };
        }

        // Criar licença (company_license) - apenas se não for admin
        // Admins não precisam de licença, pois são owners
        if (!isAdmin) {
            const { error: licenseError } = await supabase
                .from('company_licenses')
                .insert({
                    company_id: validation.company.id,
                    user_id: userId,
                    status: 'active',
                    activated_at: new Date().toISOString(),
                });

            if (licenseError) {
                logger.warn('Erro ao criar licença (continuando)', 'masterCodeService', licenseError);
                // Não bloquear se falhar criar licença, o usuário já foi vinculado
            }
        } else {
            // Se for admin, atualizar o owner_id da empresa se ainda não estiver definido
            if (companyData && !companyData.owner_id) {
                const { error: updateOwnerError } = await supabase
                    .from('companies')
                    .update({ owner_id: userId })
                    .eq('id', validation.company.id);

                if (updateOwnerError) {
                    logger.warn('Erro ao atualizar owner_id da empresa', 'masterCodeService', updateOwnerError);
                } else {
                    logger.info(`owner_id da empresa ${validation.company.id} atualizado para ${userId}`, 'masterCodeService');
                }
            }
        }

        logger.info(
            `Usuário ${userId} vinculado à academia ${validation.company.id} via master_code como ${gymRole}`,
            'masterCodeService'
        );

        return {
            success: true,
            companyId: validation.company.id,
            isAdmin,
        };
    } catch (error) {
        logger.error('Erro ao vincular usuário à academia', 'masterCodeService', error);
        return {
            success: false,
            error: 'Erro ao vincular à academia. Tente novamente.',
        };
    }
}


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
 */
export async function linkUserToCompanyByMasterCode(
    masterCode: string,
    userId: string
): Promise<{ success: boolean; companyId?: string; error?: string }> {
    try {
        const validation = await validateMasterCode(masterCode);

        if (!validation.isValid || !validation.company) {
            return {
                success: false,
                error: validation.error || 'Código mestre inválido',
            };
        }

        const supabase = getSupabaseClient();

        // Atualizar usuário com gym_id e gym_role
        const { error: updateError } = await supabase
            .from('users')
            .update({
                gym_id: validation.company.id,
                gym_role: 'student',
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

        // Criar licença (company_license)
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

        logger.info(
            `Usuário ${userId} vinculado à academia ${validation.company.id} via master_code`,
            'masterCodeService'
        );

        return {
            success: true,
            companyId: validation.company.id,
        };
    } catch (error) {
        logger.error('Erro ao vincular usuário à academia', 'masterCodeService', error);
        return {
            success: false,
            error: 'Erro ao vincular à academia. Tente novamente.',
        };
    }
}


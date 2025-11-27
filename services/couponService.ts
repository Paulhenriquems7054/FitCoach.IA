/**
 * Serviço para gerenciar cupons de convite
 * Valida e aplica cupons durante o cadastro
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface CouponValidationResult {
    isValid: boolean;
    error?: string;
    coupon?: {
        code: string;
        planLinked: string;
        maxUses: number;
        currentUses: number;
        remainingUses: number;
    };
}

/**
 * Valida um código de cupom antes de criar a conta
 */
export async function validateCoupon(code: string): Promise<CouponValidationResult> {
    try {
        const supabase = getSupabaseClient();
        
        // Buscar cupom
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('code, plan_linked, max_uses, current_uses, is_active, valid_from, valid_until')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Cupom não encontrado
                return {
                    isValid: false,
                    error: 'Código de convite não encontrado'
                };
            }
            logger.error('Erro ao buscar cupom', 'couponService', error);
            return {
                isValid: false,
                error: 'Erro ao validar código de convite'
            };
        }

        if (!coupon) {
            return {
                isValid: false,
                error: 'Código de convite não encontrado'
            };
        }

        // Verificar se está ativo
        if (!coupon.is_active) {
            return {
                isValid: false,
                error: 'Este código de convite não está mais ativo'
            };
        }

        // Verificar se ainda pode ser usado
        if (coupon.current_uses >= coupon.max_uses) {
            return {
                isValid: false,
                error: 'Este código de convite atingiu o limite de usos.'
            };
        }

        // Verificar validade (se houver)
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return {
                isValid: false,
                error: 'Este código de convite ainda não está válido'
            };
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return {
                isValid: false,
                error: 'Este código de convite expirou'
            };
        }

        // Cupom válido
        return {
            isValid: true,
            coupon: {
                code: coupon.code,
                planLinked: coupon.plan_linked,
                maxUses: coupon.max_uses,
                currentUses: coupon.current_uses,
                remainingUses: coupon.max_uses - coupon.current_uses
            }
        };
    } catch (error) {
        logger.error('Erro ao validar cupom', 'couponService', error);
        return {
            isValid: false,
            error: 'Erro ao validar código de convite. Tente novamente.'
        };
    }
}

/**
 * Aplica um cupom a um usuário (incrementa uso e retorna o plano)
 * Esta função deve ser chamada APÓS criar o usuário no Supabase
 */
export async function applyCouponToUser(couponCode: string, userId: string): Promise<{ success: boolean; planLinked?: string; error?: string }> {
    try {
        const supabase = getSupabaseClient();
        
        // Usar a função SQL do Supabase para aplicar o cupom
        const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
            coupon_code: couponCode.toUpperCase().trim(),
            user_id: userId
        });

        if (error) {
            logger.error('Erro ao aplicar cupom', 'couponService', error);
            return {
                success: false,
                error: error.message || 'Erro ao aplicar código de convite'
            };
        }

        if (data && data.success) {
            return {
                success: true,
                planLinked: data.plan
            };
        } else {
            return {
                success: false,
                error: data?.error || 'Erro ao aplicar código de convite'
            };
        }
    } catch (error) {
        logger.error('Erro ao aplicar cupom', 'couponService', error);
        return {
            success: false,
            error: 'Erro ao aplicar código de convite. Tente novamente.'
        };
    }
}

/**
 * Verifica se um código de cupom existe e está disponível (sem aplicar)
 */
export async function checkCouponAvailability(code: string): Promise<CouponValidationResult> {
    return validateCoupon(code);
}


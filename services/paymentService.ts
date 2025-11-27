/**
 * Serviço de Pagamento Integrado
 * Processa pagamentos diretamente no app usando Stripe Checkout
 */

import { getSupabaseClient } from './supabaseService';
import { getUser } from './databaseService';
import { logger } from '../utils/logger';

export interface CheckoutSession {
    sessionId: string;
    url: string;
}

export interface PaymentIntent {
    clientSecret: string;
    amount: number;
    currency: string;
}

/**
 * Cria uma sessão de checkout do Stripe
 * Retorna URL para redirecionar o usuário
 */
export async function createCheckoutSession(
    planId: string,
    planName: string,
    price: number,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();

        // Chamar função Edge do Supabase para criar sessão de checkout
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                planId,
                planName,
                price,
                billingCycle,
                userId: user.id,
                userEmail: user.email || undefined,
                userName: user.nome,
            }
        });

        if (error) {
            logger.error('Erro ao criar sessão de checkout', 'paymentService', error);
            return { success: false, error: error.message || 'Erro ao criar sessão de pagamento' };
        }

        if (data && data.sessionId && data.url) {
            return {
                success: true,
                sessionId: data.sessionId,
                url: data.url
            };
        }

        return { success: false, error: 'Resposta inválida do servidor' };
    } catch (error) {
        logger.error('Erro ao criar sessão de checkout', 'paymentService', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}

/**
 * Verifica status de uma sessão de checkout
 */
export async function getCheckoutSessionStatus(sessionId: string): Promise<{
    success: boolean;
    status?: string;
    subscriptionId?: string;
    error?: string;
}> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.functions.invoke('get-checkout-session', {
            body: { sessionId }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            status: data?.status,
            subscriptionId: data?.subscriptionId
        };
    } catch (error) {
        logger.error('Erro ao verificar sessão', 'paymentService', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}

/**
 * Cria Payment Intent para pagamento direto (sem redirecionamento)
 * Útil para pagamentos com cartão direto no app
 */
export async function createPaymentIntent(
    planId: string,
    planName: string,
    amount: number,
    currency: string = 'brl'
): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();

        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: {
                planId,
                planName,
                amount,
                currency,
                userId: user.id,
                userEmail: user.email || undefined,
            }
        });

        if (error) {
            logger.error('Erro ao criar payment intent', 'paymentService', error);
            return { success: false, error: error.message };
        }

        if (data && data.clientSecret) {
            return {
                success: true,
                clientSecret: data.clientSecret
            };
        }

        return { success: false, error: 'Resposta inválida' };
    } catch (error) {
        logger.error('Erro ao criar payment intent', 'paymentService', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}

/**
 * Confirma pagamento após processamento
 */
export async function confirmPayment(
    paymentIntentId: string,
    planId: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();

        const { data, error } = await supabase.functions.invoke('confirm-payment', {
            body: {
                paymentIntentId,
                planId,
                userId: user.id
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            subscriptionId: data?.subscriptionId
        };
    } catch (error) {
        logger.error('Erro ao confirmar pagamento', 'paymentService', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}


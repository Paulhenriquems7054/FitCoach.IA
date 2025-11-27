/**
 * Modal de Checkout Integrado
 * Permite processar pagamentos diretamente no app
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { XIcon } from './icons/XIcon';
import { useToast } from './ui/Toast';
import { createCheckoutSession, getCheckoutSessionStatus } from '../services/paymentService';
import { logger } from '../utils/logger';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    planName: string;
    displayName: string;
    price: number;
    priceYearly?: number;
    onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    planId,
    planName,
    displayName,
    price,
    priceYearly,
    onSuccess
}) => {
    const { showSuccess, showError } = useToast();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const finalPrice = billingCycle === 'yearly' && priceYearly ? priceYearly : price;
    const monthlyEquivalent = billingCycle === 'yearly' && priceYearly 
        ? (priceYearly / 12).toFixed(2) 
        : price.toFixed(2);

    useEffect(() => {
        if (!isOpen) {
            setCheckoutUrl(null);
            setSessionId(null);
            setBillingCycle('monthly');
        }
    }, [isOpen]);

    const handleCheckout = async () => {
        setIsProcessing(true);
        try {
            const result = await createCheckoutSession(
                planId,
                planName,
                finalPrice,
                billingCycle
            );

            if (result.success && result.url && result.sessionId) {
                const currentSessionId = result.sessionId;
                setCheckoutUrl(result.url);
                setSessionId(currentSessionId);
                
                // Abrir checkout em nova aba ou iframe
                const checkoutWindow = window.open(result.url, 'stripe-checkout', 'width=600,height=700');
                
                if (checkoutWindow) {
                    // Monitorar quando a janela fechar
                    const checkInterval = setInterval(async () => {
                        if (checkoutWindow.closed) {
                            clearInterval(checkInterval);
                            
                            // Verificar status do pagamento
                            const status = await getCheckoutSessionStatus(currentSessionId);
                            if (status.success && status.status === 'complete') {
                                showSuccess('Pagamento realizado com sucesso!');
                                onSuccess?.();
                                onClose();
                            } else {
                                // Verificar novamente após alguns segundos (webhook pode demorar)
                                setTimeout(async () => {
                                    const retryStatus = await getCheckoutSessionStatus(currentSessionId);
                                    if (retryStatus.success && retryStatus.status === 'complete') {
                                        showSuccess('Pagamento realizado com sucesso!');
                                        onSuccess?.();
                                        onClose();
                                    }
                                }, 3000);
                            }
                        }
                    }, 1000);
                } else {
                    // Se popup foi bloqueado, mostrar URL para copiar
                    setCheckoutUrl(result.url);
                }
            } else {
                showError(result.error || 'Erro ao iniciar pagamento');
            }
        } catch (error) {
            logger.error('Erro no checkout', 'CheckoutModal', error);
            showError('Erro ao processar pagamento. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-modal="true">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            Assinar {displayName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                            aria-label="Fechar"
                        >
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {checkoutUrl && !sessionId ? (
                        // Mostrar link se popup foi bloqueado
                        <div className="space-y-4">
                            <Alert type="info" title="Popup bloqueado">
                                <p className="text-sm mb-3">
                                    Seu navegador bloqueou a janela de pagamento. Clique no link abaixo para continuar:
                                </p>
                                <a
                                    href={checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 text-center"
                                >
                                    Abrir Página de Pagamento
                                </a>
                            </Alert>
                        </div>
                    ) : (
                        <>
                            {/* Seleção de ciclo de faturamento */}
                            {priceYearly && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        Período de Assinatura
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('monthly')}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                                billingCycle === 'monthly'
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="font-semibold">Mensal</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                R$ {price.toFixed(2).replace('.', ',')}/mês
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('yearly')}
                                            className={`px-4 py-3 rounded-lg border-2 transition-all relative ${
                                                billingCycle === 'yearly'
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="font-semibold">Anual</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                R$ {monthlyEquivalent.replace('.', ',')}/mês
                                            </div>
                                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                Economize
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Resumo do pedido */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                                    Resumo do Pedido
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Plano:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{displayName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Período:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">Total:</span>
                                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                            R$ {finalPrice.toFixed(2).replace('.', ',')}
                                            {billingCycle === 'yearly' && ' /ano'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de pagamento */}
                            <Button
                                onClick={handleCheckout}
                                variant="primary"
                                className="w-full"
                                disabled={isProcessing}
                                size="lg"
                            >
                                {isProcessing ? 'Processando...' : `Pagar R$ ${finalPrice.toFixed(2).replace('.', ',')}`}
                            </Button>

                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                                🔒 Pagamento seguro processado pelo Stripe
                            </p>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};


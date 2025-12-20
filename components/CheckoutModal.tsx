import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { XIcon } from './icons/XIcon';
import { useToast } from './ui/Toast';
import { initiateSubscriptionCheckout } from '../services/paymentService';
import { useUser } from '../context/UserContext';

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

// Função removida - agora usa paymentService

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
    const { showSuccess, showError, showInfo } = useToast();
    const { user } = useUser();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); // Mantido apenas para UI de resumo
    const [isProcessing, setIsProcessing] = useState(false);

    // Para o plano anual VIP, usamos o preço anual se disponível.
    const isAnnualPlan = planName === 'annual_vip' && !!priceYearly;
    const finalPrice = isAnnualPlan ? (priceYearly as number) : price;

    useEffect(() => {
        if (!isOpen) {
            setBillingCycle('monthly');
        }
    }, [isOpen]);

    const handleCheckout = async () => {
        if (!user?.id) {
            showError('Você precisa estar logado para assinar um plano.');
            return;
        }

        setIsProcessing(true);
        try {
            // Usar o novo serviço de pagamento
            const { checkoutUrl } = await initiateSubscriptionCheckout(
                planName,
                user.id,
                user.username || undefined
            );

            if (!checkoutUrl) {
                showError('Não foi possível encontrar o link de pagamento para este plano. Verifique a configuração da Cakto.');
                return;
            }

            // Abrir checkout da Cakto em nova aba
            const win = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
            if (!win) {
                // Popup bloqueado: orientar o usuário a clicar manualmente
                showInfo('Seu navegador bloqueou a janela de pagamento. Verifique o bloqueador de popups ou copie o link de pagamento da Cakto.');
            } else {
                showInfo('Você foi redirecionado para a página de pagamento segura da Cakto.');
            }

            // Fechar modal e deixar o webhook cuidar da ativação da assinatura
            onClose();
            onSuccess?.();
            showSuccess('Após concluir o pagamento na Cakto, sua assinatura será ativada automaticamente.');
        } catch (error: any) {
            showError(error.message || 'Erro ao abrir o pagamento da Cakto. Tente novamente.');
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
                                    {isAnnualPlan ? 'Anual' : 'Mensal'}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-lg font-bold text-slate-900 dark:text-white">Total:</span>
                                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                                    {isAnnualPlan && ' /ano'}
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
                        {isProcessing ? 'Abrindo pagamento...' : 'Ir para pagamento na Cakto'}
                    </Button>

                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                        🔒 Pagamento seguro processado pela Cakto
                    </p>
                </div>
            </Card>
        </div>
    );
};


import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { XIcon } from './icons/XIcon';
import { useToast } from './ui/Toast';
import { initiateRechargeCheckout, RECHARGE_CONFIGS, type RechargeType } from '../services/paymentService';
import { useUser } from '../context/UserContext';

interface RechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { showSuccess, showError, showInfo } = useToast();
    const { user } = useUser();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedRecharge, setSelectedRecharge] = useState<RechargeType | null>(null);

    if (!isOpen) return null;

    const handleRecharge = async (rechargeType: RechargeType) => {
        if (!user?.id) {
            showError('Você precisa estar logado para comprar recargas.');
            return;
        }

        setIsProcessing(true);
        setSelectedRecharge(rechargeType);

        try {
            const { checkoutUrl } = await initiateRechargeCheckout(rechargeType, user.id);

            if (!checkoutUrl) {
                showError('Não foi possível encontrar o link de pagamento para esta recarga. Verifique a configuração da Cakto.');
                return;
            }

            // Abrir checkout da Cakto em nova aba
            const win = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
            if (!win) {
                showInfo('Seu navegador bloqueou a janela de pagamento. Verifique o bloqueador de popups.');
            } else {
                showInfo('Você foi redirecionado para a página de pagamento segura da Cakto.');
            }

            onClose();
            onSuccess?.();
            showSuccess('Após concluir o pagamento na Cakto, sua recarga será ativada automaticamente.');
        } catch (error: any) {
            showError(error.message || 'Erro ao abrir o pagamento da Cakto. Tente novamente.');
        } finally {
            setIsProcessing(false);
            setSelectedRecharge(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-modal="true">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            Comprar Mais Tempo
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                            aria-label="Fechar"
                        >
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Escolha uma opção para adicionar mais minutos à sua conta:
                    </p>

                    <div className="space-y-4">
                        {/* Ajuda Rápida (Turbo) */}
                        <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {RECHARGE_CONFIGS.turbo.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {RECHARGE_CONFIGS.turbo.description}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                        Válido por 24 horas
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                        R$ {RECHARGE_CONFIGS.turbo.price.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleRecharge('turbo')}
                                variant="primary"
                                className="w-full mt-3"
                                disabled={isProcessing}
                            >
                                {isProcessing && selectedRecharge === 'turbo' ? 'Abrindo pagamento...' : 'Comprar'}
                            </Button>
                        </div>

                        {/* Minutos de Reserva */}
                        <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {RECHARGE_CONFIGS.reserve.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {RECHARGE_CONFIGS.reserve.description}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                        Não expira
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        R$ {RECHARGE_CONFIGS.reserve.price.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleRecharge('reserve')}
                                variant="primary"
                                className="w-full mt-3"
                                disabled={isProcessing}
                            >
                                {isProcessing && selectedRecharge === 'reserve' ? 'Abrindo pagamento...' : 'Comprar'}
                            </Button>
                        </div>

                        {/* Conversa Ilimitada */}
                        <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {RECHARGE_CONFIGS.pass_libre.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {RECHARGE_CONFIGS.pass_libre.description}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                        Remove limite de 15 minutos por 30 dias
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        R$ {RECHARGE_CONFIGS.pass_libre.price.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleRecharge('pass_libre')}
                                variant="primary"
                                className="w-full mt-3"
                                disabled={isProcessing}
                            >
                                {isProcessing && selectedRecharge === 'pass_libre' ? 'Abrindo pagamento...' : 'Comprar'}
                            </Button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6">
                        🔒 Pagamento seguro processado pela Cakto
                    </p>
                </div>
            </Card>
        </div>
    );
};


/**
 * Modal de Cancelamento de Assinatura
 * Permite cancelar assinatura com opção de cancelar imediatamente ou no fim do período
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { XIcon } from './icons/XIcon';
import { useToast } from './ui/Toast';
import { cancelSubscription } from '../services/supabaseService';
import { cancelCaktoSubscription } from '../services/caktoService';
import { logger } from '../utils/logger';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscriptionId: string;
    subscriptionName: string;
    expiryDate?: string;
    caktoPaymentId?: string;
    onSuccess: () => void;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
    isOpen,
    onClose,
    subscriptionId,
    subscriptionName,
    expiryDate,
    caktoPaymentId,
    onSuccess
}) => {
    const { showSuccess, showError } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cancelType, setCancelType] = useState<'immediate' | 'end_of_period'>('end_of_period');

    const handleCancel = async () => {
        setIsProcessing(true);
        try {
            // Cancelar no Supabase (com opção de cancelamento imediato ou no fim do período)
            await cancelSubscription(subscriptionId, cancelType === 'immediate');

            // Se tiver payment_id do Cakto, cancelar lá também
            if (caktoPaymentId) {
                try {
                    await cancelCaktoSubscription(caktoPaymentId);
                } catch (error) {
                    logger.warn('Erro ao cancelar no Cakto, mas cancelamento no Supabase foi realizado', 'CancelSubscriptionModal', error);
                    // Continuar mesmo se falhar no Cakto
                }
            }

            showSuccess(
                cancelType === 'immediate' 
                    ? 'Assinatura cancelada com sucesso. Seu acesso foi encerrado.'
                    : 'Assinatura cancelada com sucesso. Você continuará com acesso até o fim do período pago.'
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            logger.error('Erro ao cancelar assinatura', 'CancelSubscriptionModal', error);
            showError(error.message || 'Erro ao cancelar assinatura. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const expiryDateFormatted = expiryDate 
        ? new Date(expiryDate).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        })
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-modal="true">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            Cancelar Assinatura
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                            aria-label="Fechar"
                        >
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <Alert type="warning" title="Atenção">
                            <p className="text-sm mb-2">
                                Você está prestes a cancelar sua assinatura <strong>{subscriptionName}</strong>.
                            </p>
                            {expiryDateFormatted && (
                                <p className="text-sm">
                                    Seu acesso atual é válido até <strong>{expiryDateFormatted}</strong>.
                                </p>
                            )}
                        </Alert>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                                O que acontece após o cancelamento?
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>Você perderá acesso aos recursos Premium</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>Não haverá mais cobranças automáticas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-1">•</span>
                                    <span>
                                        {cancelType === 'end_of_period' 
                                            ? 'Você manterá acesso até o fim do período já pago'
                                            : 'Seu acesso será encerrado imediatamente'}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Opção de cancelamento */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Quando deseja cancelar?
                            </label>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelType('end_of_period')}
                                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                        cancelType === 'end_of_period'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">No fim do período pago</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {expiryDateFormatted 
                                            ? `Acesso até ${expiryDateFormatted}`
                                            : 'Manter acesso até o fim do período já pago'}
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCancelType('immediate')}
                                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                                        cancelType === 'immediate'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-red-400 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">Imediatamente</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Encerrar acesso agora (não recomendado)
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Aviso sobre reembolso */}
                        <Alert type="info" title="Sobre reembolsos">
                            <p className="text-sm">
                                {cancelType === 'immediate' 
                                    ? 'Cancelamentos imediatos não geram reembolso proporcional do período já pago.'
                                    : 'Não há reembolso proporcional. Você manterá acesso até o fim do período já pago.'}
                            </p>
                        </Alert>

                        {/* Botões de ação */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={onClose}
                                variant="secondary"
                                className="flex-1"
                                disabled={isProcessing}
                            >
                                Manter Assinatura
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="danger"
                                className="flex-1"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};


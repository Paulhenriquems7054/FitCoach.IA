import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../components/ui/Toast';
import { ShieldIcon } from '../components/icons/ShieldIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import { DevicePhoneMobileIcon } from '../components/icons/DevicePhoneMobileIcon';
import { ClipboardDocumentListIcon } from '../components/icons/ClipboardDocumentListIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { ExclamationCircleIcon } from '../components/icons/ExclamationCircleIcon';
import { downloadExportedData } from '../services/dataExportService';
import { getActivityLogs, exportActivityLogs, filterLogsByType, ActivityLog } from '../services/activityLogService';
import { getActiveSessions, endSession, endAllOtherSessions, createOrUpdateSession, ActiveSession } from '../services/sessionService';
import { getUserPermissions, updateUserPermissions, hasPermission } from '../services/permissionsService';
import { deleteUserAccount, anonymizeUserData } from '../services/accountDeletionService';
import { logActivity } from '../services/activityLogService';

const PrivacyPage: React.FC = () => {
    const { user, setUser, toggleAnonymization } = useUser();
    const { t } = useI18n();
    const { showSuccess, showError, showWarning } = useToast();
    const [biometrics, setBiometrics] = useState(user.securitySettings?.biometricEnabled || false);
    const [securityNotifications, setSecurityNotifications] = useState(user.securitySettings?.securityNotifications ?? true);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [selectedLogType, setSelectedLogType] = useState<ActivityLog['type'] | 'all'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteOption, setDeleteOption] = useState<'delete' | 'anonymize'>('delete');
    const [isExporting, setIsExporting] = useState(false);
    const [permissions, setPermissions] = useState(getUserPermissions(user));

    // Carregar dados ao montar
    useEffect(() => {
        loadData();
        // Criar/atualizar sessão atual
        createOrUpdateSession().then(() => {
            loadSessions();
        });
    }, []);

    const loadData = () => {
        setActivityLogs(getActivityLogs());
        loadSessions();
    };

    const loadSessions = () => {
        setActiveSessions(getActiveSessions());
    };

    const handleToggleAnonymization = () => {
        toggleAnonymization();
        logActivity('Anonimização de dados alterada', 'security', {
            isAnonymized: !user.isAnonymized
        });
        showSuccess(user.isAnonymized ? 'Anonimização desativada' : 'Anonimização ativada');
    };

    const handleToggleBiometrics = () => {
        const newValue = !biometrics;
        setBiometrics(newValue);
        setUser({
            ...user,
            securitySettings: {
                ...user.securitySettings,
                biometricEnabled: newValue,
            },
        });
        logActivity('Autenticação biométrica alterada', 'security', {
            enabled: newValue
        });
        showSuccess(newValue ? 'Autenticação biométrica ativada' : 'Autenticação biométrica desativada');
    };

    const handleToggleSecurityNotifications = () => {
        const newValue = !securityNotifications;
        setSecurityNotifications(newValue);
        setUser({
            ...user,
            securitySettings: {
                ...user.securitySettings,
                securityNotifications: newValue,
            },
        });
        showSuccess(newValue ? 'Notificações de segurança ativadas' : 'Notificações de segurança desativadas');
    };

    const handlePermissionChange = (permission: keyof typeof permissions) => {
        const newPermissions = {
            ...permissions,
            [permission]: !permissions[permission],
        };
        setPermissions(newPermissions);
        const updatedUser = updateUserPermissions(user, newPermissions);
        setUser(updatedUser);
        logActivity(`Permissão de dados alterada: ${permission}`, 'security', {
            permission,
            allowed: newPermissions[permission]
        });
        showSuccess('Permissões atualizadas com sucesso');
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            await downloadExportedData();
            logActivity('Dados exportados', 'security');
            showSuccess('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            showError('Erro ao exportar dados. Tente novamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportLogs = () => {
        try {
            exportActivityLogs();
            showSuccess('Logs exportados com sucesso!');
        } catch (error) {
            showError('Erro ao exportar logs.');
        }
    };

    const handleEndSession = (sessionId: string) => {
        endSession(sessionId);
        loadSessions();
        logActivity('Sessão encerrada', 'security', { sessionId });
        showSuccess('Sessão encerrada com sucesso');
    };

    const handleEndAllSessions = () => {
        endAllOtherSessions();
        loadSessions();
        logActivity('Todas as outras sessões encerradas', 'security');
        showSuccess('Todas as outras sessões foram encerradas');
    };

    const handleDeleteAccount = async () => {
        if (deleteOption === 'anonymize') {
            try {
                await anonymizeUserData(user);
                showSuccess('Dados anonimizados com sucesso');
                setShowDeleteConfirm(false);
                window.location.hash = '#/presentation';
            } catch (error) {
                showError('Erro ao anonimizar dados');
            }
        } else {
            if (!window.confirm('Tem CERTEZA que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita!')) {
                return;
            }
            try {
                await deleteUserAccount(user);
                showSuccess('Conta excluída com sucesso');
            } catch (error) {
                showError('Erro ao excluir conta');
            }
        }
    };

    const filteredLogs = selectedLogType === 'all' 
        ? activityLogs 
        : filterLogsByType(activityLogs, selectedLogType);

    const rawTitle = t('privacy.title');
    const pageTitle = rawTitle === 'privacy.title' ? t('sidebar.privacy') : rawTitle;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                    <ShieldIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('privacy.subtitle')}</p>
            </div>

            {/* Privacidade de Dados */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    Privacidade de Dados
                </h2>
                
                <Card>
                    <div className="p-6 space-y-6">
                        {/* Anonimização */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-4 flex-1">
                                <EyeSlashIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {t('privacy.anonymization.title')}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {t('privacy.anonymization.description')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleAnonymization}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${user.isAnonymized ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                role="switch"
                                aria-checked={user.isAnonymized}
                                aria-label="Alternar anonimização"
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.isAnonymized ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>

                        {/* Permissões de Dados */}
                        <div className="py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-4 mb-4">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        {t('privacy.permissions.title')}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        {t('privacy.permissions.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3 ml-10">
                                {Object.entries(permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <label className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                            {key === 'allowWeightHistory' && 'Histórico de Peso'}
                                            {key === 'allowMealPlans' && 'Planos Alimentares'}
                                            {key === 'allowPhotoAnalysis' && 'Análises de Fotos'}
                                            {key === 'allowWorkoutData' && 'Dados de Treino'}
                                            {key === 'allowChatHistory' && 'Histórico de Chat'}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handlePermissionChange(key as keyof typeof permissions)}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 ${value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                            role="switch"
                                            aria-checked={value}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-4' : 'translate-x-0'}`}></span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exportar Dados */}
                        <div className="py-4">
                            <div className="flex items-start gap-4">
                                <DownloadIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        Exportar Meus Dados (LGPD)
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Baixe uma cópia completa de todos os seus dados em formato JSON.
                                    </p>
                                    <Button
                                        onClick={handleExportData}
                                        disabled={isExporting}
                                        variant="secondary"
                                        className="w-full sm:w-auto"
                                    >
                                        <DownloadIcon className="w-4 h-4 mr-2" />
                                        {isExporting ? 'Exportando...' : 'Exportar Dados'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Segurança da Conta */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    Segurança da Conta
                </h2>

                <Card>
                    <div className="p-6 space-y-6">
                        {/* Autenticação Biométrica */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-4 flex-1">
                                <ShieldCheckIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {t('privacy.biometrics.title')}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {t('privacy.biometrics.description')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleBiometrics}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${biometrics ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                role="switch"
                                aria-checked={biometrics}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${biometrics ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>

                        {/* Notificações de Segurança */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-4 flex-1">
                                <ShieldIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Notificações de Segurança
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Receba alertas sobre atividades importantes na sua conta.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleSecurityNotifications}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${securityNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                role="switch"
                                aria-checked={securityNotifications}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${securityNotifications ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>

                        {/* Sessões Ativas */}
                        <div className="py-4">
                            <div className="flex items-start gap-4 mb-4">
                                <DevicePhoneMobileIcon className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Sessões Ativas
                                        </h3>
                                        {activeSessions.filter(s => !s.isCurrent).length > 0 && (
                                            <Button
                                                onClick={handleEndAllSessions}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                Encerrar Todas as Outras
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Gerencie os dispositivos conectados à sua conta.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 ml-10">
                                {activeSessions.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma sessão ativa</p>
                                ) : (
                                    activeSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {session.device} • {session.browser}
                                                    </span>
                                                    {session.isCurrent && (
                                                        <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                                                            Atual
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {session.ip} • Última atividade: {new Date(session.lastActivity).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            {!session.isCurrent && (
                                                <Button
                                                    onClick={() => handleEndSession(session.id)}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    Encerrar
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Logs de Atividade */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    {t('privacy.audit.title')}
                </h2>

                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('privacy.audit.description')}
                            </p>
                            <div className="flex gap-2">
                                <select
                                    value={selectedLogType}
                                    onChange={(e) => setSelectedLogType(e.target.value as ActivityLog['type'] | 'all')}
                                    className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                >
                                    <option value="all">Todos</option>
                                    <option value="login">Login</option>
                                    <option value="profile">Perfil</option>
                                    <option value="plan">Planos</option>
                                    <option value="report">Relatórios</option>
                                    <option value="security">Segurança</option>
                                    <option value="other">Outros</option>
                                </select>
                                <Button onClick={handleExportLogs} variant="secondary" size="sm">
                                    <DownloadIcon className="w-4 h-4 mr-2" />
                                    Exportar
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-900 dark:text-white">{t('privacy.audit.event')}</th>
                                        <th className="p-3 font-semibold text-slate-900 dark:text-white">{t('privacy.audit.ip')}</th>
                                        <th className="p-3 font-semibold text-slate-900 dark:text-white">{t('privacy.audit.timestamp')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-slate-500 dark:text-slate-400">
                                                Nenhum log encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-3 text-slate-900 dark:text-slate-100">{log.event}</td>
                                                <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">{log.ip || 'N/A'}</td>
                                                <td className="p-3 text-slate-600 dark:text-slate-400">{log.timestamp}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Zona de Perigo */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <ExclamationCircleIcon className="w-6 h-6" />
                    Zona de Perigo
                </h2>

                <Card className="border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                                    Excluir ou Anonimizar Conta
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                                    Esta ação não pode ser desfeita. Escolha entre excluir completamente sua conta ou anonimizar seus dados.
                                </p>
                                
                                {!showDeleteConfirm ? (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <TrashIcon className="w-4 h-4 mr-2" />
                                            Excluir ou Anonimizar Conta
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="deleteOption"
                                                    value="anonymize"
                                                    checked={deleteOption === 'anonymize'}
                                                    onChange={() => setDeleteOption('anonymize')}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-slate-900 dark:text-slate-100">
                                                    Anonimizar dados (recomendado) - Mantém a conta mas remove informações pessoais
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="deleteOption"
                                                    value="delete"
                                                    checked={deleteOption === 'delete'}
                                                    onChange={() => setDeleteOption('delete')}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-slate-900 dark:text-slate-100">
                                                    Excluir completamente - Remove todos os dados permanentemente
                                                </span>
                                            </label>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleDeleteAccount}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Confirmar
                                            </Button>
                                            <Button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                variant="secondary"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivacyPage;

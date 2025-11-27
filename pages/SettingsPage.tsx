
import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { useI18n } from '../context/I18nContext';
import { Button } from '../components/ui/Button';
import {
    API_MODE_STORAGE_KEY,
    FREE_API_KEY_STORAGE_KEY,
    PAID_API_KEY_STORAGE_KEY,
    PROVIDER_LINK_STORAGE_KEY,
    DEFAULT_FREE_API_KEY,
    DEFAULT_PROVIDER_LINK,
} from '../constants/apiConfig';
import { resetAssistantSession } from '../services/assistantService';
import { saveAppSetting, getAppSetting } from '../services/databaseService';
import { setUseLocalAI, shouldUseLocalAI } from '../services/iaController';
import { testLocalIA } from '../services/localAIService';
import { configureGymServer, getGymServerUrlConfig, checkServerAvailability } from '../services/syncService';
import { useToast } from '../components/ui/Toast';
import { saveGymBranding, loadGymBranding, loadGymConfig, saveGymConfig, getAppName } from '../services/gymConfigService';
import { deleteUserAccount } from '../services/accountDeletionService';
import { Alert } from '../components/ui/Alert';
import type { GymBranding, Gym } from '../types';

const SettingsPage: React.FC = () => {
    const { user } = useUser();
    const { t, language, setLanguage } = useI18n();
    
    // Estados para personalização
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [primaryColor, setPrimaryColor] = useState<string>('#10b981');
    const [secondaryColor, setSecondaryColor] = useState<string>('#059669');
    const [accentColor, setAccentColor] = useState<string>('#34d399');
    const [brandingDirty, setBrandingDirty] = useState(false);
    const [apiMode, setApiModeState] = useState<'paid' | 'free'>('free');
    const [paidApiKey, setPaidApiKeyState] = useState<string>('');
    const [freeApiKey, setFreeApiKeyState] = useState<string>(DEFAULT_FREE_API_KEY);
    const [providerLink, setProviderLinkState] = useState<string>(DEFAULT_PROVIDER_LINK);
    const [isLoading, setIsLoading] = useState(true);
    const [useLocalAI, setUseLocalAIState] = useState<boolean>(true);
    const [localAITestResult, setLocalAITestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTestingLocalAI, setIsTestingLocalAI] = useState<boolean>(false);
    const [gymServerUrl, setGymServerUrlState] = useState<string>('');
    const [isCheckingServer, setIsCheckingServer] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Estados para configuração da academia
    const isAdmin = user.gymRole === 'admin' || user.username === 'Administrador' || user.username === 'Desenvolvedor';
    const [gym, setGym] = useState<Gym | null>(null);
    const [isEditingGym, setIsEditingGym] = useState(false);
    const [gymFormData, setGymFormData] = useState({
        name: '',
        appName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        cnpj: '',
        address: '',
        addressNumber: '',
        addressComplement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
    });
    
    const { showSuccess, showError } = useToast();

    // Carregar configurações do banco de dados
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedApiMode = await getAppSetting<'paid' | 'free'>(API_MODE_STORAGE_KEY, 'free');
                const savedPaidKey = await getAppSetting<string>(PAID_API_KEY_STORAGE_KEY, '');
                const savedFreeKey = await getAppSetting<string>(FREE_API_KEY_STORAGE_KEY, DEFAULT_FREE_API_KEY);
                const savedProviderLink = await getAppSetting<string>(PROVIDER_LINK_STORAGE_KEY, DEFAULT_PROVIDER_LINK);
                const savedGymServerUrl = getGymServerUrlConfig();

                if (savedApiMode === 'paid' || savedApiMode === 'free') {
                    setApiModeState(savedApiMode);
                }
                setPaidApiKeyState(savedPaidKey || '');
                setFreeApiKeyState(savedFreeKey || DEFAULT_FREE_API_KEY);
                setProviderLinkState(savedProviderLink || DEFAULT_PROVIDER_LINK);
                setGymServerUrlState(savedGymServerUrl || '');
                
                // Carregar preferência de IA Local
                const savedUseLocalAI = shouldUseLocalAI();
                setUseLocalAIState(savedUseLocalAI);

                // Carregar branding personalizado
                const savedBranding = loadGymBranding();
                if (savedBranding) {
                    setLogoPreview(savedBranding.logo || '');
                    setPrimaryColor(savedBranding.colors.primary || '#10b981');
                    setSecondaryColor(savedBranding.colors.secondary || '#059669');
                    setAccentColor(savedBranding.colors.accent || '#34d399');
                }
                
                // Carregar dados da academia (apenas para administradores)
                const isAdminUser = user.gymRole === 'admin' || user.username === 'Administrador' || user.username === 'Desenvolvedor';
                if (isAdminUser) {
                    const loadedGym = loadGymConfig();
                    if (loadedGym) {
                        setGym(loadedGym);
                        setGymFormData({
                            name: loadedGym.name,
                            appName: loadedGym.appName || getAppName(),
                            contactEmail: loadedGym.contactEmail || '',
                            contactPhone: loadedGym.contactPhone || '',
                            website: loadedGym.website || '',
                            cnpj: loadedGym.cnpj || '',
                            address: loadedGym.address || '',
                            addressNumber: loadedGym.addressNumber || '',
                            addressComplement: loadedGym.addressComplement || '',
                            neighborhood: loadedGym.neighborhood || '',
                            city: loadedGym.city || '',
                            state: loadedGym.state || '',
                            zipCode: loadedGym.zipCode || '',
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
                // Fallback para localStorage
                if (typeof window !== 'undefined') {
                    const stored = window.localStorage.getItem(API_MODE_STORAGE_KEY);
                    if (stored === 'paid' || stored === 'free') {
                        setApiModeState(stored);
                    }
                    setPaidApiKeyState(window.localStorage.getItem(PAID_API_KEY_STORAGE_KEY) ?? '');
                    setFreeApiKeyState(window.localStorage.getItem(FREE_API_KEY_STORAGE_KEY) ?? DEFAULT_FREE_API_KEY);
                    setProviderLinkState(window.localStorage.getItem(PROVIDER_LINK_STORAGE_KEY) ?? DEFAULT_PROVIDER_LINK);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const [isDirty, setIsDirty] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const setApiMode = useCallback((mode: 'paid' | 'free') => {
        setApiModeState(mode);
        setIsDirty(true);
        setStatusMessage(null);
        setErrorMessage(null);
    }, []);

    const setPaidApiKey = useCallback((value: string) => {
        setPaidApiKeyState(value);
        setIsDirty(true);
        setStatusMessage(null);
        setErrorMessage(null);
    }, []);

    const setFreeApiKey = useCallback((value: string) => {
        setFreeApiKeyState(value);
        setIsDirty(true);
        setStatusMessage(null);
        setErrorMessage(null);
    }, []);

    const setProviderLink = useCallback((value: string) => {
        setProviderLinkState(value);
        setIsDirty(true);
        setStatusMessage(null);
        setErrorMessage(null);
    }, []);

    const handleNotifications = () => {
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(t('settings.notifications.grantedTitle'), {
                        body: t('settings.notifications.grantedBody'),
                    });
                }
            });
        }
    };

    const handleOpenProviderLink = () => {
        if (!providerLink) return;
        const formattedLink = providerLink.startsWith('http')
            ? providerLink
            : `https://${providerLink}`;
        window.open(formattedLink, '_blank', 'noopener,noreferrer');
    };

    const handleUseDefaultFreeKey = () => {
        setApiMode('free');
        setFreeApiKey(DEFAULT_FREE_API_KEY);
    };

    const handleActivateFreeApi = () => {
        setApiMode('free');
        setFreeApiKey(DEFAULT_FREE_API_KEY);
        setPaidApiKey('');
    };

    // Funções de personalização
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showError('Logo deve ter no máximo 2MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showError('Por favor, selecione um arquivo de imagem');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setLogoPreview(result);
            setBrandingDirty(true);
        };
        reader.onerror = () => {
            showError('Erro ao ler o arquivo');
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoPreview('');
        setBrandingDirty(true);
    };

    const handleSaveBranding = () => {
        try {
            const gymId = user.gymId || 'default-gym';
            const branding: GymBranding = {
                gymId: gymId,
                appName: 'FitCoach.IA',
                logo: logoPreview || undefined,
                colors: {
                    primary: primaryColor,
                    secondary: secondaryColor,
                    accent: accentColor,
                },
            };

            saveGymBranding(branding);
            setBrandingDirty(false);
            showSuccess('Personalização salva com sucesso! A página será recarregada para aplicar as mudanças.');
            
            // Recarregar após um breve delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showError('Erro ao salvar personalização');
            console.error(error);
        }
    };

    const handleResetBranding = () => {
        if (!window.confirm('Tem certeza que deseja restaurar as cores padrão? Isso removerá sua personalização.')) {
            return;
        }

        setLogoPreview('');
        setPrimaryColor('#10b981');
        setSecondaryColor('#059669');
        setAccentColor('#34d399');
        setBrandingDirty(true);
    };

    // Handlers para configuração da academia
    const handleGymInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGymFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGymSave = () => {
        if (!gym) {
            // Criar nova academia se não existir
            const newGym: Gym = {
                id: user.gymId || 'default-gym',
                name: gymFormData.name,
                appName: gymFormData.appName || getAppName(),
                contactEmail: gymFormData.contactEmail,
                contactPhone: gymFormData.contactPhone,
                website: gymFormData.website,
                cnpj: gymFormData.cnpj,
                address: gymFormData.address,
                addressNumber: gymFormData.addressNumber,
                addressComplement: gymFormData.addressComplement,
                neighborhood: gymFormData.neighborhood,
                city: gymFormData.city,
                state: gymFormData.state,
                zipCode: gymFormData.zipCode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
            };
            saveGymConfig(newGym);
            setGym(newGym);
        } else {
            const updatedGym: Gym = {
                ...gym,
                name: gymFormData.name,
                appName: gymFormData.appName,
                contactEmail: gymFormData.contactEmail,
                contactPhone: gymFormData.contactPhone,
                website: gymFormData.website,
                cnpj: gymFormData.cnpj,
                address: gymFormData.address,
                addressNumber: gymFormData.addressNumber,
                addressComplement: gymFormData.addressComplement,
                neighborhood: gymFormData.neighborhood,
                city: gymFormData.city,
                state: gymFormData.state,
                zipCode: gymFormData.zipCode,
                updatedAt: new Date().toISOString(),
            };
            saveGymConfig(updatedGym);
            setGym(updatedGym);
        }
        
        setIsEditingGym(false);
        showSuccess('Configuração da academia salva com sucesso!');
    };

    const handleGymCancel = () => {
        if (gym) {
            setGymFormData({
                name: gym.name,
                appName: gym.appName || getAppName(),
                contactEmail: gym.contactEmail || '',
                contactPhone: gym.contactPhone || '',
                website: gym.website || '',
                cnpj: gym.cnpj || '',
                address: gym.address || '',
                addressNumber: gym.addressNumber || '',
                addressComplement: gym.addressComplement || '',
                neighborhood: gym.neighborhood || '',
                city: gym.city || '',
                state: gym.state || '',
                zipCode: gym.zipCode || '',
            });
        }
        setIsEditingGym(false);
    };

    // Observar mudanças nas cores (apenas após o carregamento inicial)
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        // Verificar se houve mudança real em relação aos valores padrão ou salvos
        const savedBranding = loadGymBranding();
        const hasChanges = 
            primaryColor !== (savedBranding?.colors.primary || '#10b981') ||
            secondaryColor !== (savedBranding?.colors.secondary || '#059669') ||
            accentColor !== (savedBranding?.colors.accent || '#34d399') ||
            logoPreview !== (savedBranding?.logo || '');
        
        if (hasChanges) {
            setBrandingDirty(true);
        }
    }, [primaryColor, secondaryColor, accentColor, logoPreview, isInitialLoad]);

    const handleSaveSettings = async () => {
        try {
            // Salvar no banco de dados
            await saveAppSetting(API_MODE_STORAGE_KEY, apiMode);
            await saveAppSetting(PAID_API_KEY_STORAGE_KEY, paidApiKey);
            await saveAppSetting(FREE_API_KEY_STORAGE_KEY, freeApiKey);
            await saveAppSetting(PROVIDER_LINK_STORAGE_KEY, providerLink);
            
            // Fallback para localStorage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(API_MODE_STORAGE_KEY, apiMode);
                window.localStorage.setItem(PAID_API_KEY_STORAGE_KEY, paidApiKey);
                window.localStorage.setItem(FREE_API_KEY_STORAGE_KEY, freeApiKey);
                window.localStorage.setItem(PROVIDER_LINK_STORAGE_KEY, providerLink);
            }
            
            resetAssistantSession();
            setIsDirty(false);
            setStatusMessage('Configurações salvas com sucesso!');
            setErrorMessage(null);
        } catch (error) {
            console.error('Erro ao salvar configurações', error);
            setErrorMessage('Não foi possível salvar as configurações. Tente novamente.');
            setStatusMessage(null);
        }
    };

    useEffect(() => {
        if (!statusMessage) return;
        const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
        return () => window.clearTimeout(timeout);
    }, [statusMessage]);

    useEffect(() => {
        if (!errorMessage) return;
        const timeout = window.setTimeout(() => setErrorMessage(null), 6000);
        return () => window.clearTimeout(timeout);
    }, [errorMessage]);

    return (
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
             <div className="text-center">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">{t('settings.subtitle')}</p>
            </div>
            
            {(statusMessage || errorMessage) && (
                <Card>
                    <div className="p-4">
                        {statusMessage && (
                            <p className="text-sm font-medium text-emerald-600">{statusMessage}</p>
                        )}
                        {errorMessage && (
                            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
                        )}
                    </div>
                </Card>
            )}

            {/* Seção: Idioma e Notificações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                    <div className="p-4 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            🌐 {t('settings.language.title')}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {t('settings.language.description')}
                        </p>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es')}
                            className="w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="pt">🇧🇷 Português</option>
                            <option value="en">🇺🇸 English</option>
                            <option value="es">🇪🇸 Español</option>
                        </select>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            🔔 {t('settings.notifications.title')}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {t('settings.notifications.description')}
                        </p>
                        <Button onClick={handleNotifications} className="w-full sm:w-auto">
                            {t('settings.notifications.button')}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Seção: Configuração da Academia - Apenas para administradores */}
            {isAdmin && (
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    ⚙️ Configuração da Academia
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Gerencie as informações e dados cadastrais da sua academia.
                                </p>
                            </div>
                            {!isEditingGym && (
                                <Button onClick={() => setIsEditingGym(true)} className="w-full sm:w-auto">
                                    ✏️ Editar
                                </Button>
                            )}
                        </div>

                        {isEditingGym ? (
                            <div className="space-y-6">
                                    <div>
                                        <label htmlFor="gym-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome da Academia
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="gym-name"
                                            value={gymFormData.name}
                                            onChange={handleGymInputChange}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="gym-appName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome do App
                                        </label>
                                        <input
                                            type="text"
                                            name="appName"
                                            id="gym-appName"
                                            value={gymFormData.appName}
                                            onChange={handleGymInputChange}
                                            placeholder="Ex: Academia XYZ - FitCoach.IA"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="gym-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Email de Contato
                                            </label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                id="gym-email"
                                                value={gymFormData.contactEmail}
                                                onChange={handleGymInputChange}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="gym-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Telefone de Contato
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                id="gym-phone"
                                                value={gymFormData.contactPhone}
                                                onChange={handleGymInputChange}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="gym-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            id="gym-website"
                                            value={gymFormData.website}
                                            onChange={handleGymInputChange}
                                            placeholder="https://exemplo.com"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    {/* Dados Cadastrais */}
                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                                            📋 Dados Cadastrais
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="gym-cnpj" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    CNPJ
                                                </label>
                                                <input
                                                    type="text"
                                                    name="cnpj"
                                                    id="gym-cnpj"
                                                    value={gymFormData.cnpj}
                                                    onChange={handleGymInputChange}
                                                    placeholder="00.000.000/0000-00"
                                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="gym-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Endereço
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    id="gym-address"
                                                    value={gymFormData.address}
                                                    onChange={handleGymInputChange}
                                                    placeholder="Rua, Avenida, etc."
                                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label htmlFor="gym-address-number" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Número
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="addressNumber"
                                                        id="gym-address-number"
                                                        value={gymFormData.addressNumber}
                                                        onChange={handleGymInputChange}
                                                        placeholder="123"
                                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label htmlFor="gym-address-complement" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Complemento
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="addressComplement"
                                                        id="gym-address-complement"
                                                        value={gymFormData.addressComplement}
                                                        onChange={handleGymInputChange}
                                                        placeholder="Apto, Bloco, Sala, etc."
                                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="gym-neighborhood" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Bairro
                                                </label>
                                                <input
                                                    type="text"
                                                    name="neighborhood"
                                                    id="gym-neighborhood"
                                                    value={gymFormData.neighborhood}
                                                    onChange={handleGymInputChange}
                                                    placeholder="Nome do bairro"
                                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2">
                                                    <label htmlFor="gym-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Cidade
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        id="gym-city"
                                                        value={gymFormData.city}
                                                        onChange={handleGymInputChange}
                                                        placeholder="Nome da cidade"
                                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="gym-state" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Estado (UF)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        id="gym-state"
                                                        value={gymFormData.state}
                                                        onChange={handleGymInputChange}
                                                        placeholder="SP"
                                                        maxLength={2}
                                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="gym-zipcode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    CEP
                                                </label>
                                                <input
                                                    type="text"
                                                    name="zipCode"
                                                    id="gym-zipcode"
                                                    value={gymFormData.zipCode}
                                                    onChange={handleGymInputChange}
                                                    placeholder="00000-000"
                                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Button variant="secondary" onClick={handleGymCancel}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleGymSave}>
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {gym ? (
                                        <>
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Academia:</span>
                                                <p className="text-sm text-slate-900 dark:text-white">{gym.name || 'Não informado'}</p>
                                            </div>
                                            {gym.cnpj && (
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ:</span>
                                                    <p className="text-sm text-slate-900 dark:text-white">{gym.cnpj}</p>
                                                </div>
                                            )}
                                            {gym.contactPhone && (
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone:</span>
                                                    <p className="text-sm text-slate-900 dark:text-white">{gym.contactPhone}</p>
                                                </div>
                                            )}
                                            {(gym.address || gym.addressNumber || gym.neighborhood || gym.city || gym.state || gym.zipCode) && (
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço:</span>
                                                    <p className="text-sm text-slate-900 dark:text-white">
                                                        {[
                                                            gym.address,
                                                            gym.addressNumber && `nº ${gym.addressNumber}`,
                                                            gym.addressComplement,
                                                            gym.neighborhood,
                                                            gym.city,
                                                            gym.state,
                                                            gym.zipCode
                                                        ].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Nenhuma informação cadastrada. Clique em "Editar" para configurar.
                                        </p>
                                    )}
                                </div>
                            )}
                    </div>
                </Card>
            )}

            {/* Seção: Personalização do Sistema */}
            <Card>
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        🎨 Personalização do Sistema
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Personalize a aparência do sistema com suas cores e logo.
                    </p>

                    <div className="space-y-6">
                        {/* Upload de Logo */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Logo da Academia
                            </label>
                            <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex-shrink-0">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-24 h-24 object-contain border-2 border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                                <span className="text-xs text-slate-400">Sem logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                        >
                                            📤 {logoPreview ? 'Alterar Logo' : 'Enviar Logo'}
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            Formatos aceitos: PNG, JPG, SVG (máx. 2MB)
                                        </p>
                                    </div>
                                    {logoPreview && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRemoveLogo}
                                        >
                                            🗑️ Remover
                                        </Button>
                                    )}
                                </div>
                        </div>

                        {/* Cores Personalizadas */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                🎨 Cores do Sistema
                            </h3>
                            
                            {/* Cor Primária */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Cor Primária
                                </label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-16 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                                                setPrimaryColor(value);
                                            }
                                        }}
                                        className="flex-1 min-w-[120px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="#10b981"
                                        maxLength={7}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPrimaryColor('#10b981')}
                                    >
                                        🔄 Padrão
                                    </Button>
                                </div>
                            </div>

                            {/* Cor Secundária */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Cor Secundária
                                </label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="w-16 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                                                setSecondaryColor(value);
                                            }
                                        }}
                                        className="flex-1 min-w-[120px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="#059669"
                                        maxLength={7}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSecondaryColor('#059669')}
                                    >
                                        🔄 Padrão
                                    </Button>
                                </div>
                            </div>

                            {/* Cor de Destaque */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Cor de Destaque
                                </label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-16 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={accentColor}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                                                setAccentColor(value);
                                            }
                                        }}
                                        className="flex-1 min-w-[120px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="#34d399"
                                        maxLength={7}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setAccentColor('#34d399')}
                                    >
                                        🔄 Padrão
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                👁️ Preview
                            </h4>
                            <div className="space-y-2">
                                <div
                                    className="px-4 py-2 rounded text-white text-sm font-medium text-center"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Botão Primário
                                </div>
                                <div
                                    className="px-4 py-2 rounded text-white text-sm font-medium text-center"
                                    style={{ backgroundColor: secondaryColor }}
                                >
                                    Botão Secundário
                                </div>
                                <div
                                    className="px-4 py-2 rounded text-sm font-medium text-center border-2"
                                    style={{ 
                                        borderColor: accentColor,
                                        color: accentColor
                                    }}
                                >
                                    Destaque
                                </div>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-3 flex-wrap pt-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSaveBranding}
                                disabled={!brandingDirty}
                            >
                                💾 Salvar Personalização
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResetBranding}
                            >
                                🔄 Restaurar Padrão
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Seção: Integração com APIs de IA */}
            <Card>
                <div className="p-4 sm:p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            🤖 Integração com APIs de IA
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Configure seus acessos a modelos pagos ou gratuitos e defina facilmente o endpoint do provedor escolhido.
                        </p>
                    </div>

                    <div className="space-y-6">
                            {/* Status Atual */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Modo Atual</span>
                                        <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                                            {apiMode === 'paid' ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">API Paga</span>
                                            ) : (
                                                <span className="text-primary-600 dark:text-primary-400">API Gratuita</span>
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleActivateFreeApi}
                                    >
                                        Alternar para Gratuita
                                    </Button>
                                </div>
                            </div>

                            {/* Modo de Utilização */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Modo de Utilização
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setApiMode('free')}
                                        className={`rounded-lg border-2 px-4 py-4 text-left transition-all ${
                                            apiMode === 'free'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <span className="block font-semibold text-base mb-1">API Gratuita</span>
                                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                                            Ideal para testes e integrações com limites menores.
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApiMode('paid')}
                                        className={`rounded-lg border-2 px-4 py-4 text-left transition-all ${
                                            apiMode === 'paid'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <span className="block font-semibold text-base mb-1">API Paga</span>
                                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                                            Utilize modelos avançados com performance corporativa.
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Endpoint do Provedor */}
                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                        Endpoint do Provedor
                                    </label>
                                    <input
                                        type="url"
                                        value={providerLink}
                                        onChange={(event) => setProviderLink(event.target.value)}
                                        placeholder={DEFAULT_PROVIDER_LINK}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Use o link oficial do provedor escolhido. Padrão:{' '}
                                        <span className="font-medium text-primary-600 dark:text-primary-400">{DEFAULT_PROVIDER_LINK}</span>
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={!providerLink}
                                    onClick={handleOpenProviderLink}
                                >
                                    Abrir Página do Modelo
                                </Button>
                            </div>

                            {/* Chaves de API */}
                            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Chaves de API
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Chave para API Paga
                                        </label>
                                        <input
                                            type="text"
                                            value={paidApiKey}
                                            onChange={(event) => setPaidApiKey(event.target.value)}
                                            placeholder="Insira sua chave premium aqui"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Chave para API Gratuita
                                        </label>
                                        <input
                                            type="text"
                                            value={freeApiKey}
                                            onChange={(event) => setFreeApiKey(event.target.value)}
                                            placeholder="Insira a chave gratuita ou de testes"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleUseDefaultFreeKey}
                                            className="whitespace-nowrap"
                                        >
                                            Usar Demo
                                        </Button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Padrão:{' '}
                                            <span className="font-medium text-primary-600 dark:text-primary-400">{DEFAULT_FREE_API_KEY}</span>
                                        </p>
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Seção: IA Local Offline */}
            <Card>
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        🖥️ IA Local Offline
                    </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Use IA localmente sem depender de APIs externas. Requer Ollama instalado e rodando.
                        </p>
                        
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useLocalAI}
                                    onChange={(e) => {
                                        setUseLocalAIState(e.target.checked);
                                        setUseLocalAI(e.target.checked);
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Usar IA Local Offline (Ollama)
                                </span>
                            </label>
                            
                            {useLocalAI && (
                                <div className="ml-8 space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Quando habilitado, o app tentará usar IA Local primeiro. 
                                        Se não estiver disponível, fará fallback automático para a API externa.
                                    </p>
                                    
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            disabled={isTestingLocalAI}
                                            onClick={async () => {
                                                setIsTestingLocalAI(true);
                                                setLocalAITestResult(null);
                                                const result = await testLocalIA();
                                                setLocalAITestResult(result);
                                                setIsTestingLocalAI(false);
                                            }}
                                        >
                                            {isTestingLocalAI ? 'Testando...' : 'Testar IA Local'}
                                        </Button>
                                        
                                        {localAITestResult && (
                                            <span className={`text-sm ${localAITestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {localAITestResult.success ? '✓' : '✗'} {localAITestResult.message}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                        <p><strong>Para instalar:</strong></p>
                                        <p>Windows: Execute <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">local-server\install_model.ps1</code></p>
                                        <p>Linux/macOS: Execute <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">local-server/install_model.sh</code></p>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </Card>

            {/* Seção: Configuração do Servidor da Academia */}
            {(user.gymRole === 'admin' || user.gymRole === 'trainer' || user.gymRole === 'student') && (
                <Card>
                    <div className="p-4 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            🌐 Servidor da Academia
                        </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Configure a URL do servidor da academia para sincronização de dados e bloqueio de acesso.
                            </p>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                        URL do Servidor
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={gymServerUrl}
                                            onChange={(e) => setGymServerUrlState(e.target.value)}
                                            placeholder="http://192.168.1.100:3001"
                                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                        <Button
                                            onClick={async () => {
                                                if (!gymServerUrl.trim()) {
                                                    showError('Por favor, informe a URL do servidor');
                                                    return;
                                                }
                                                setIsCheckingServer(true);
                                                try {
                                                    configureGymServer(gymServerUrl.trim());
                                                    const isAvailable = await checkServerAvailability();
                                                    if (isAvailable) {
                                                        showSuccess('Servidor configurado e disponível!');
                                                    } else {
                                                        showError('Servidor configurado, mas não está disponível. Verifique a URL e se o servidor está rodando.');
                                                    }
                                                } catch (error: any) {
                                                    showError(error.message || 'Erro ao configurar servidor');
                                                } finally {
                                                    setIsCheckingServer(false);
                                                }
                                            }}
                                            variant="secondary"
                                            disabled={isCheckingServer || !gymServerUrl.trim()}
                                        >
                                            {isCheckingServer ? 'Verificando...' : 'Testar & Salvar'}
                                        </Button>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        Exemplo: http://192.168.1.100:3001 ou http://localhost:3001
                                    </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Botão de Salvar Configurações Gerais */}
            {isDirty && (
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                ⚠️ Há alterações não salvas nas configurações de API.
                            </span>
                            <Button
                                type="button"
                                onClick={handleSaveSettings}
                            >
                                💾 Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Seção de Excluir Conta */}
            <Card>
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        🗑️ Excluir Conta
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Ao excluir sua conta, todos os seus dados serão permanentemente removidos e não poderão ser recuperados.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Excluir minha conta
                    </Button>
                </div>
            </Card>

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                                Confirmar Exclusão de Conta
                            </h2>
                            <Alert type="error" title="Atenção" className="mb-4">
                                Esta ação é irreversível. Todos os seus dados serão permanentemente deletados, incluindo:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Seu perfil e informações pessoais</li>
                                    <li>Histórico de chat</li>
                                    <li>Planos de treino e refeições</li>
                                    <li>Histórico de peso</li>
                                    <li>Todos os outros dados associados à sua conta</li>
                                </ul>
                            </Alert>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1"
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setIsDeleting(true);
                                        try {
                                            const result = await deleteUserAccount();
                                            if (result.success) {
                                                showSuccess('Conta excluída com sucesso');
                                                // Redirecionar para login após 2 segundos
                                                setTimeout(() => {
                                                    window.location.hash = '#/login';
                                                    window.location.reload();
                                                }, 2000);
                                            } else {
                                                showError(result.error || 'Erro ao excluir conta');
                                                setIsDeleting(false);
                                            }
                                        } catch (error: any) {
                                            showError(error.message || 'Erro ao excluir conta');
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
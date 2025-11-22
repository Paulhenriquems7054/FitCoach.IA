
import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
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

const SettingsPage: React.FC = () => {
    const { themeSetting, setThemeSetting } = useTheme();
    const { user, toggleRole } = useUser();
    const { t, language, setLanguage } = useI18n();
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

            <Card>
                <div className="p-4 sm:p-6 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="pb-4 sm:pb-6">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{t('settings.appearance.title')}</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.appearance.description')}</p>
                        
                        <fieldset className="mt-3 sm:mt-4">
                            <legend className="sr-only">{t('settings.appearance.legend')}</legend>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                                <button onClick={() => setThemeSetting('light')} className={`flex-1 p-3 sm:p-4 rounded-lg border-2 transition-colors text-sm sm:text-base ${themeSetting === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                                    <SunIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.appearance.light')}</span>
                                </button>
                                <button onClick={() => setThemeSetting('dark')} className={`flex-1 p-3 sm:p-4 rounded-lg border-2 transition-colors text-sm sm:text-base ${themeSetting === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                                    <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.appearance.dark')}</span>
                                </button>
                                <button onClick={() => setThemeSetting('system')} className={`flex-1 p-3 sm:p-4 rounded-lg border-2 transition-colors text-sm sm:text-base ${themeSetting === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                                    <div className="w-6 h-6 mx-auto mb-2 text-slate-600 dark:text-slate-300 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.appearance.system')}</span>
                                </button>
                            </div>
                        </fieldset>
                    </div>

                    <div className="py-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.language.title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.language.description')}</p>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es')}
                            className="mt-4 block w-full max-w-xs pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                            <option value="pt">Português</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>

                    <div className="py-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.notifications.title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.notifications.description')}</p>
                        <Button onClick={handleNotifications} className="mt-4">{t('settings.notifications.button')}</Button>
                    </div>

                    <div className="py-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Integração com APIs de IA</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure seus acessos a modelos pagos ou gratuitos e defina facilmente o endpoint do provedor escolhido.
                        </p>

                        <div className="mt-6 space-y-6">
                            <fieldset className="space-y-4">
                                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Modo de utilização
                                </legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setApiMode('free')}
                                        className={`rounded-lg border px-4 py-4 text-left transition ${
                                            apiMode === 'free'
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-700'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        <span className="block font-semibold text-base">API Gratuita</span>
                                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                                            Ideal para testes e integrações com limites menores.
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApiMode('paid')}
                                        className={`rounded-lg border px-4 py-4 text-left transition ${
                                            apiMode === 'paid'
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        <span className="block font-semibold text-base">API Paga</span>
                                        <span className="block text-sm text-slate-500 dark:text-slate-400">
                                            Utilize modelos avançados com performance corporativa.
                                        </span>
                                    </button>
                                </div>
                            </fieldset>

                            <div className="space-y-2">
                                <label className="space-y-1 block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Página do modelo / endpoint do provedor
                                    </span>
                                    <input
                                        type="url"
                                        value={providerLink}
                                        onChange={(event) => setProviderLink(event.target.value)}
                                        placeholder={DEFAULT_PROVIDER_LINK}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Use o link oficial do provedor escolhido. Padrão de demonstração:{' '}
                                    <span className="font-medium text-primary-600 dark:text-primary-400">{DEFAULT_PROVIDER_LINK}</span>
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-1 block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        Chave para API Paga
                                    </span>
                                    <input
                                        type="text"
                                        value={paidApiKey}
                                        onChange={(event) => setPaidApiKey(event.target.value)}
                                        placeholder="Insira sua chave premium aqui"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>

                                <div className="space-y-2">
                                    <label className="space-y-1 block">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Chave para API Gratuita
                                        </span>
                                        <input
                                            type="text"
                                            value={freeApiKey}
                                            onChange={(event) => setFreeApiKey(event.target.value)}
                                            placeholder="Insira a chave gratuita ou de testes"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                        />
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                                            Padrão para demonstração:{' '}
                                            <span className="font-medium text-primary-600 dark:text-primary-400">{DEFAULT_FREE_API_KEY}</span>
                                        </span>
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleUseDefaultFreeKey}
                                    >
                                        Usar chave demo padrão
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Atualmente selecionado:{' '}
                                    <strong className="text-primary-600 dark:text-primary-400">
                                        {apiMode === 'paid' ? 'API Paga' : 'API Gratuita'}
                                    </strong>
                                </span>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={!providerLink}
                                    onClick={handleOpenProviderLink}
                                >
                                    Abrir Página Modelo IA
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleActivateFreeApi}
                                >
                                    Ativar API Gratuita
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Seção de IA Local Offline */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            IA Local Offline
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

                    {/* Configuração do Servidor da Academia */}
                    {(user.gymRole === 'admin' || user.gymRole === 'trainer' || user.gymRole === 'student') && (
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Servidor da Academia
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
                    )}

                     <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.profile_type.title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.profile_type.description')}</p>
                         <div className="mt-4">
                            <p className="text-sm">{t('settings.profile_type.current')}: <span className="font-semibold text-primary-600">{user.role === 'user' ? t('settings.profile_type.user') : t('settings.profile_type.professional')}</span></p>
                            <Button onClick={toggleRole} variant="secondary" className="mt-2">{t('settings.profile_type.button')}</Button>
                         </div>
                    </div>

                    <div className="pt-6 flex flex-wrap items-center justify-end gap-3">
                        {isDirty && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Há alterações não salvas.
                            </span>
                        )}
                        <Button
                            type="button"
                            disabled={!isDirty}
                            onClick={handleSaveSettings}
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
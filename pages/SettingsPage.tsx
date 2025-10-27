
import React from 'react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { useI18n } from '../context/I18nContext';
import { Button } from '../components/ui/Button';

const SettingsPage: React.FC = () => {
    const { themeSetting, setThemeSetting } = useTheme();
    const { user, toggleRole } = useUser();
    const { t, language, setLanguage } = useI18n();

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

    return (
        <div className="max-w-2xl mx-auto space-y-8">
             <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('settings.title')}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('settings.subtitle')}</p>
            </div>
            
            <Card>
                <div className="p-6 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="pb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.appearance.title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.appearance.description')}</p>
                        
                        <fieldset className="mt-4">
                            <legend className="sr-only">{t('settings.appearance.legend')}</legend>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setThemeSetting('light')} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${themeSetting === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                                    <SunIcon className="w-6 h-6 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.appearance.light')}</span>
                                </button>
                                <button onClick={() => setThemeSetting('dark')} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${themeSetting === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                                    <MoonIcon className="w-6 h-6 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.appearance.dark')}</span>
                                </button>
                                <button onClick={() => setThemeSetting('system')} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${themeSetting === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
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

                     <div className="pt-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('settings.profile_type.title')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.profile_type.description')}</p>
                         <div className="mt-4">
                            <p className="text-sm">{t('settings.profile_type.current')}: <span className="font-semibold text-primary-600">{user.role === 'user' ? t('settings.profile_type.user') : t('settings.profile_type.professional')}</span></p>
                            <Button onClick={toggleRole} variant="secondary" className="mt-2">{t('settings.profile_type.button')}</Button>
                         </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
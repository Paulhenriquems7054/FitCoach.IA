
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { useI18n } from '../context/I18nContext';

const mockAuditLogs = [
    { event: 'Login bem-sucedido', ip: '189.12.34.56', timestamp: '2023-10-27 10:30:15' },
    { event: 'Perfil atualizado', ip: '189.12.34.56', timestamp: '2023-10-27 09:15:00' },
    { event: 'Plano alimentar gerado', ip: '189.12.34.56', timestamp: '2023-10-26 18:05:21' },
];


const PrivacyPage: React.FC = () => {
    const { user, toggleAnonymization } = useUser();
    const { t } = useI18n();
    const [biometrics, setBiometrics] = useState(false);
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('privacy.title')}</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('privacy.subtitle')}</p>
            </div>
            
            <Card>
                <div className="p-6 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="py-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('privacy.anonymization.title')}</h2>
                        <div className="flex items-center justify-between mt-2">
                             <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{t('privacy.anonymization.description')}</p>
                             <button
                                type="button"
                                onClick={toggleAnonymization}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${user.isAnonymized ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                role="switch"
                                aria-checked={user.isAnonymized}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.isAnonymized ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>
                    </div>

                     <div className="py-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('privacy.biometrics.title')}</h2>
                        <div className="flex items-center justify-between mt-2">
                             <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{t('privacy.biometrics.description')}</p>
                             <button
                                type="button"
                                onClick={() => setBiometrics(!biometrics)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${biometrics ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                                role="switch"
                                aria-checked={biometrics}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${biometrics ? 'translate-x-5' : 'translate-x-0'}`}></span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="py-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('privacy.permissions.title')}</h2>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('privacy.permissions.description')}</p>
                         <Button variant="secondary" className="mt-3">{t('privacy.permissions.button')}</Button>
                    </div>

                </div>
            </Card>

             <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('privacy.audit.title')}</h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('privacy.audit.description')}</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-2">{t('privacy.audit.event')}</th>
                                    <th className="p-2">{t('privacy.audit.ip')}</th>
                                    <th className="p-2">{t('privacy.audit.timestamp')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockAuditLogs.map((log, i) => (
                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-2">{log.event}</td>
                                        <td className="p-2 font-mono text-xs">{log.ip}</td>
                                        <td className="p-2">{log.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

        </div>
    );
};

export default PrivacyPage;

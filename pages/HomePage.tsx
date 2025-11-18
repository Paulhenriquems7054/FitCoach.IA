
import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useUser } from '../context/UserContext';
import { Card } from '../components/ui/Card';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { getAICoachTip } from '../services/geminiService';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { useI18n } from '../context/I18nContext';

const QuickActionCard: React.FC<{ href: string; title: string; description: string; icon: React.ElementType }> = ({ href, title, description, icon: Icon }) => (
    <a href={href} className="block group">
        <Card className="h-full">
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg">
                         <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {title}
                        </h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                </div>
            </div>
        </Card>
    </a>
);


const HomePage: React.FC = () => {
  const { user } = useUser();
  const { t } = useI18n();
  const [coachTip, setCoachTip] = useState<string>('');
  const [showCheckin, setShowCheckin] = useState(false);

  useEffect(() => {
    getAICoachTip(user).then(setCoachTip);

    const checkLastCheckin = async () => {
      try {
        const lastCheckin = await getAppSetting<string>('lastWeightCheckin');
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (!lastCheckin || (new Date().getTime() - new Date(lastCheckin).getTime() > oneWeek)) {
          setShowCheckin(true);
        }
      } catch (error) {
        // Fallback para localStorage
        if (typeof window !== 'undefined') {
          const lastCheckin = localStorage.getItem('lastWeightCheckin');
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (!lastCheckin || (new Date().getTime() - new Date(lastCheckin).getTime() > oneWeek)) {
            setShowCheckin(true);
          }
        }
      }
    };

    checkLastCheckin();
  }, [user]);

  const handleCheckinDismiss = async () => {
    setShowCheckin(false);
    // Snooze for a day
    const snoozeDate = new Date(new Date().getTime() + (24*60*60*1000)).toISOString();
    try {
      await saveAppSetting('lastWeightCheckin', snoozeDate);
    } catch (error) {
      // Fallback para localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastWeightCheckin', snoozeDate);
      }
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('home.greeting', { name: user.isAnonymized ? t('anonymous_user') : user.nome })}</h1>
            <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400">{t('home.welcome_back')}</p>
        </div>

        {showCheckin && (
            <Alert type="info" title={t('home.checkin.title')}>
                <p className="text-sm sm:text-base">{t('home.checkin.description')}</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Button size="sm" onClick={() => window.location.hash = '/analysis'} className="w-full sm:w-auto">{t('home.checkin.button_log')}</Button>
                    <Button size="sm" variant="secondary" onClick={handleCheckinDismiss} className="w-full sm:w-auto">{t('home.checkin.button_later')}</Button>
                </div>
            </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
                <Dashboard summary={null} />
            </div>
            <div className="space-y-6">
                <Card>
                    <div className="p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-primary-500" />
                            {t('home.coach_tip.title')}
                        </h3>
                        {coachTip ? (
                             <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{coachTip}</p>
                        ) : (
                            <div className="mt-2 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
                        )}
                    </div>
                </Card>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t('home.smart_navigation.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <QuickActionCard 
                    href="#/generator"
                    title={t('home.smart_navigation.generator_title')}
                    description={t('home.smart_navigation.generator_desc')}
                    icon={SparklesIcon}
                />
                 <QuickActionCard 
                    href="#/biblioteca"
                    title={t('home.smart_navigation.library_title')}
                    description={t('home.smart_navigation.library_desc')}
                    icon={BookOpenIcon}
                />
                 <QuickActionCard 
                    href="#/desafios"
                    title={t('home.smart_navigation.challenges_title')}
                    description={t('home.smart_navigation.challenges_desc')}
                    icon={TrophyIcon}
                />
            </div>
        </div>
    </div>
  );
};

export default HomePage;


import React from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useUser } from '../../context/UserContext';
import { useI18n } from '../../context/I18nContext';
import { HomeIcon } from '../icons/HomeIcon';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { XIcon } from '../icons/XIcon';
import { CameraIcon } from '../icons/CameraIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { CogIcon } from '../icons/CogIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { WandIcon } from '../icons/WandIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { StarIcon } from '../icons/StarIcon';
import { PhotoIcon } from '../icons/PhotoIcon';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { path } = useRouter();
  const { user } = useUser();
  const { t } = useI18n();

  const mainNavigation = [
    { name: t('sidebar.home'), href: '#/', icon: HomeIcon },
    { name: t('sidebar.planGenerator'), href: '#/generator', icon: SparklesIcon },
    { name: t('sidebar.smartMeal'), href: '#/smart-meal', icon: WandIcon },
    { name: t('sidebar.plateAnalyzer'), href: '#/analyzer', icon: CameraIcon },
    { name: t('sidebar.imageEditor'), href: '#/image-editor', icon: PhotoIcon },
    { name: t('sidebar.aiChat'), href: '#/chat', icon: ChatBubbleIcon },
    { name: t('sidebar.progressAnalysis'), href: '#/analysis', icon: TrendingUpIcon },
    { name: t('sidebar.aiReports'), href: '#/reports', icon: ChartBarIcon },
    { name: t('sidebar.wellnessPlan'), href: '#/wellness', icon: HeartIcon },
    { name: t('sidebar.challenges'), href: '#/desafios', icon: TrophyIcon },
    { name: t('sidebar.library'), href: '#/biblioteca', icon: BookOpenIcon },
    { name: t('sidebar.community'), href: '#/comunidade', icon: UsersIcon },
  ];

  const userNavigation = [
      { name: t('sidebar.myProfile'), href: '#/perfil', icon: UserCircleIcon },
      { name: t('sidebar.privacy'), href: '#/privacy', icon: ShieldCheckIcon },
      { name: t('sidebar.settings'), href: '#/configuracoes', icon: CogIcon },
  ];

  const isCurrent = (href: string) => {
    const cleanHref = href.substring(2);
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (cleanHref === '' && (cleanPath === '' || cleanPath === '')) return true;
    return cleanHref !== '' && cleanPath.startsWith(cleanHref);
  }

  const NavContent = () => (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-2xl font-bold">
            <span className="text-primary-600">Nutri</span>
            <span className="text-slate-800 dark:text-slate-200">.IA</span>
          </h1>
        </div>
        <div className="mt-8 flex-1 flex flex-col justify-between">
            <nav className="px-2 space-y-1">
            {user.role === 'professional' && (
                <a
                    key="professional"
                    href="#/professional"
                    onClick={() => setOpen(false)}
                    className={classNames(
                        isCurrent('#/professional')
                        ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200'
                    )}
                >
                    <BriefcaseIcon className="mr-3 flex-shrink-0 h-6 w-6 text-slate-400 group-hover:text-slate-500" />
                    {t('sidebar.professionalDashboard')}
                </a>
            )}
            {mainNavigation.map((item) => (
                <a
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={classNames(
                    isCurrent(item.href)
                    ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200'
                )}
                >
                <item.icon
                    className={classNames(
                        isCurrent(item.href)
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400',
                    'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-200'
                    )}
                    aria-hidden="true"
                />
                {item.name}
                </a>
            ))}
            </nav>
            <nav className="px-2 space-y-1">
            {user.subscription === 'free' && (
                <a
                    href="#/premium"
                    onClick={() => setOpen(false)}
                    className="group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors duration-200 bg-amber-400/20 text-amber-800 dark:text-amber-300 hover:bg-amber-400/30"
                >
                    <StarIcon className="mr-3 flex-shrink-0 h-6 w-6 text-amber-500" />
                    {t('sidebar.bePremium')}
                </a>
            )}
            {userNavigation.map((item) => (
                <a
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={classNames(
                    isCurrent(item.href)
                    ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200'
                )}
                >
                <item.icon
                    className="mr-3 flex-shrink-0 h-6 w-6 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors duration-200"
                    aria-hidden="true"
                />
                {item.name}
                </a>
            ))}
            </nav>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${open ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setOpen(false)}
                >
                <span className="sr-only">Close sidebar</span>
                <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
            </div>
          <NavContent />
        </div>
        <div className="flex-shrink-0 w-14"></div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <NavContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;

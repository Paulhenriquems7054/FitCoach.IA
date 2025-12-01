
import React, { useEffect, useRef, useMemo } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useUser } from '../../context/UserContext';
import { useI18n } from '../../context/I18nContext';
import { usePermissions } from '../../hooks/usePermissions';
import { HomeIcon } from '../icons/HomeIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { XIcon } from '../icons/XIcon';
import { CameraIcon } from '../icons/CameraIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { CogIcon } from '../icons/CogIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { WandIcon } from '../icons/WandIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { KeyIcon } from '../icons/KeyIcon';

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
  const permissions = usePermissions();
  
  // Ref para o container de scroll - SEM lógica de preservação/restauração
  // O scroll deve funcionar de forma nativa sem interferências
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll do body quando sidebar está aberto
  useEffect(() => {
    if (open) {
      const body = document.body;
      const html = document.documentElement;
      
      // Salvar valores originais
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;
      
      // Bloquear scroll do body de forma mais suave
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      
      return () => {
        // Restaurar estilos
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [open]);

  // Verificar se é aluno
  const isStudent = user.gymRole === 'student';
  // Verificar se é administrador
  const isAdmin = user.gymRole === 'admin';

  // Áreas permitidas para alunos
  const studentAllowedRoutes = [
    '/',
    '/wellness',
    '/biblioteca',
    '/desafios',
    '/analysis',
    '/reports',
    '/generator',
    '/smart-meal',
    '/analyzer',
    '/perfil'
  ];

  // Rotas permitidas para administradores
  const adminAllowedRoutes = [
    '/',
    '/student-management'
  ];

  // Memoizar arrays de navegação para evitar re-renders desnecessários
  const mainNavigation = useMemo(() => [
    { name: t('sidebar.home'), href: '#/', icon: HomeIcon },
    { name: 'Meu Plano de Treino', href: '#/wellness', icon: HeartIcon },
    { name: 'Biblioteca de Exercícios', href: '#/biblioteca', icon: BookOpenIcon },
    { name: t('sidebar.challenges'), href: '#/desafios', icon: TrophyIcon },
    { name: t('sidebar.progressAnalysis'), href: '#/analysis', icon: TrendingUpIcon },
    { name: t('sidebar.aiReports'), href: '#/reports', icon: ChartBarIcon },
    { name: t('sidebar.planGenerator'), href: '#/generator', icon: SparklesIcon },
    { name: t('sidebar.smartMeal'), href: '#/smart-meal', icon: WandIcon },
    { name: t('sidebar.plateAnalyzer'), href: '#/analyzer', icon: CameraIcon },
    { name: 'Gerenciar Alunos', href: '#/student-management', icon: UsersIcon, show: permissions.canViewStudents },
  ]
    .filter(item => {
      // Se é administrador, mostrar apenas Dashboard
      if (isAdmin) {
        const route = item.href.replace(/#/g, '');
        return adminAllowedRoutes.includes(route);
      }
      // Se é aluno, mostrar apenas rotas permitidas
      if (isStudent) {
        const route = item.href.replace(/#/g, '');
        return studentAllowedRoutes.includes(route);
      }
      // Para trainer, mostrar todos exceto os que têm show: false
      return item.show !== false;
    }), [t, permissions.canViewStudents, isAdmin, isStudent]);

  const userNavigation = useMemo(() => [
      { name: 'Perfil', href: '#/perfil', icon: UserCircleIcon },
      { name: t('sidebar.privacy'), href: '#/privacy', icon: ShieldCheckIcon, show: isAdmin },
      { name: t('sidebar.settings'), href: '#/configuracoes', icon: CogIcon, show: isAdmin },
      { name: 'Gerenciar Permissões', href: '#/permissions', icon: KeyIcon, show: isAdmin },
  ].filter(item => item.show !== false), [t, isAdmin]);

  // Memoizar função isCurrent para evitar recriação a cada render
  const isCurrent = useMemo(() => (href: string) => {
    const cleanHref = href.substring(2);
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (cleanHref === '' && (cleanPath === '' || cleanPath === '')) return true;
    return cleanHref !== '' && cleanPath.startsWith(cleanHref);
  }, [path]);

  return (
    <>
      {/* Hidden sidebar overlay - works for all screen sizes */}
      {open && (
        <div 
          className="fixed inset-0 flex z-40"
          role="dialog" 
          aria-modal="true"
          aria-label="Menu de navegação"
          id="sidebar-navigation"
        >
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            aria-hidden="true" 
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          ></div>
          <div 
            className="relative flex-1 flex flex-col max-w-xs sm:max-w-sm w-full bg-white dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              height: '100vh',
              maxHeight: '100vh',
              touchAction: 'pan-y'
            }}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2 z-50">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu de navegação"
              >
                <span className="sr-only">Fechar menu</span>
                <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            {/* Container principal da sidebar - SCROLL NATIVO SEM INTERFERÊNCIAS */}
            <div 
              className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" 
              style={{ 
                height: '100vh', 
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header fixo */}
              <div 
                className="flex items-center px-4 py-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0"
                style={{ 
                  height: '80px',
                  zIndex: 10
                }}
              >
                <h1 className="text-2xl font-bold">
                  <span className="text-primary-600">FitCoach</span>
                  <span className="text-slate-800 dark:text-slate-200">.IA</span>
                </h1>
              </div>
              
              {/* Container de scroll - SCROLL NATIVO SEM INTERFERÊNCIAS */}
              {/* IMPORTANTE: Nenhuma lógica JavaScript interfere no scroll - apenas CSS nativo */}
              <div 
                ref={scrollContainerRef}
                className="overflow-y-auto flex-1"
                style={{ 
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(148, 163, 184, 0.5) transparent'
                }}
              >
                <div style={{ padding: '1rem 0.75rem 1.5rem' }}>
                  <nav className="space-y-3 mb-4" aria-label="Navegação principal">
                    {mainNavigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpen(false);
                            window.location.hash = item.href;
                          }
                        }}
                        className={classNames(
                          isCurrent(item.href)
                            ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                        )}
                        aria-current={isCurrent(item.href) ? 'page' : undefined}
                        role="menuitem"
                        tabIndex={0}
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
                        <span className="flex-1 text-left leading-snug">{item.name}</span>
                      </a>
                    ))}
                  </nav>
                  <nav className="space-y-3" aria-label="Navegação do usuário">
                    {userNavigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpen(false);
                            window.location.hash = item.href;
                          }
                        }}
                        className={classNames(
                          isCurrent(item.href)
                            ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                        )}
                        aria-current={isCurrent(item.href) ? 'page' : undefined}
                        role="menuitem"
                        tabIndex={0}
                      >
                        <item.icon
                          className="mr-3 flex-shrink-0 h-6 w-6 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 transition-colors duration-200"
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-left leading-snug">{item.name}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

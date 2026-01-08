import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { useToast } from '../components/ui/Toast';
import type { Challenge, Achievement } from '../types';

const challenges: Challenge[] = [
    { id: 'daily_water', type: 'daily', title: 'Beba 2L de Água', description: 'Mantenha-se hidratado ao longo do dia.', points: 10 },
    { id: 'daily_fruit', type: 'daily', title: 'Coma uma Fruta', description: 'Adicione uma porção de fruta à sua dieta.', points: 5 },
    { id: 'daily_walk', type: 'daily', title: 'Caminhada de 15 min', description: 'Faça uma pequena caminhada para se movimentar.', points: 15 },
    { id: 'weekly_veggie', type: 'weekly', title: 'Experimente um Novo Vegetal', description: 'Descubra um novo sabor e nutriente esta semana.', points: 30 },
    { id: 'weekly_mealprep', type: 'weekly', title: 'Planeje 3 Refeições', description: 'Organize suas refeições para a semana.', points: 50 },
];

const achievements: Achievement[] = [
    { id: 'first_points', title: 'Iniciante Engajado', description: 'Ganhe seus primeiros pontos.', check: (user) => user.points > 0 },
    { id: 'first_plan', title: 'Planejador', description: 'Gere seu primeiro plano alimentar.', check: (user) => user.points >= 10 }, // Assuming plan gives 10
    { id: 'score_85', title: 'Consistente', description: 'Alcance um Score de Disciplina de 85.', check: (user) => user.disciplineScore >= 85 },
    { id: 'points_100', title: 'Centurião', description: 'Acumule 100 pontos.', check: (user) => user.points >= 100 },
    { id: 'first_challenge', title: 'Desafiante', description: 'Complete seu primeiro desafio.', check: (user) => user.completedChallengeIds.length > 0 },
    { id: 'master_chef', title: 'Mestre Cuca', description: 'Busque sua primeira receita.', check: (user) => user.points >= 10 }, // Needs specific trigger
];

const ChallengesPage: React.FC = () => {
    const { user, completeChallenge } = useUser();
    const { showSuccess } = useToast();
    const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
    const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(new Set());

    // Verificar desafios completados hoje e esta semana
    const today = useMemo(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }, []);

    const weekStart = useMemo(() => {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().split('T')[0];
    }, []);

    // Carregar desafios completados do localStorage
    useEffect(() => {
        const dailyKey = `challenges_daily_${today}`;
        const weeklyKey = `challenges_weekly_${weekStart}`;
        
        const dailyCompleted = localStorage.getItem(dailyKey);
        const weeklyCompleted = localStorage.getItem(weeklyKey);
        
        if (dailyCompleted) {
            setCompletedToday(new Set(JSON.parse(dailyCompleted)));
        }
        if (weeklyCompleted) {
            setCompletedThisWeek(new Set(JSON.parse(weeklyCompleted)));
        }
    }, [today, weekStart]);

    const handleCompleteChallenge = (challenge: Challenge) => {
        const isDaily = challenge.type === 'daily';
        const completedSet = isDaily ? completedToday : completedThisWeek;
        
        // Verificar se já foi completado hoje/esta semana
        if (completedSet.has(challenge.id)) {
            return;
        }

        // Completar desafio
        completeChallenge(challenge.id, challenge.points);
        
        // Atualizar estado local
        const newCompleted = new Set(completedSet);
        newCompleted.add(challenge.id);
        
        if (isDaily) {
            setCompletedToday(newCompleted);
            localStorage.setItem(`challenges_daily_${today}`, JSON.stringify(Array.from(newCompleted)));
        } else {
            setCompletedThisWeek(newCompleted);
            localStorage.setItem(`challenges_weekly_${weekStart}`, JSON.stringify(Array.from(newCompleted)));
        }

        // Mostrar feedback
        showSuccess(`🎉 Desafio completo! Você ganhou ${challenge.points} pontos!`);
    };

    const isChallengeCompleted = (challenge: Challenge): boolean => {
        if (challenge.type === 'daily') {
            return completedToday.has(challenge.id);
        } else {
            return completedThisWeek.has(challenge.id);
        }
    };

    const dailyChallenges = challenges.filter(c => c.type === 'daily');
    const weeklyChallenges = challenges.filter(c => c.type === 'weekly');

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
            <div className="text-center">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Desafios e Conquistas</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Construa hábitos saudáveis, ganhe pontos e desbloqueie conquistas.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <section>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Desafios Diários</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {dailyChallenges.map(challenge => {
                            const isCompleted = isChallengeCompleted(challenge);
                            return (
                                <Card key={challenge.id} className={`transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : ''}`}>
                                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm sm:text-base">{challenge.title}</h3>
                                                {isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{challenge.description}</p>
                                            <p className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">+{challenge.points} Pontos</p>
                                            {isCompleted && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">✓ Completo hoje</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleCompleteChallenge(challenge)}
                                            disabled={isCompleted}
                                            className={`w-full sm:w-auto ml-0 sm:ml-4 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                                                isCompleted 
                                                    ? 'bg-green-600 text-white cursor-not-allowed' 
                                                    : 'bg-primary-500 text-white hover:bg-primary-600'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span className="hidden sm:inline">Completo</span>
                                                </>
                                            ) : (
                                                'Completar'
                                            )}
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>
                <section>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Desafios Semanais</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {weeklyChallenges.map(challenge => {
                             const isCompleted = isChallengeCompleted(challenge);
                             return (
                                <Card key={challenge.id} className={`transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' : ''}`}>
                                     <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                         <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <h3 className="font-semibold text-sm sm:text-base">{challenge.title}</h3>
                                                 {isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                                             </div>
                                             <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{challenge.description}</p>
                                              <p className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">+{challenge.points} Pontos</p>
                                              {isCompleted && (
                                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">✓ Completo esta semana</p>
                                              )}
                                         </div>
                                         <button
                                             onClick={() => handleCompleteChallenge(challenge)}
                                             disabled={isCompleted}
                                             className={`w-full sm:w-auto ml-0 sm:ml-4 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                                                 isCompleted 
                                                     ? 'bg-green-600 text-white cursor-not-allowed' 
                                                     : 'bg-primary-500 text-white hover:bg-primary-600'
                                             }`}
                                         >
                                             {isCompleted ? (
                                                 <>
                                                     <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                     <span className="hidden sm:inline">Completo</span>
                                                 </>
                                             ) : (
                                                 'Completar'
                                             )}
                                         </button>
                                     </div>
                                 </Card>
                             );
                        })}
                    </div>
                </section>
            </div>

            <section>
                 <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Conquistas</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                     {achievements.map(achieve => {
                         const isUnlocked = achieve.check(user);
                         
                         // Calcular progresso para algumas conquistas
                         let progressText = '';
                         if (!isUnlocked) {
                             if (achieve.id === 'first_points') {
                                 progressText = 'Ganhe 1 ponto';
                             } else if (achieve.id === 'first_plan') {
                                 const progress = Math.min(100, Math.round((user.points / 10) * 100));
                                 progressText = `${progress}% (${user.points}/10 pontos)`;
                             } else if (achieve.id === 'score_85') {
                                 const progress = Math.min(100, Math.round((user.disciplineScore / 85) * 100));
                                 progressText = `${progress}% (Score: ${user.disciplineScore}/85)`;
                             } else if (achieve.id === 'points_100') {
                                 const progress = Math.min(100, user.points);
                                 progressText = `${progress}% (${user.points}/100 pontos)`;
                             } else if (achieve.id === 'first_challenge') {
                                 progressText = user.completedChallengeIds.length > 0 ? 'Complete 1 desafio' : 'Complete 1 desafio';
                             }
                         }
                         
                         return (
                            <Card key={achieve.id} className={`text-center p-3 sm:p-4 transition-all relative ${isUnlocked ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'opacity-75 hover:opacity-100'}`}>
                                {isUnlocked && (
                                    <div className="absolute top-1 right-1">
                                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">✓</span>
                                    </div>
                                )}
                                <div className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 ${isUnlocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    {isUnlocked ? (
                                        <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                                    ) : (
                                        <LockClosedIcon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                                    )}
                                </div>
                                <h3 className="font-semibold text-xs sm:text-sm mb-1">{achieve.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{achieve.description}</p>
                                {progressText && !isUnlocked && (
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-1">{progressText}</p>
                                )}
                                {isUnlocked && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">Desbloqueada! 🎉</p>
                                )}
                            </Card>
                         );
                     })}
                 </div>
            </section>
        </div>
    );
};

export default ChallengesPage;
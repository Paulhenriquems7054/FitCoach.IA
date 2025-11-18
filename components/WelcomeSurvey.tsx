/**
 * Enquete de Boas-Vindas - Nutri.IA
 * 
 * Estrutura completa conforme especificação:
 * 1. Dados Físicos (sexo, idade, altura, peso)
 * 2. Objetivo Principal
 * 3. Nível de Atividade
 * 4. Restrições e Preferências Alimentares
 * 5. Rotina e Hábitos
 * 6. Treino
 * 7. Suplementação
 * 8. Metas
 */

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { logger } from '../utils/logger';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';

type QuestionType = 'text' | 'number' | 'choice' | 'choice-multiple' | 'choice-other' | 'time-list';

interface BaseQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  section: string;
  purpose?: string; // Propósito da pergunta para documentação
}

interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
}

interface NumberQuestion extends BaseQuestion {
  type: 'number';
  min?: number;
  max?: number;
  unit?: string; // Ex: 'cm', 'kg'
}

interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  options: string[];
}

interface ChoiceMultipleQuestion extends BaseQuestion {
  type: 'choice-multiple';
  options: string[];
}

interface ChoiceOtherQuestion extends BaseQuestion {
  type: 'choice-other';
  options: string[];
  otherLabel: string;
}

interface TimeListQuestion extends BaseQuestion {
  type: 'time-list';
  maxItems?: number;
}

type Question =
  | TextQuestion
  | NumberQuestion
  | ChoiceQuestion
  | ChoiceMultipleQuestion
  | ChoiceOtherQuestion
  | TimeListQuestion;

type AnswerValue =
  | string
  | number
  | string[]
  | { option: string; other: string }
  | { times: string[] }
  | null;

const SURVEY_VERSION = 'v2'; // Atualizado para v2 com nova estrutura
const LEGACY_STORAGE_KEYS = ['nutriIA_enquete', 'enqueteRespondida', 'nutriIA_enquete_v1'];
const STORAGE_KEY = `nutriIA_enquete_${SURVEY_VERSION}`;
const STORAGE_FLAG = `nutriIA_enquete_${SURVEY_VERSION}_done`;

// Estrutura completa da enquete conforme especificação
const questions: Question[] = [
  // ============================================
  // 1. DADOS FÍSICOS
  // ============================================
  {
    id: 'sexo',
    prompt: 'Qual seu sexo?',
    type: 'choice',
    section: 'Dados Físicos',
    purpose: 'Cálculos nutricionais e TMB',
    options: [
      'Masculino',
      'Feminino',
      'Prefiro não informar',
    ],
  },
  {
    id: 'idade',
    prompt: 'Qual sua idade?',
    type: 'number',
    section: 'Dados Físicos',
    purpose: 'Fórmulas de gasto calórico',
    min: 1,
    max: 120,
  },
  {
    id: 'altura',
    prompt: 'Qual sua altura (cm)?',
    type: 'number',
    section: 'Dados Físicos',
    min: 50,
    max: 250,
    unit: 'cm',
  },
  {
    id: 'peso',
    prompt: 'Qual seu peso atual (kg)?',
    type: 'number',
    section: 'Dados Físicos',
    min: 20,
    max: 300,
    unit: 'kg',
  },

  // ============================================
  // 2. OBJETIVO PRINCIPAL
  // ============================================
  {
    id: 'objetivo',
    prompt: 'Qual seu objetivo atual?',
    type: 'choice',
    section: 'Objetivo Principal',
    purpose: 'Direcionamento de calorias/macros',
    options: [
      'Perder peso',
      'Ganhar massa muscular',
      'Manter peso',
      'Melhorar saúde geral',
    ],
  },

  // ============================================
  // 3. NÍVEL DE ATIVIDADE
  // ============================================
  {
    id: 'atividade',
    prompt: 'Qual seu nível de atividade diária?',
    type: 'choice',
    section: 'Nível de Atividade',
    purpose: 'Cálculo do fator de atividade',
    options: [
      'Sedentário',
      'Leve',
      'Moderado',
      'Intenso',
      'Atleta',
    ],
  },

  // ============================================
  // 4. RESTRIÇÕES E PREFERÊNCIAS ALIMENTARES
  // ============================================
  {
    id: 'restricoes',
    prompt: 'Você tem alguma restrição alimentar?',
    type: 'choice-multiple',
    section: 'Restrições e Preferências',
    purpose: 'Personalização de planos alimentares',
    options: [
      'Nenhuma',
      'Lactose',
      'Glúten',
      'Vegano',
      'Vegetariano',
      'Diabético',
      'Hipertenso',
      'Outras',
    ],
  },
  {
    id: 'restricoes_outras',
    prompt: 'Descreva outras restrições (se selecionou "Outras"):',
    type: 'text',
    section: 'Restrições e Preferências',
    placeholder: 'Ex: Alergia a frutos do mar, intolerância a frutose...',
  },
  {
    id: 'nao_gosta',
    prompt: 'Alimentos que você NÃO gosta:',
    type: 'text',
    section: 'Restrições e Preferências',
    placeholder: 'Ex: Brócolis, peixe, ovos...',
  },
  {
    id: 'prefere',
    prompt: 'Alimentos que você prefere comer:',
    type: 'text',
    section: 'Restrições e Preferências',
    placeholder: 'Ex: Frango, arroz, batata doce...',
  },

  // ============================================
  // 5. ROTINA E HÁBITOS
  // ============================================
  {
    id: 'refeicoes_dia',
    prompt: 'Quantas refeições você faz por dia?',
    type: 'choice',
    section: 'Rotina e Hábitos',
    options: [
      '2',
      '3',
      '4',
      '5+',
    ],
  },
  {
    id: 'horarios_refeicoes',
    prompt: 'Horários aproximados das refeições:',
    type: 'time-list',
    section: 'Rotina e Hábitos',
    maxItems: 6,
  },
  {
    id: 'cozinha',
    prompt: 'Você costuma cozinhar ou prefere opções prontas?',
    type: 'choice',
    section: 'Rotina e Hábitos',
    options: [
      'Cozinho',
      'Não cozinho',
      'Meio-termo',
    ],
  },

  // ============================================
  // 6. TREINO
  // ============================================
  {
    id: 'treina',
    prompt: 'Você treina?',
    type: 'choice',
    section: 'Treino',
    options: [
      'Sim',
      'Não',
    ],
  },
  {
    id: 'frequencia_treino',
    prompt: 'Se sim, quantas vezes por semana?',
    type: 'number',
    section: 'Treino',
    min: 0,
    max: 7,
    unit: 'vezes/semana',
  },
  {
    id: 'nivel_treino',
    prompt: 'Nível de treino:',
    type: 'choice',
    section: 'Treino',
    options: [
      'Iniciante',
      'Intermediário',
      'Avançado',
    ],
  },

  // ============================================
  // 7. SUPLEMENTAÇÃO
  // ============================================
  {
    id: 'usa_suplementos',
    prompt: 'Você usa suplementos?',
    type: 'choice',
    section: 'Suplementação',
    options: [
      'Sim',
      'Não',
    ],
  },
  {
    id: 'quais_suplementos',
    prompt: 'Se sim, quais?',
    type: 'text',
    section: 'Suplementação',
    placeholder: 'Ex: Whey protein, creatina, multivitamínico...',
  },

  // ============================================
  // 8. METAS
  // ============================================
  {
    id: 'meta_peso',
    prompt: 'Qual é sua meta de peso?',
    type: 'number',
    section: 'Metas',
    min: 20,
    max: 300,
    unit: 'kg',
  },
  {
    id: 'prazo_meta',
    prompt: 'Prazo desejado para atingir a meta:',
    type: 'choice',
    section: 'Metas',
    options: [
      '4 semanas',
      '8 semanas',
      '12 semanas',
      'Sem prazo definido',
    ],
  },
];

// Agrupar perguntas por seção para exibição
const sections = questions.reduce<Record<string, Question[]>>((acc, question) => {
  if (!acc[question.section]) {
    acc[question.section] = [];
  }
  acc[question.section].push(question);
  return acc;
}, {});

const baseAnswers = questions.reduce<Record<string, AnswerValue>>((acc, question) => {
  if (question.type === 'number') {
    acc[question.id] = null;
  } else if (question.type === 'choice-multiple') {
    acc[question.id] = [];
  } else if (question.type === 'time-list') {
    acc[question.id] = { times: [] };
  } else {
    acc[question.id] = null;
  }
  return acc;
}, {});

type WelcomeSurveyProps = {
  showCompletedMessage?: boolean;
  onCompleted?: () => void;
};

const WelcomeSurvey: React.FC<WelcomeSurveyProps> = ({ showCompletedMessage = true, onCompleted }) => {
  const { setUser } = useUser();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(baseAnswers);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    try {
      // Limpar versões antigas
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      const hasAnswered = localStorage.getItem(STORAGE_FLAG);
      setShowSurvey(!hasAnswered);
    } catch (error) {
      logger.warn('Não foi possível acessar o localStorage', 'WelcomeSurvey', error);
      setShowSurvey(true);
    }
  }, []);

  // Lógica condicional: algumas perguntas só aparecem se outras foram respondidas
  const shouldShowQuestion = (question: Question): boolean => {
    // Se não treina, não precisa perguntar frequência e nível
    if (question.id === 'frequencia_treino' || question.id === 'nivel_treino') {
      return answers.treina === 'Sim';
    }
    
    // Se não usa suplementos, não precisa perguntar quais
    if (question.id === 'quais_suplementos') {
      return answers.usa_suplementos === 'Sim';
    }
    
    // Se não selecionou "Outras" em restrições, não precisa descrever
    if (question.id === 'restricoes_outras') {
      const restricoes = answers.restricoes as string[] || [];
      return restricoes.includes('Outras');
    }
    
    return true;
  };

  // Filtrar perguntas visíveis
  const visibleQuestions = useMemo(() => {
    return questions.filter(q => shouldShowQuestion(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.treina, answers.usa_suplementos, answers.restricoes]);

  // Ajustar step quando perguntas visíveis mudam
  useEffect(() => {
    if (step >= visibleQuestions.length && visibleQuestions.length > 0) {
      setStep(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, step]);

  // Encontrar a pergunta atual considerando apenas as visíveis
  const currentQuestion = useMemo(() => {
    if (visibleQuestions.length === 0) return questions[0];
    const validStep = Math.min(step, visibleQuestions.length - 1);
    return visibleQuestions[validStep] || visibleQuestions[0];
  }, [step, visibleQuestions]);

  const currentSection = useMemo(() => {
    const sectionQuestions = (sections[currentQuestion.section] || []).filter(q => shouldShowQuestion(q));
    const sectionIndex = sectionQuestions.findIndex(q => q.id === currentQuestion.id);
    return {
      name: currentQuestion.section,
      current: sectionIndex + 1,
      total: sectionQuestions.length,
    };
  }, [currentQuestion, answers]);

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNumberChange = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleChoiceSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleChoiceMultipleToggle = (value: string) => {
    setAnswers((prev) => {
      const current = (prev[currentQuestion.id] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [currentQuestion.id]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [currentQuestion.id]: [...current, value] };
      }
    });
  };

  const handleChoiceOther = (value: string, other: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { option: value, other },
    }));
  };

  const handleTimeListAdd = (time: string) => {
    setAnswers((prev) => {
      const current = (prev[currentQuestion.id] as { times: string[] }) || { times: [] };
      if (!current.times.includes(time) && time.trim()) {
        return { ...prev, [currentQuestion.id]: { times: [...current.times, time.trim()] } };
      }
      return prev;
    });
  };

  const handleTimeListRemove = (time: string) => {
    setAnswers((prev) => {
      const current = (prev[currentQuestion.id] as { times: string[] }) || { times: [] };
      return { ...prev, [currentQuestion.id]: { times: current.times.filter(t => t !== time) } };
    });
  };

  const getAnswerForQuestion = (question: Question) => answers[question.id];

  const canProceed = () => {
    if (!shouldShowQuestion(currentQuestion)) {
      return true; // Pode prosseguir se a pergunta não deve ser mostrada
    }

    const value = answers[currentQuestion.id];
    if (value === null || value === undefined) return false;

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      const numQuestion = currentQuestion as NumberQuestion;
      if (numQuestion.min !== undefined && value < numQuestion.min) return false;
      if (numQuestion.max !== undefined && value > numQuestion.max) return false;
      return true;
    }

    if (Array.isArray(value)) {
      // Para múltipla escolha, pelo menos uma opção deve estar selecionada
      return value.length > 0;
    }

    if (value && typeof value === 'object') {
      if ('times' in value) {
        // Para lista de horários, pelo menos um horário deve estar preenchido
        return (value as { times: string[] }).times.length > 0;
      }
      if ('option' in value) {
        // Para choice-other
        if (currentQuestion.type === 'choice-other') {
          const choiceOther = value as { option: string; other: string };
          if (choiceOther.option === (currentQuestion as ChoiceOtherQuestion).otherLabel) {
            return Boolean(choiceOther.other?.trim());
          }
        }
        return Boolean((value as { option: string }).option);
      }
    }

    return false;
  };

  const goNext = () => {
    if (!canProceed() && shouldShowQuestion(currentQuestion)) return;
    
    if (step >= visibleQuestions.length - 1) {
      finalizeSurvey();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const finalizeSurvey = () => {
    // Limpar respostas condicionais não aplicáveis
    const cleanedAnswers: Record<string, AnswerValue> = { ...answers };
    
    if (answers.treina !== 'Sim') {
      cleanedAnswers.frequencia_treino = null;
      cleanedAnswers.nivel_treino = null;
    }
    
    if (answers.usa_suplementos !== 'Sim') {
      cleanedAnswers.quais_suplementos = null;
    }
    
    const restricoes = (answers.restricoes as string[]) || [];
    if (!restricoes.includes('Outras')) {
      cleanedAnswers.restricoes_outras = null;
    }

    const payload = {
      ...cleanedAnswers,
      completedAt: new Date().toISOString(),
      surveyVersion: SURVEY_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(STORAGE_FLAG, 'true');
      logger.info('Enquete salva com sucesso', 'WelcomeSurvey');
    } catch (error) {
      logger.error('Não foi possível salvar as respostas da enquete', 'WelcomeSurvey', error);
    }

    // Converter respostas da enquete para o formato do User
    try {
      const genero = (answers.sexo as string) || 'Masculino';
      const generoNormalized = genero === 'Prefiro não informar' ? 'Masculino' : genero;
      
      // Mapear objetivo
      let objetivo: Goal = Goal.MANTER_PESO;
      const objetivoStr = (answers.objetivo as string) || '';
      if (objetivoStr.includes('Perder peso')) {
        objetivo = Goal.PERDER_PESO;
      } else if (objetivoStr.includes('Ganhar massa')) {
        objetivo = Goal.GANHAR_MASSA;
      } else if (objetivoStr.includes('Manter peso')) {
        objetivo = Goal.MANTER_PESO;
      }

      // Atualizar perfil do usuário com dados da enquete
      setUser(prevUser => ({
        ...prevUser,
        idade: (answers.idade as number) || prevUser.idade,
        genero: generoNormalized as 'Masculino' | 'Feminino',
        altura: (answers.altura as number) || prevUser.altura,
        peso: (answers.peso as number) || prevUser.peso,
        objetivo: objetivo,
      }));

      logger.info('Perfil do usuário atualizado com dados da enquete', 'WelcomeSurvey');
    } catch (error) {
      logger.error('Erro ao atualizar perfil do usuário', 'WelcomeSurvey', error);
    }

    logger.info('Respostas da Enquete Nutri.IA', 'WelcomeSurvey', payload);
    setShowSummary(true);
  };

  const handleFinishSummary = () => {
    setShowSurvey(false);
    setShowSummary(false);
    setTimeout(() => {
      onCompleted?.();
    }, 100);
  };

  // Redirecionar automaticamente se a enquete já foi respondida
  useEffect(() => {
    if (!showSurvey && onCompleted) {
      const timer = setTimeout(() => {
        onCompleted();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSurvey, onCompleted]);

  if (!showSurvey) {
    if (!showCompletedMessage) {
      return null;
    }
    let savedData: any = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        savedData = JSON.parse(stored);
      }
    } catch (_) {
      savedData = null;
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center px-6 py-16 bg-white dark:bg-slate-900/60 rounded-2xl shadow-lg border border-emerald-50 dark:border-emerald-500/10">
        <h1 className="text-3xl font-bold text-emerald-600">
          Enquete já respondida
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Obrigado! Você já personalizou sua experiência.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Caso queira atualizar suas respostas posteriormente, limpe os dados do aplicativo no navegador.
        </p>
        {onCompleted && (
          <button
            type="button"
            onClick={() => onCompleted()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-xl"
          >
            Continuar
          </button>
        )}
      </div>
    );
  }

  if (!mounted || !showSurvey) {
    return null;
  }

  const totalQuestions = visibleQuestions.length;
  const currentQuestionNumber = step + 1;

  const surveyContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl border border-emerald-100 dark:border-slate-700 my-auto max-h-[98vh] sm:max-h-[95vh] flex flex-col">
        <div className="h-2 bg-emerald-100 dark:bg-slate-700 flex-shrink-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{
              width: `${
                ((showSummary ? totalQuestions : currentQuestionNumber) / totalQuestions) * 100
              }%`,
            }}
          />
        </div>

        <div className="px-4 sm:px-6 pt-4 sm:pt-6 text-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            👋 Bem-vindo ao Nutri.IA
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Responda as perguntas para personalizarmos sua experiência!
          </p>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {currentSection.name} ({currentSection.current}/{currentSection.total})
          </div>
        </div>

        {!showSummary ? (
          <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6 transition-all duration-300 overflow-y-auto flex-1">
            <div className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">
              Pergunta {currentQuestionNumber}/{totalQuestions}
            </div>

            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center">
              {currentQuestion.prompt}
            </h3>

            {currentQuestion.type === 'text' && (
              <input
                type="text"
                placeholder={(currentQuestion as TextQuestion).placeholder}
                value={(getAnswerForQuestion(currentQuestion) as string) || ''}
                onChange={(event) => handleTextChange(event.target.value)}
                className="w-full rounded-xl border border-emerald-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition"
              />
            )}

            {currentQuestion.type === 'number' && (
              <NumberQuestionContent
                question={currentQuestion as NumberQuestion}
                value={(answers[currentQuestion.id] as number) ?? null}
                onChange={(value) => handleNumberChange(value)}
              />
            )}

            {currentQuestion.type === 'choice' && (
              <div className="grid gap-3">
                {(currentQuestion as ChoiceQuestion).options.map((option) => {
                  const selected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChoiceSelect(option)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
                          : 'border-emerald-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span>{option}</span>
                      <span
                        className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-emerald-200 dark:border-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'choice-multiple' && (
              <div className="grid gap-3">
                {(currentQuestion as ChoiceMultipleQuestion).options.map((option) => {
                  const selected = ((answers[currentQuestion.id] as string[]) || []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChoiceMultipleToggle(option)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
                          : 'border-emerald-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span>{option}</span>
                      <span
                        className={`ml-3 h-4 w-4 rounded border-2 transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-emerald-200 dark:border-slate-500'
                        }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'choice-other' && (
              <ChoiceOther
                question={currentQuestion as ChoiceOtherQuestion}
                currentValue={answers[currentQuestion.id]}
                onSelect={(value, other) => handleChoiceOther(value, other ?? '')}
              />
            )}

            {currentQuestion.type === 'time-list' && (
              <TimeListQuestionContent
                question={currentQuestion as TimeListQuestion}
                value={(answers[currentQuestion.id] as { times: string[] }) || { times: [] }}
                onAdd={handleTimeListAdd}
                onRemove={handleTimeListRemove}
              />
            )}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-6 sm:py-10 text-center space-y-4 sm:space-y-6 transition-all duration-300 flex-1">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              Tudo pronto!
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Com base nas suas respostas, o Nutri.IA vai montar recomendações personalizadas para você.
            </p>
            <button
              type="button"
              onClick={handleFinishSummary}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-xl"
            >
              Ver meu plano inicial
            </button>
          </div>
        )}

        {!showSummary && (
          <div className="flex items-center justify-between px-4 sm:px-6 pb-4 sm:pb-6 gap-2 flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="text-xs sm:text-sm font-semibold text-emerald-500 dark:text-emerald-400 transition disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed px-2 sm:px-0"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed() && shouldShowQuestion(currentQuestion)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg disabled:bg-emerald-200 dark:disabled:bg-emerald-800 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {step >= visibleQuestions.length - 1 ? 'Enviar →' : 'Próximo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(surveyContent, document.body);
};

// Componente para perguntas numéricas
const NumberQuestionContent: React.FC<{
  question: NumberQuestion;
  value: number | null;
  onChange: (value: number) => void;
}> = ({ question, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="number"
          min={question.min}
          max={question.max}
          value={inputValue}
          onChange={handleChange}
          placeholder={`Ex: ${question.min || 0}`}
          className="w-full rounded-xl border border-emerald-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition"
        />
        {question.unit && (
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {question.unit}
          </span>
        )}
      </div>
      {question.min !== undefined && question.max !== undefined && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Entre {question.min} e {question.max} {question.unit || ''}
        </div>
      )}
    </div>
  );
};

// Componente para lista de horários
const TimeListQuestionContent: React.FC<{
  question: TimeListQuestion;
  value: { times: string[] };
  onAdd: (time: string) => void;
  onRemove: (time: string) => void;
}> = ({ question, value, onAdd, onRemove }) => {
  const [newTime, setNewTime] = useState('');

  const handleAdd = () => {
    if (newTime.trim()) {
      onAdd(newTime);
      setNewTime('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-xl border border-emerald-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTime.trim() || (question.maxItems && value.times.length >= question.maxItems)}
          className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition disabled:bg-emerald-200 dark:disabled:bg-emerald-800 disabled:cursor-not-allowed"
        >
          Adicionar
        </button>
      </div>
      {value.times.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Horários adicionados:
          </div>
          <div className="flex flex-wrap gap-2">
            {value.times.map((time, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-300"
              >
                <span>{time}</span>
                <button
                  type="button"
                  onClick={() => onRemove(time)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {question.maxItems && value.times.length >= question.maxItems && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Máximo de {question.maxItems} horários atingido
        </p>
      )}
    </div>
  );
};

// Componente para choice-other (mantido da versão anterior)
const ChoiceOther: React.FC<{
  question: ChoiceOtherQuestion;
  currentValue: AnswerValue;
  onSelect: (value: string, other?: string) => void;
}> = ({ question, currentValue, onSelect }) => {
  const isOtherSelected =
    currentValue && typeof currentValue === 'object' && 'option' in currentValue
      ? currentValue.option === question.otherLabel
      : false;
  const selectedValue =
    typeof currentValue === 'string'
      ? currentValue
      : currentValue && typeof currentValue === 'object' && 'option' in currentValue
        ? currentValue.option
        : '';
  const otherText =
    currentValue && typeof currentValue === 'object' && 'other' in currentValue && currentValue.other
      ? currentValue.other
      : '';

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {question.options.map((option) => {
          const selected = selectedValue === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
                  : 'border-emerald-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-600'
              }`}
            >
              <span>{option}</span>
              <span
                className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
                  selected ? 'border-emerald-500 bg-emerald-500' : 'border-emerald-200 dark:border-slate-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-emerald-100 dark:border-slate-600 bg-white dark:bg-slate-700 p-4">
        <button
          type="button"
          onClick={() => onSelect(question.otherLabel, otherText)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
            isOtherSelected
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
              : 'border-transparent text-slate-600 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-600'
          }`}
        >
          <span>{question.otherLabel}</span>
          <span
            className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
              isOtherSelected
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-emerald-200 dark:border-slate-500'
            }`}
          />
        </button>
        {isOtherSelected && (
          <input
            type="text"
            value={otherText}
            onChange={(event) => onSelect(question.otherLabel, event.target.value)}
            placeholder="Descreva"
            className="w-full rounded-lg border border-emerald-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition"
          />
        )}
      </div>
    </div>
  );
};

export default WelcomeSurvey;








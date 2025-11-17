import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type QuestionType = 'text' | 'choice' | 'choice-other' | 'slider' | 'rating';

interface BaseQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
}

interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
}

interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  options: string[];
}

interface ChoiceOtherQuestion extends BaseQuestion {
  type: 'choice-other';
  options: string[];
  otherLabel: string;
}

interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  min: number;
  max: number;
}

interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  scale: string[];
}

type Question =
  | TextQuestion
  | ChoiceQuestion
  | ChoiceOtherQuestion
  | SliderQuestion
  | RatingQuestion;

type AnswerValue =
  | string
  | number
  | { option: string; other: string }
  | null;

const SURVEY_VERSION = 'v1';
const LEGACY_STORAGE_KEYS = ['nutriIA_enquete', 'enqueteRespondida'];
const STORAGE_KEY = `nutriIA_enquete_${SURVEY_VERSION}`;
const STORAGE_FLAG = `nutriIA_enquete_${SURVEY_VERSION}_done`;

const questions: Question[] = [
  {
    id: 'nome',
    prompt: 'Qual o seu nome ou apelido preferido?',
    type: 'text',
    placeholder: 'Ex.: Ana, João, Ju...',
  },
  {
    id: 'objetivo',
    prompt: 'O que você quer alcançar com sua alimentação?',
    type: 'choice',
    options: [
      'Ganhar massa muscular 💪',
      'Perder gordura ⚖️',
      'Manter o peso 🧘',
      'Melhorar saúde 🍎',
    ],
  },
  {
    id: 'exercicios',
    prompt: 'Quantas vezes por semana você se exercita?',
    type: 'choice',
    options: ['Quase nunca', '1-2 vezes', '3-4 vezes', '5 ou mais vezes'],
  },
  {
    id: 'dieta',
    prompt: 'Você segue algum tipo de dieta?',
    type: 'choice-other',
    options: [
      'Nenhuma específica',
      'Low carb',
      'Keto',
      'Vegetariana',
      'Vegana',
      'Mediterrânea',
    ],
    otherLabel: 'Outra',
  },
  {
    id: 'refeicoes',
    prompt: 'Quantas refeições principais você faz por dia?',
    type: 'choice',
    options: ['1 refeição', '2 refeições', '3 refeições', '4 ou mais refeições'],
  },
  {
    id: 'preferencias',
    prompt: 'Você gosta mais de...?',
    type: 'choice',
    options: [
      'Refeições rápidas',
      'Receitas elaboradas',
      'Lanches leves',
      'Doces saudáveis',
    ],
  },
  {
    id: 'agua',
    prompt: 'Quantos copos d’água você costuma beber por dia?',
    type: 'slider',
    min: 0,
    max: 10,
  },
  {
    id: 'energia',
    prompt: 'De 1 a 5, como você se sente durante o dia?',
    type: 'rating',
    scale: ['😴', '😕', '😐', '🙂', '⚡'],
  },
];

const baseAnswers = questions.reduce<Record<string, AnswerValue>>((acc, question) => {
  if (question.type === 'slider') {
    acc[question.id] = Math.round((question.min + question.max) / 2);
  } else if (question.type === 'rating') {
    acc[question.id] = null;
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
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      const hasAnswered = localStorage.getItem(STORAGE_FLAG);
      setShowSurvey(!hasAnswered);
    } catch (error) {
      console.warn('Não foi possível acessar o localStorage.', error);
      setShowSurvey(true);
    }
  }, []);

  const currentQuestion = useMemo(() => questions[step], [step]);

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleChoiceSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleChoiceOther = (value: string, other: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { option: value, other },
    }));
  };

  const handleSliderChange = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleRatingSelect = (index: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index + 1 }));
  };

  const getAnswerForQuestion = (question: Question) => answers[question.id];

  const canProceed = () => {
    const value = answers[currentQuestion.id];
    if (value === null || value === undefined) return false;

    if (typeof value === 'string') return value.trim().length > 0;

    if (typeof value === 'number') {
      if (currentQuestion.type === 'rating') {
        return value > 0;
      }
      return true;
    }

    if (value && typeof value === 'object' && 'option' in value) {
      if (currentQuestion.type === 'choice-other') {
        if (
          value.option === (currentQuestion as ChoiceOtherQuestion).otherLabel &&
          'other' in value
        ) {
          return Boolean(value.other?.trim());
        }
      }
      return Boolean(value.option);
    }

    return false;
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (step === questions.length - 1) {
      finalizeSurvey();
    } else {
      setStep((prev) => Math.min(prev + 1, questions.length - 1));
    }
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const finalizeSurvey = () => {
    const payload = {
      ...answers,
      completedAt: new Date().toISOString(),
    };

    const nameAnswer = answers.nome;
    const resolvedName =
      typeof nameAnswer === 'string' && nameAnswer.trim().length > 0
        ? nameAnswer.trim()
        : 'você';

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(STORAGE_FLAG, 'true');
    } catch (error) {
      console.error('Não foi possível salvar as respostas da enquete.', error);
    }

    console.log('Respostas da Enquete Nutri.IA:', payload);
    setShowSummary(true);
    setAnswers((prev) => ({ ...prev, nome: resolvedName }));
  };

  const handleFinishSummary = () => {
    setShowSurvey(false);
    setShowSummary(false);
    // Pequeno delay para garantir que o estado seja atualizado antes de chamar onCompleted
    setTimeout(() => {
      onCompleted?.();
    }, 100);
  };

  // Redirecionar automaticamente se a enquete já foi respondida
  useEffect(() => {
    if (!showSurvey && onCompleted) {
      // Redirecionar após 2 segundos
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
    let savedName: string | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.nome && typeof parsed.nome === 'string') {
          savedName = parsed.nome;
        }
      }
    } catch (_) {
      savedName = null;
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center px-6 py-16 bg-white dark:bg-slate-900/60 rounded-2xl shadow-lg border border-emerald-50 dark:border-emerald-500/10">
        <h1 className="text-3xl font-bold text-emerald-600">
          Enquete já respondida
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          {savedName
            ? `Obrigado, ${savedName}! Você já personalizou sua experiência.`
            : 'Obrigado! Você já personalizou sua experiência.'}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Caso queira atualizar suas respostas posteriormente, limpe os dados do
          aplicativo no navegador.
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

  const surveyContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-emerald-100">
        <div className="h-2 bg-emerald-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{
              width: `${
                ((showSummary ? questions.length : step + 1) / questions.length) * 100
              }%`,
            }}
          />
        </div>

        <div className="px-6 pt-6 text-center">
          <h2 className="text-2xl font-semibold text-emerald-600">
            👋 Bem-vindo ao Nutri.IA
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Responda rapidinho pra personalizarmos sua experiência!
          </p>
        </div>

        {!showSummary ? (
          <div className="px-6 py-8 space-y-6 transition-all duration-300">
            <div className="text-sm font-semibold text-emerald-500">
              Pergunta {step + 1}/{questions.length}
            </div>

            <h3 className="text-xl font-bold text-slate-700 text-center">
              {currentQuestion.prompt}
            </h3>

            {currentQuestion.type === 'text' && (
              <input
                type="text"
                placeholder={(currentQuestion as TextQuestion).placeholder}
                value={(getAnswerForQuestion(currentQuestion) as string) || ''}
                onChange={(event) => handleTextChange(event.target.value)}
                className="w-full rounded-xl border border-emerald-200 px-4 py-3 text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition"
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
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                          : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{option}</span>
                      <span
                        className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-emerald-200'
                        }`}
                      />
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

            {currentQuestion.type === 'slider' && (
              <SliderQuestionContent
                question={currentQuestion as SliderQuestion}
                value={(answers[currentQuestion.id] as number) ?? 0}
                onChange={(value) => handleSliderChange(value)}
              />
            )}

            {currentQuestion.type === 'rating' && (
              <RatingQuestionContent
                question={currentQuestion as RatingQuestion}
                value={(answers[currentQuestion.id] as number) ?? 0}
                onSelect={(index) => handleRatingSelect(index)}
              />
            )}
          </div>
        ) : (
          <div className="px-6 py-10 text-center space-y-6 transition-all duration-300">
            <div className="text-4xl">🎉</div>
            <h3 className="text-2xl font-bold text-emerald-600">
              Tudo pronto, {answers.nome || 'você'}!
            </h3>
            <p className="text-slate-600">
              Com base nas suas respostas, o Nutri.IA vai montar recomendações
              personalizadas pra você.
            </p>
            <button
              type="button"
              onClick={handleFinishSummary}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-xl"
            >
              Ver meu plano inicial
            </button>
          </div>
        )}

        {!showSummary && (
          <div className="flex items-center justify-between px-6 pb-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="text-sm font-semibold text-emerald-500 transition disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg disabled:bg-emerald-200 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {step === questions.length - 1 ? 'Enviar →' : 'Próximo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Usar portal para renderizar o overlay fixo, evitando problemas de desmontagem
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(surveyContent, document.body);
};

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
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                  : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <span>{option}</span>
              <span
                className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
                  selected ? 'border-emerald-500 bg-emerald-500' : 'border-emerald-200'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4">
        <button
          type="button"
          onClick={() => onSelect(question.otherLabel, otherText)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
            isOtherSelected
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
              : 'border-transparent text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <span>{question.otherLabel}</span>
          <span
            className={`ml-3 h-4 w-4 rounded-full border-2 transition ${
              isOtherSelected
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-emerald-200'
            }`}
          />
        </button>
        {isOtherSelected && (
          <input
            type="text"
            value={otherText}
            onChange={(event) => onSelect(question.otherLabel, event.target.value)}
            placeholder="Descreva sua dieta"
            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition"
          />
        )}
      </div>
    </div>
  );
};

const SliderQuestionContent: React.FC<{
  question: SliderQuestion;
  value: number;
  onChange: (value: number) => void;
}> = ({ question, value, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-emerald-500 text-center">
        {value} copo(s)
      </div>
      <input
        type="range"
        min={question.min}
        max={question.max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-emerald-500"
      />
      <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400">
        <span>{question.min}</span>
        <span>{question.max}</span>
      </div>
    </div>
  );
};

const RatingQuestionContent: React.FC<{
  question: RatingQuestion;
  value: number;
  onSelect: (index: number) => void;
}> = ({ question, value, onSelect }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {question.scale.map((emoji, index) => {
        const selected = value === index + 1;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition ${
              selected
                ? 'bg-emerald-500 text-white shadow-xl'
                : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};

export default WelcomeSurvey;


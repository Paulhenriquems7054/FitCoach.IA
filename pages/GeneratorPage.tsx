import React, { useState } from 'react';
import PlanGeneratorForm from '../components/PlanGeneratorForm';
import MealPlanDisplay from '../components/MealPlanDisplay';
import Dashboard from '../components/Dashboard';
import { generateMealPlan } from '../services/geminiService';
import type { MealPlan, DailySummary } from '../types';
import { useUser } from '../context/UserContext';
import { Alert } from '../components/ui/Alert';
import { MealPlanSkeleton } from '../components/skeletons/MealPlanSkeleton';

const GeneratorPage: React.FC = () => {
  const { user, addPoints } = useUser();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);
    setMealPlan(null);
    setSummary(null);
    setObservations('');
    try {
      const result = await generateMealPlan(user);
      if (result) {
        setMealPlan(result.planoAlimentar);
        setSummary(result.resumo_diario);
        setObservations(result.observacoes);
        addPoints(10); // Award points for generating a plan
      } else {
        setError('Não foi possível gerar o plano. A resposta da IA estava vazia.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao gerar o plano alimentar. Verifique sua chave de API e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerador de Plano com IA</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Preencha seus dados para criar um plano alimentar exclusivo.</p>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
            <PlanGeneratorForm
                onGeneratePlan={handleGeneratePlan}
                isLoading={isLoading}
            />
        </div>
        <div className="lg:col-span-8">
          {isLoading ? (
             <MealPlanSkeleton />
          ) : error ? (
            <Alert type="error" title="Erro ao Gerar Plano">
                <p>{error}</p>
            </Alert>
          ) : mealPlan ? (
            <div className="space-y-8">
              <Dashboard summary={summary} />
              <MealPlanDisplay plan={mealPlan} observations={observations} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
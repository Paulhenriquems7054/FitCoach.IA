import React, { useState } from 'react';
import PlanGeneratorForm from '../components/PlanGeneratorForm';
import MealPlanDisplay from '../components/MealPlanDisplay';
import Dashboard from '../components/Dashboard';
import { generateMealPlan } from '../services/geminiService';
import { saveMealPlan } from '../services/databaseService';
import type { MealPlan, DailySummary } from '../types';
import { useUser } from '../context/UserContext';
import { Alert } from '../components/ui/Alert';
import { MealPlanSkeleton } from '../components/skeletons/MealPlanSkeleton';
import { MealPlanHistory } from '../components/MealPlanHistory';
import { Button } from '../components/ui/Button';

const GeneratorPage: React.FC = () => {
  const { user, addPoints } = useUser();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

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
        
        // Salvar plano no banco de dados
        try {
          await saveMealPlan(result.planoAlimentar, user.nome);
        } catch (saveError) {
          console.error('Erro ao salvar plano no histórico:', saveError);
          // Não bloquear a exibição do plano se houver erro ao salvar
        }
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

  const handleSelectPlanFromHistory = (plan: MealPlan) => {
    setMealPlan(plan);
    // Calcular resumo do plano selecionado
    const calculatedSummary: DailySummary = {
      total_calorias: plan.reduce((sum, meal) => sum + meal.calorias, 0),
      total_proteinas_g: plan.reduce((sum, meal) => sum + meal.macros.proteinas_g, 0),
      total_carboidratos_g: plan.reduce((sum, meal) => sum + meal.macros.carboidratos_g, 0),
      total_gorduras_g: plan.reduce((sum, meal) => sum + meal.macros.gorduras_g, 0),
    };
    setSummary(calculatedSummary);
    setObservations('');
    setShowHistory(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerador de Plano com IA</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Preencha seus dados para criar um plano alimentar exclusivo.</p>
            </div>
            <Button
                onClick={() => setShowHistory(true)}
                variant="secondary"
                className="whitespace-nowrap"
            >
                📋 Histórico de Planos
            </Button>
        </div>
        
        {showHistory && (
            <MealPlanHistory
                userId={user.nome}
                onClose={() => setShowHistory(false)}
                onSelectPlan={handleSelectPlanFromHistory}
            />
        )}
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
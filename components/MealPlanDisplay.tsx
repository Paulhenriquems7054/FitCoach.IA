
import React, { useRef, useState, memo } from 'react';
import type { Meal, MealPlan } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useUser } from '../context/UserContext';
import { explainMeal } from '../services/geminiService';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useI18n } from '../context/I18nContext';
import { useToast } from './ui/Toast';

interface MealPlanDisplayProps {
  plan: MealPlan;
  observations: string;
}

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = memo(({ plan, observations }) => {
  const { user } = useUser();
  const { t } = useI18n();
  const planRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', explanation: '' });
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const handleExportPDF = async () => {
    if (!planRef.current) return;
    
    try {
      // Importação dinâmica das bibliotecas PDF
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(planRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save('plano-alimentar-nutri-ia.pdf');
      showSuccess('PDF exportado com sucesso!');
    } catch (error) {
      showError('Erro ao exportar PDF. Tente novamente.');
    }
  };
  
  const handleExplainMeal = async (meal: Meal) => {
    setIsModalOpen(true);
    setIsExplanationLoading(true);
    setModalContent({ title: `${t('meal_plan.explanation.title')} ${meal.refeicao}`, explanation: '' });
    try {
        const explanation = await explainMeal(meal.refeicao, user);
        setModalContent(prev => ({ ...prev, explanation }));
    } catch (error) {
        setModalContent(prev => ({ ...prev, explanation: t('meal_plan.explanation.error') }));
        showError('Não foi possível obter explicação da refeição.');
    } finally {
        setIsExplanationLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('meal_plan.title')}</h2>
            <Button
              onClick={handleExportPDF}
              variant="secondary"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t('meal_plan.export_pdf')}
            </Button>
          </div>

          <div ref={planRef} className="p-2">
              <div className="space-y-6">
              {plan.map((meal) => (
                  <div key={meal.refeicao} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-400">{meal.refeicao}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{meal.horario_sugerido}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleExplainMeal(meal)}>
                            {t('meal_plan.why_this_meal')}
                        </Button>
                    </div>
                    <ul className="mt-3 list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        {meal.alimentos.map((food, index) => (
                        <li key={index}>{food}</li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end text-xs space-x-4 text-slate-500 dark:text-slate-400">
                        <span>{meal.calorias} kcal</span>
                        <span>P: {meal.macros.proteinas_g}g</span>
                        <span>C: {meal.macros.carboidratos_g}g</span>
                        <span>G: {meal.macros.gorduras_g}g</span>
                    </div>
                  </div>
              ))}
              {observations && (
                <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-200 dark:border-sky-800">
                  <h4 className="font-semibold text-sky-800 dark:text-sky-300">{t('meal_plan.observations_title')}</h4>
                  <p className="mt-2 text-sm text-sky-700 dark:text-sky-200 whitespace-pre-wrap">{observations}</p>
                </div>
              )}
              </div>
          </div>
        </div>
      </Card>
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" aria-modal="true">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                 <div className="p-3 sm:p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 truncate pr-2">
                        <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0"/>
                        <span className="truncate">{modalContent.title}</span>
                    </h2>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0" aria-label="Fechar">
                        <XIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 min-h-[100px]">
                    {isExplanationLoading ? (
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{modalContent.explanation}</p>
                    )}
                </div>
            </Card>
        </div>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.plan === nextProps.plan &&
    prevProps.observations === nextProps.observations
  );
});

MealPlanDisplay.displayName = 'MealPlanDisplay';

export default MealPlanDisplay;

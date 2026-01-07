import React from 'react';
import { Modal } from '../ui/Modal';
import { SimpleGifDisplay } from '../ui/SimpleGifDisplay';
import type { ExerciseInfo } from '../../types/exercise';

interface ExerciseDetailsModalProps {
  exercise: ExerciseInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de detalhes do exercício
 * Exibe informações completas: GIF, descrição, dicas, erros comuns, etc.
 */
export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  if (!exercise) return null;

  // Gerar descrição básica baseada no nome do exercício (compatibilidade com código existente)
  const getExerciseDescription = (name: string): string => {
    const lower = name.toLowerCase();
    
    if (lower.includes('panturrilha') || lower.includes('panturrinha') || 
        lower.includes('flexão plantar') || lower.includes('flexao plantar') ||
        lower.includes('elevação de panturrilha') || lower.includes('elevacao de panturrilha') ||
        lower.includes('levantamento de panturrilha') || lower.includes('gêmeos') || lower.includes('gemeos')) {
      return 'Exercício de isolamento para desenvolvimento das panturrilhas (gêmeos). Essencial para completar o desenvolvimento das pernas e melhorar estabilidade.';
    } else if (lower.includes('agachamento')) {
      return 'Exercício composto que trabalha principalmente quadríceps, glúteos e posterior de coxa. Excelente para desenvolvimento de força e massa muscular nas pernas.';
    } else if (lower.includes('supino')) {
      return 'Exercício fundamental para desenvolvimento do peitoral, além de trabalhar tríceps e deltoides anteriores. Pode ser executado com barra ou halteres.';
    } else if (lower.includes('remada') || lower.includes('remo')) {
      return 'Exercício essencial para desenvolvimento das costas, trabalhando latíssimo do dorso, romboides e trapézio. Melhora a postura e força de tração.';
    } else if (lower.includes('puxada')) {
      return 'Exercício de puxada vertical que desenvolve principalmente o latíssimo do dorso e bíceps. Fundamental para largura das costas.';
    } else if (lower.includes('rosca')) {
      return 'Exercício de isolamento para desenvolvimento dos bíceps. Pode ser executado com barra, halteres ou cabo em diferentes variações.';
    } else if (lower.includes('tríceps')) {
      return 'Exercício de isolamento para desenvolvimento dos tríceps. Essencial para volume e definição dos braços.';
    } else if (lower.includes('desenvolvimento')) {
      return 'Exercício para desenvolvimento dos deltoides (ombros). Pode ser executado sentado ou em pé, com barra ou halteres.';
    } else if (lower.includes('elevação pélvica') || lower.includes('elevacao pelvica')) {
      return 'Exercício para desenvolvimento dos glúteos e posterior de coxa. Melhora força e estabilidade do quadril.';
    } else if (lower.includes('elevação') || lower.includes('elevacao')) {
      if (!lower.includes('panturrilha') && !lower.includes('panturrinha')) {
        return 'Exercício de isolamento para ombros, trabalhando deltoides anterior, lateral ou posterior dependendo da variação.';
      }
    } else if (lower.includes('abdominal') || lower.includes('prancha')) {
      return 'Exercício para fortalecimento do core (abdômen). Melhora estabilidade, postura e força funcional.';
    } else if (lower.includes('leg press')) {
      return 'Exercício de pernas realizado em máquina. Trabalha quadríceps, glúteos e posterior de coxa com segurança e controle.';
    } else if (lower.includes('cardio') || lower.includes('esteira') || lower.includes('bicicleta')) {
      return 'Exercício cardiovascular que melhora condicionamento físico, queima calorias e fortalece o sistema cardiovascular.';
    } else if (lower.includes('stiff') || lower.includes('levantamento terra')) {
      return 'Exercício composto que trabalha posterior de coxa, glúteos e eretores da espinha. Excelente para força e desenvolvimento posterior.';
    } else if (lower.includes('crucifixo')) {
      return 'Exercício de isolamento para o peitoral, trabalhando principalmente as fibras internas do músculo.';
    } else if (lower.includes('voador')) {
      return 'Exercício de isolamento para peitoral realizado em máquina ou com halteres. Trabalha principalmente a parte interna do peito.';
    } else if (lower.includes('barra fixa')) {
      return 'Exercício de peso corporal para desenvolvimento das costas e bíceps. Desafio fundamental para força de tração.';
    } else {
      return 'Exercício de musculação que contribui para o desenvolvimento muscular e força. Execute com técnica adequada para melhores resultados.';
    }
  };

  const description = exercise.description || getExerciseDescription(exercise.name);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={exercise.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* GIF do Exercício */}
        {exercise.gifPath && (
          <div className="w-full rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-900">
            <SimpleGifDisplay
              src={exercise.gifPath}
              alt={`Demonstração de ${exercise.name}`}
              className="w-full h-auto max-h-[400px] object-contain"
            />
          </div>
        )}

        {/* Informações do Exercício */}
        <div className="space-y-4">
          {/* Grupo Muscular */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Músculos Trabalhados
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {exercise.muscleGroup}
              </span>
              {exercise.subMuscleGroup && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {exercise.subMuscleGroup}
                </span>
              )}
            </div>
          </div>

          {/* Nível (se disponível) */}
          {exercise.level && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nível
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                exercise.level === 'iniciante' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : exercise.level === 'intermediário'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
              </span>
            </div>
          )}

          {/* Descrição */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Descrição
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Dicas de Execução */}
          {exercise.executionTips && exercise.executionTips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                💡 Dicas de Execução
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {exercise.executionTips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Erros Comuns */}
          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ⚠️ Erros Comuns
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {exercise.commonMistakes.map((mistake, index) => (
                  <li key={index}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};


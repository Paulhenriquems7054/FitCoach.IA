
import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { UsersIcon } from '../components/icons/UsersIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Alert } from '../components/ui/Alert';
import type { Patient } from '../types';
import { Goal } from '../types';

const mockPatients: Patient[] = [
  { id: '1', name: 'Carlos Silva', goal: Goal.PERDER_PESO, lastCheckin: '2 dias atrás', progress: 'on_track' },
  { id: '2', name: 'Mariana Costa', goal: Goal.GANHAR_MASSA, lastCheckin: 'Ontem', progress: 'on_track' },
  { id: '3', name: 'João Pereira', goal: Goal.MANTER_PESO, lastCheckin: '5 dias atrás', progress: 'stagnated' },
  { id: '4', name: 'Beatriz Lima', goal: Goal.PERDER_PESO, lastCheckin: 'Hoje', progress: 'behind' },
];

const progressStyles = {
    on_track: { text: 'No Caminho', bg: 'bg-green-100 dark:bg-green-900/50', text_color: 'text-green-800 dark:text-green-300' },
    stagnated: { text: 'Estagnado', bg: 'bg-amber-100 dark:bg-amber-900/50', text_color: 'text-amber-800 dark:text-amber-300' },
    behind: { text: 'Atrasado', bg: 'bg-red-100 dark:bg-red-900/50', text_color: 'text-red-800 dark:text-red-300' },
}

const ProfessionalDashboardPage: React.FC = () => {
  const { user } = useUser();

  if (user.role !== 'professional') {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert type="error" title="Acesso Negado">
          <p>Esta página está disponível apenas para usuários profissionais. Você pode alterar seu tipo de perfil nas configurações para visualizar esta página.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Painel Profissional</h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Gerencie seus pacientes e planos com eficiência.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <div className="p-6">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400">Total de Pacientes</h3>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">12</p>
            </div>
        </Card>
        <Card>
            <div className="p-6">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400">Planos Gerados (Mês)</h3>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">48</p>
            </div>
        </Card>
        <Card>
            <div className="p-6">
                <h3 className="font-semibold text-slate-500 dark:text-slate-400">Pacientes Ativos</h3>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">9</p>
            </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Meus Pacientes</h2>
            <Button>
              <UsersIcon className="-ml-1 mr-2 h-5 w-5" />
              Adicionar Paciente
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nome</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Objetivo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Último Check-in</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Progresso</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                {mockPatients.map(patient => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{patient.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{patient.goal}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{patient.lastCheckin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${progressStyles[patient.progress].bg} ${progressStyles[patient.progress].text_color}`}>
                        {progressStyles[patient.progress].text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Ver Detalhes</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfessionalDashboardPage;
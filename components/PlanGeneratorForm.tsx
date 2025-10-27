import React from 'react';
import { Goal } from '../types';
import { useUser } from '../context/UserContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PlanGeneratorFormProps {
  onGeneratePlan: () => void;
  isLoading: boolean;
}

const PlanGeneratorForm: React.FC<PlanGeneratorFormProps> = ({ onGeneratePlan, isLoading }) => {
  const { user: formData, setUser: setFormData } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'idade' || name === 'peso' || name === 'altura' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePlan();
  };

  return (
    <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Seus Dados</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                    <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="idade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Idade</label>
                        <input type="number" name="idade" id="idade" value={formData.idade} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="genero" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gênero</label>
                        <select name="genero" id="genero" value={formData.genero} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                            <option>Masculino</option>
                            <option>Feminino</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="peso" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Peso (kg)</label>
                        <input type="number" name="peso" id="peso" step="0.1" value={formData.peso} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="altura" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Altura (cm)</label>
                        <input type="number" name="altura" id="altura" value={formData.altura} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                </div>

                <div>
                    <label htmlFor="objetivo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Objetivo</label>
                    <select name="objetivo" id="objetivo" value={formData.objetivo} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value={Goal.PERDER_PESO}>Perder Peso</option>
                        <option value={Goal.MANTER_PESO}>Manter Peso</option>
                        <option value={Goal.GANHAR_MASSA}>Ganhar Massa Muscular</option>
                    </select>
                </div>
            </div>
            
            <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
            >
                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                Gerar Plano com IA
            </Button>
        </form>
    </Card>
  );
};

export default PlanGeneratorForm;
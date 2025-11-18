import React, { useState } from 'react';
import { Goal } from '../types';
import { useUser } from '../context/UserContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { validateUserData } from '../utils/validation';
import { sanitizeInput } from '../utils/security';

interface PlanGeneratorFormProps {
  onGeneratePlan: () => void;
  isLoading: boolean;
}

const PlanGeneratorForm: React.FC<PlanGeneratorFormProps> = ({ onGeneratePlan, isLoading }) => {
  const { user: formData, setUser: setFormData } = useUser();
  const { showError } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue: string | number = value;
    
    // Sanitizar strings
    if (name === 'nome' || name === 'genero' || name === 'objetivo') {
      newValue = sanitizeInput(value, name === 'nome' ? 100 : 50);
    } else if (name === 'idade' || name === 'peso' || name === 'altura') {
      newValue = Number(value) || 0;
    }
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados
    const validation = validateUserData({
      nome: formData.nome,
      idade: formData.idade,
      genero: formData.genero,
      peso: formData.peso,
      altura: formData.altura,
      objetivo: formData.objetivo,
    });

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      
      // Mostrar primeiro erro como toast
      if (validation.errors.length > 0) {
        showError(validation.errors[0].message);
      }
      
      return;
    }

    // Limpar erros e prosseguir
    setErrors({});
    onGeneratePlan();
  };

  const getInputClassName = (fieldName: string) => {
    const baseClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors";
    const errorClasses = errors[fieldName] 
      ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500" 
      : "border-slate-300 dark:border-slate-600";
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Seus Dados</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nome <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="nome" 
                        id="nome" 
                        value={formData.nome} 
                        onChange={handleChange}
                        className={getInputClassName('nome')}
                        aria-invalid={!!errors.nome}
                        aria-describedby={errors.nome ? 'nome-error' : undefined}
                    />
                    {errors.nome && (
                        <p id="nome-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                            {errors.nome}
                        </p>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="idade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Idade <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="idade" 
                            id="idade" 
                            min="1" 
                            max="120"
                            value={formData.idade || ''} 
                            onChange={handleChange}
                            className={getInputClassName('idade')}
                            aria-invalid={!!errors.idade}
                            aria-describedby={errors.idade ? 'idade-error' : undefined}
                        />
                        {errors.idade && (
                            <p id="idade-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                                {errors.idade}
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="genero" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Gênero <span className="text-red-500">*</span>
                        </label>
                        <select 
                            name="genero" 
                            id="genero" 
                            value={formData.genero} 
                            onChange={handleChange}
                            className={getInputClassName('genero')}
                            aria-invalid={!!errors.genero}
                            aria-describedby={errors.genero ? 'genero-error' : undefined}
                        >
                            <option value="">Selecione...</option>
                            <option>Masculino</option>
                            <option>Feminino</option>
                        </select>
                        {errors.genero && (
                            <p id="genero-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                                {errors.genero}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="peso" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Peso (kg) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="peso" 
                            id="peso" 
                            step="0.1" 
                            min="20" 
                            max="300"
                            value={formData.peso || ''} 
                            onChange={handleChange}
                            className={getInputClassName('peso')}
                            aria-invalid={!!errors.peso}
                            aria-describedby={errors.peso ? 'peso-error' : undefined}
                        />
                        {errors.peso && (
                            <p id="peso-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                                {errors.peso}
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="altura" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Altura (cm) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="altura" 
                            id="altura" 
                            min="50" 
                            max="250"
                            value={formData.altura || ''} 
                            onChange={handleChange}
                            className={getInputClassName('altura')}
                            aria-invalid={!!errors.altura}
                            aria-describedby={errors.altura ? 'altura-error' : undefined}
                        />
                        {errors.altura && (
                            <p id="altura-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                                {errors.altura}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="objetivo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Objetivo <span className="text-red-500">*</span>
                    </label>
                    <select 
                        name="objetivo" 
                        id="objetivo" 
                        value={formData.objetivo} 
                        onChange={handleChange}
                        className={getInputClassName('objetivo')}
                        aria-invalid={!!errors.objetivo}
                        aria-describedby={errors.objetivo ? 'objetivo-error' : undefined}
                    >
                        <option value="">Selecione...</option>
                        <option value={Goal.PERDER_PESO}>Perder Peso</option>
                        <option value={Goal.MANTER_PESO}>Manter Peso</option>
                        <option value={Goal.GANHAR_MASSA}>Ganhar Massa Muscular</option>
                    </select>
                    {errors.objetivo && (
                        <p id="objetivo-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                            {errors.objetivo}
                        </p>
                    )}
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
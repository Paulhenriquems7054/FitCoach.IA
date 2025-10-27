import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';
import { Button } from '../components/ui/Button';

const ProfilePage: React.FC = () => {
    const { user, setUser } = useUser();
    const [isEditing, setIsEditing] = React.useState(false);
    const [formData, setFormData] = React.useState(user);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === 'idade' || name === 'peso' || name === 'altura' ? Number(value) : value }));
    };

    const handleSave = () => {
        setUser(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData(user);
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Veja e atualize seus dados para manter a IA calibrada.</p>
            </div>

            <Card>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="idade" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Idade</label>
                                <input type="number" name="idade" id="idade" value={formData.idade} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="genero" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gênero</label>
                                <select name="genero" id="genero" value={formData.genero} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                                    <option>Masculino</option>
                                    <option>Feminino</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="peso" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Peso (kg)</label>
                                <input type="number" name="peso" id="peso" step="0.1" value={formData.peso} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" />
                            </div>
                            <div>
                                <label htmlFor="altura" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Altura (cm)</label>
                                <input type="number" name="altura" id="altura" value={formData.altura} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="objetivo" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Objetivo</label>
                            <select name="objetivo" id="objetivo" value={formData.objetivo} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed">
                                <option value={Goal.PERDER_PESO}>Perder Peso</option>
                                <option value={Goal.MANTER_PESO}>Manter Peso</option>
                                <option value={Goal.GANHAR_MASSA}>Ganhar Massa Muscular</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
                                <Button onClick={handleSave}>Salvar Alterações</Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProfilePage;
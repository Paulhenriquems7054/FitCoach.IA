import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';
import { Button } from '../components/ui/Button';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import { useToast } from '../components/ui/Toast';
import { loadGymConfig, saveGymConfig, getAppName } from '../services/gymConfigService';
import type { Gym } from '../types';

const ProfilePage: React.FC = () => {
    const { user, setUser } = useUser();
    const { showSuccess, showError } = useToast();
    const isAdmin = user.gymRole === 'admin' || user.username === 'Administrador' || user.username === 'Desenvolvedor';
    
    // Estado para perfil pessoal (alunos/treinadores)
    const [isEditing, setIsEditing] = React.useState(false);
    const [formData, setFormData] = React.useState(user);
    
    // Estado para perfil da academia (administradores)
    const [gym, setGym] = React.useState<Gym | null>(null);
    const [isEditingGym, setIsEditingGym] = React.useState(false);
    const [gymFormData, setGymFormData] = React.useState({
        name: '',
        appName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
    });

    React.useEffect(() => {
        if (isAdmin) {
            // Carregar dados da academia
            const loadedGym = loadGymConfig();
            if (loadedGym) {
                setGym(loadedGym);
                setGymFormData({
                    name: loadedGym.name,
                    appName: loadedGym.appName || getAppName(),
                    contactEmail: loadedGym.contactEmail || '',
                    contactPhone: loadedGym.contactPhone || '',
                    website: loadedGym.website || '',
                });
            }
        } else {
            setFormData(user);
        }
    }, [user, isAdmin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === 'idade' || name === 'peso' || name === 'altura' ? Number(value) : value }));
    };

    const handlePhotoChange = (photoUrl: string | null) => {
        const updatedFormData = { ...formData, photoUrl: photoUrl || undefined };
        setFormData(updatedFormData);
        // Salvar imediatamente quando a foto for alterada
        setUser(updatedFormData);
    };

    const handleSave = () => {
        setUser(formData);
        setIsEditing(false);
        showSuccess('Perfil atualizado com sucesso!');
    };

    const handleCancel = () => {
        setFormData(user);
        setIsEditing(false);
    };

    const handleGymInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGymFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGymSave = () => {
        if (!gym) {
            showError('Academia não encontrada');
            return;
        }

        const updatedGym: Gym = {
            ...gym,
            name: gymFormData.name,
            appName: gymFormData.appName,
            contactEmail: gymFormData.contactEmail,
            contactPhone: gymFormData.contactPhone,
            website: gymFormData.website,
            updatedAt: new Date().toISOString(),
        };

        saveGymConfig(updatedGym);
        setGym(updatedGym);
        setIsEditingGym(false);
        showSuccess('Informações da academia atualizadas com sucesso!');
    };

    const handleGymCancel = () => {
        if (gym) {
            setGymFormData({
                name: gym.name,
                appName: gym.appName || getAppName(),
                contactEmail: gym.contactEmail || '',
                contactPhone: gym.contactPhone || '',
                website: gym.website || '',
            });
        }
        setIsEditingGym(false);
    };

    // Se for administrador, mostrar perfil da academia
    if (isAdmin) {
        return (
            <div className="max-w-2xl mx-auto px-2 sm:px-4">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Perfil da Academia</h1>
                    <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">
                        Gerencie as informações e configurações da sua academia.
                    </p>
                </div>

                <Card>
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {!gym ? (
                            <div className="text-center py-8">
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    Nenhuma academia configurada ainda.
                                </p>
                                <Button onClick={() => window.location.hash = '#/gym-admin'}>
                                    Configurar Academia
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="gym-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Nome da Academia
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="gym-name"
                                            value={gymFormData.name}
                                            onChange={handleGymInputChange}
                                            disabled={!isEditingGym}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="gym-appName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Nome do App
                                        </label>
                                        <input
                                            type="text"
                                            name="appName"
                                            id="gym-appName"
                                            value={gymFormData.appName}
                                            onChange={handleGymInputChange}
                                            disabled={!isEditingGym}
                                            placeholder="Ex: Academia XYZ - FitCoach.IA"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="gym-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Email de Contato
                                            </label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                id="gym-email"
                                                value={gymFormData.contactEmail}
                                                onChange={handleGymInputChange}
                                                disabled={!isEditingGym}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="gym-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Telefone de Contato
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                id="gym-phone"
                                                value={gymFormData.contactPhone}
                                                onChange={handleGymInputChange}
                                                disabled={!isEditingGym}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="gym-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            id="gym-website"
                                            value={gymFormData.website}
                                            onChange={handleGymInputChange}
                                            disabled={!isEditingGym}
                                            placeholder="https://exemplo.com"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    {isEditingGym ? (
                                        <>
                                            <Button variant="secondary" onClick={handleGymCancel}>
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleGymSave}>
                                                Salvar Alterações
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditingGym(true)}>
                                            Editar Informações
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // Perfil pessoal para alunos e treinadores
    return (
        <div className="max-w-2xl mx-auto px-2 sm:px-4">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">Veja e atualize seus dados para manter a IA calibrada.</p>
            </div>

            <Card>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Seção de Foto de Perfil */}
                    <div className="flex flex-col items-center pb-6 border-b border-slate-200 dark:border-slate-700">
                        <PhotoUploader
                            currentPhotoUrl={formData.photoUrl}
                            userName={formData.nome || 'Usuário'}
                            onPhotoChange={handlePhotoChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
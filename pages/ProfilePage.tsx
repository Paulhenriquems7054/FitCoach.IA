import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';
import { Button } from '../components/ui/Button';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import { useToast } from '../components/ui/Toast';
import { saveUser, resetPassword, getUserByUsername } from '../services/databaseService';

const ProfilePage: React.FC = () => {
    const { user, setUser } = useUser();
    const { showSuccess, showError } = useToast();
    const isAdmin = user.gymRole === 'admin' || user.username === 'Administrador' || user.username === 'Desenvolvedor';
    const isDefaultUser = user.username === 'Administrador' || user.username === 'Desenvolvedor';
    
    // Estado para perfil pessoal (alunos/treinadores)
    const [isEditing, setIsEditing] = React.useState(false);
    const [formData, setFormData] = React.useState(user);

    // Estado para alteração de credenciais (usuários padrão)
    const [isEditingCredentials, setIsEditingCredentials] = React.useState(false);
    const [credentialsData, setCredentialsData] = React.useState({
        nome: user.nome || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = React.useState(false);

    React.useEffect(() => {
        if (!isAdmin) {
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


    const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentialsData(prev => ({ ...prev, [name]: value }));
    };

    const handleCredentialsSave = async () => {
        if (!user.username) {
            showError('Nome de usuário não encontrado');
            return;
        }

        // Validar senha se fornecida
        if (credentialsData.newPassword) {
            if (credentialsData.newPassword.length < 6) {
                showError('A nova senha deve ter pelo menos 6 caracteres');
                return;
            }
            if (credentialsData.newPassword !== credentialsData.confirmPassword) {
                showError('As senhas não coincidem');
                return;
            }
        }

        try {
            // Atualizar nome
            if (credentialsData.nome !== user.nome) {
                const updatedUser = {
                    ...user,
                    nome: credentialsData.nome,
                };
                await saveUser(updatedUser);
                setUser(updatedUser);
            }

            // Atualizar senha se fornecida
            if (credentialsData.newPassword) {
                // Verificar senha atual (simplificado - em produção, validar hash)
                const currentUser = await getUserByUsername(user.username);
                if (!currentUser) {
                    showError('Usuário não encontrado');
                    return;
                }

                // Atualizar senha
                await resetPassword(user.username, credentialsData.newPassword);
            }

            showSuccess('Credenciais atualizadas com sucesso!');
            setIsEditingCredentials(false);
            setCredentialsData({
                nome: credentialsData.nome,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            console.error('Erro ao atualizar credenciais:', error);
            showError(error.message || 'Erro ao atualizar credenciais');
        }
    };

    const handleCredentialsCancel = () => {
        setCredentialsData({
            nome: user.nome || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setIsEditingCredentials(false);
    };

    // Se for administrador, mostrar apenas credenciais (se for usuário padrão)
    if (isAdmin) {
        return (
            <div className="max-w-2xl mx-auto px-2 sm:px-4 space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Perfil</h1>
                    <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">
                        Gerencie suas credenciais de acesso.
                    </p>
                </div>

                {/* Seção de Credenciais para usuários padrão (Administrador/Desenvolvedor) */}
                {isDefaultUser && (
                    <Card>
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Minhas Credenciais</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Altere seu nome e senha de acesso
                                    </p>
                                </div>
                                {!isEditingCredentials && (
                                    <Button onClick={() => setIsEditingCredentials(true)}>
                                        Editar
                                    </Button>
                                )}
                            </div>

                            {isEditingCredentials ? (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="credentials-nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome
                                        </label>
                                        <input
                                            type="text"
                                            name="nome"
                                            id="credentials-nome"
                                            value={credentialsData.nome}
                                            onChange={handleCredentialsChange}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="credentials-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nova Senha (deixe em branco para não alterar)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="newPassword"
                                                id="credentials-new-password"
                                                value={credentialsData.newPassword}
                                                onChange={handleCredentialsChange}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>

                                    {credentialsData.newPassword && (
                                        <div>
                                            <label htmlFor="credentials-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                id="credentials-confirm-password"
                                                value={credentialsData.confirmPassword}
                                                onChange={handleCredentialsChange}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Button variant="secondary" onClick={handleCredentialsCancel}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleCredentialsSave}>
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome:</span>
                                        <p className="text-sm text-slate-900 dark:text-white">{user.nome || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Usuário:</span>
                                        <p className="text-sm text-slate-900 dark:text-white">{user.username || 'Não informado'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {!isDefaultUser && (
                    <Card>
                        <div className="p-4 sm:p-6 text-center py-8">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                Para configurar a academia, acesse a página de Configurações.
                            </p>
                            <Button onClick={() => window.location.hash = '#/configuracoes'}>
                                Ir para Configurações
                            </Button>
                        </div>
                    </Card>
                )}
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
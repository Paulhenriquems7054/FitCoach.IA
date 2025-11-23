import React from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';
import { Button } from '../components/ui/Button';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import { useToast } from '../components/ui/Toast';
import { saveUser, resetPassword, getUserByUsername, updateUsername } from '../services/databaseService';

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

    React.useEffect(() => {
        // Atualizar dados de credenciais quando o usuário mudar
        if (isDefaultUser) {
            setCredentialsData({
                nome: user.nome || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        }
    }, [user, isDefaultUser]);

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
            if (credentialsData.newPassword.length < 4) {
                showError('A nova senha deve ter pelo menos 4 caracteres');
                return;
            }
            if (credentialsData.newPassword !== credentialsData.confirmPassword) {
                showError('As senhas não coincidem');
                return;
            }
        }

        try {
            // Buscar usuário atual para garantir que temos os dados mais recentes
            const currentUser = await getUserByUsername(user.username);
            if (!currentUser) {
                showError('Usuário não encontrado');
                return;
            }

            // Atualizar nome se mudou
            if (credentialsData.nome !== currentUser.nome) {
                const updatedUser = {
                    ...currentUser,
                    nome: credentialsData.nome,
                };
                await saveUser(updatedUser);
                setUser(updatedUser);
            }

            // Atualizar senha se fornecida
            if (credentialsData.newPassword) {
                const passwordUpdated = await resetPassword(user.username, credentialsData.newPassword);
                if (!passwordUpdated) {
                    showError('Erro ao atualizar senha');
                    return;
                }
            }

            // Recarregar dados atualizados
            const updatedUser = await getUserByUsername(user.username);
            if (updatedUser) {
                setUser(updatedUser);
            }

            showSuccess('Credenciais atualizadas com sucesso!');
            setIsEditingCredentials(false);
            setCredentialsData({
                nome: updatedUser?.nome || credentialsData.nome,
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

    // Estado para edição de credenciais de Administrador e Desenvolvedor
    const [editingAdminCredentials, setEditingAdminCredentials] = React.useState<string | null>(null);
    const [adminCredentialsData, setAdminCredentialsData] = React.useState<{
        [key: string]: { username: string; password: string; confirmPassword: string };
    }>({});
    const [showAdminPassword, setShowAdminPassword] = React.useState<{ [key: string]: boolean }>({});

    React.useEffect(() => {
        // Carregar dados dos usuários padrão quando necessário
        const loadDefaultUsers = async () => {
            if (isAdmin) {
                try {
                    // Tentar buscar pelo username padrão primeiro
                    let adminUser = await getUserByUsername('Administrador');
                    let devUser = await getUserByUsername('Desenvolvedor');
                    
                    // Se não encontrou, buscar todos os admins e encontrar o que corresponde
                    if (!adminUser || !devUser) {
                        const db = await import('../services/databaseService');
                        const allAdmins = await db.getUsersByGymRole(user.gymId || 'default-gym', 'admin');
                        
                        // Procurar usuários que podem ter sido renomeados
                        if (!adminUser) {
                            // Procurar por um admin que pode ter sido o Administrador original
                            adminUser = allAdmins.find((u: any) => 
                                u.username === 'Administrador' || 
                                (u.gymRole === 'admin' && allAdmins.length === 1)
                            ) || allAdmins[0];
                        }
                        
                        if (!devUser && allAdmins.length > 1) {
                            // Procurar por um admin que pode ter sido o Desenvolvedor original
                            devUser = allAdmins.find((u: any) => 
                                u.username === 'Desenvolvedor' && u.username !== adminUser?.username
                            ) || allAdmins[1];
                        }
                    }
                    
                    setAdminCredentialsData({
                        Administrador: {
                            username: adminUser?.username || 'Administrador',
                            password: '',
                            confirmPassword: '',
                        },
                        Desenvolvedor: {
                            username: devUser?.username || 'Desenvolvedor',
                            password: '',
                            confirmPassword: '',
                        },
                    });
                } catch (error) {
                    console.error('Erro ao carregar usuários padrão:', error);
                }
            }
        };
        loadDefaultUsers();
    }, [isAdmin, user.gymId]);

    const handleAdminCredentialsChange = (userType: string, field: string, value: string) => {
        setAdminCredentialsData(prev => ({
            ...prev,
            [userType]: {
                ...prev[userType],
                [field]: value,
            },
        }));
    };

    const handleAdminCredentialsSave = async (userType: 'Administrador' | 'Desenvolvedor') => {
        const data = adminCredentialsData[userType];
        if (!data) {
            showError('Dados não encontrados');
            return;
        }

        try {
            // Buscar usuário atual - tentar múltiplas estratégias
            let currentUser: any = null;
            
            // 1. Tentar buscar pelo username atual do estado (pode ter sido alterado anteriormente)
            if (adminCredentialsData[userType]?.username) {
                currentUser = await getUserByUsername(adminCredentialsData[userType].username);
            }
            
            // 2. Se não encontrou, tentar buscar pelo userType original
            if (!currentUser) {
                currentUser = await getUserByUsername(userType);
            }
            
            // 3. Se ainda não encontrou, buscar todos os usuários e filtrar por gymRole
            if (!currentUser) {
                const db = await import('../services/databaseService');
                const allUsers = await db.getUsersByGymRole(user.gymId || 'default-gym', 'admin');
                // Procurar pelo usuário que corresponde ao tipo (pode ter username diferente)
                currentUser = allUsers.find((u: any) => 
                    u.username === userType || 
                    (u.gymRole === 'admin' && (u.username === adminCredentialsData[userType]?.username))
                );
            }

            if (!currentUser) {
                showError(`${userType} não encontrado. Tente recarregar a página.`);
                return;
            }

            const oldUsername = currentUser.username || userType;
            const newUsername = data.username.trim() || userType;

            // Validar username
            if (newUsername.length < 3) {
                showError('O nome de usuário deve ter pelo menos 3 caracteres');
                return;
            }

            // Validar senha se fornecida
            if (data.password) {
                if (data.password.length < 4) {
                    showError('A senha deve ter pelo menos 4 caracteres');
                    return;
                }
                if (data.password !== data.confirmPassword) {
                    showError('As senhas não coincidem');
                    return;
                }
            }

            // Atualizar username primeiro (se mudou)
            let finalUsername = oldUsername;
            if (newUsername !== oldUsername) {
                try {
                    const usernameUpdated = await updateUsername(oldUsername, newUsername);
                    if (!usernameUpdated) {
                        showError('Erro ao atualizar nome de usuário');
                        return;
                    }
                    finalUsername = newUsername;
                    // Pequeno delay para garantir que a transação do IndexedDB seja concluída
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error: any) {
                    showError(error.message || 'Erro ao atualizar nome de usuário');
                    return;
                }
            }

            // Atualizar senha se fornecida (usar o username final)
            if (data.password) {
                try {
                    const passwordUpdated = await resetPassword(finalUsername, data.password);
                    if (!passwordUpdated) {
                        showError('Erro ao atualizar senha. Verifique se o nome de usuário está correto.');
                        return;
                    }
                    // Pequeno delay para garantir que a transação do IndexedDB seja concluída
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error: any) {
                    showError(error.message || 'Erro ao atualizar senha');
                    return;
                }
            }

            // Recarregar dados atualizados (com retry)
            let updatedUser = await getUserByUsername(finalUsername);
            if (!updatedUser) {
                // Tentar novamente após um pequeno delay
                await new Promise(resolve => setTimeout(resolve, 200));
                updatedUser = await getUserByUsername(finalUsername);
                if (!updatedUser) {
                    showError('Erro ao recarregar dados do usuário. Tente fazer login novamente.');
                    return;
                }
            }

            // Atualizar estado local
            setAdminCredentialsData(prev => ({
                ...prev,
                [userType]: {
                    username: updatedUser.username || userType,
                    password: '',
                    confirmPassword: '',
                },
            }));

            // Se o usuário atual foi alterado, atualizar o contexto e a sessão
            if (user.username === oldUsername) {
                setUser(updatedUser);
                // Atualizar sessão se o username mudou
                if (finalUsername !== oldUsername) {
                    const { saveLoginSession } = await import('../services/databaseService');
                    await saveLoginSession(finalUsername);
                }
            }

            showSuccess(`Credenciais de ${userType} atualizadas com sucesso!`);
            setEditingAdminCredentials(null);
        } catch (error: any) {
            console.error(`Erro ao atualizar credenciais de ${userType}:`, error);
            showError(error.message || `Erro ao atualizar credenciais de ${userType}`);
        }
    };

    const handleAdminCredentialsCancel = async (userType: string) => {
        setEditingAdminCredentials(null);
        // Recarregar dados originais
        try {
            // Tentar buscar pelo username atual do estado primeiro
            const currentUsername = adminCredentialsData[userType]?.username;
            let foundUser = null;
            
            if (currentUsername) {
                foundUser = await getUserByUsername(currentUsername);
            }
            
            // Se não encontrou, tentar pelo userType original
            if (!foundUser) {
                foundUser = await getUserByUsername(userType);
            }
            
            // Se ainda não encontrou, buscar todos os admins
            if (!foundUser) {
                const db = await import('../services/databaseService');
                const allAdmins = await db.getUsersByGymRole(user.gymId || 'default-gym', 'admin');
                if (userType === 'Administrador') {
                    foundUser = allAdmins.find((u: any) => u.username === 'Administrador') || allAdmins[0];
                } else {
                    foundUser = allAdmins.find((u: any) => u.username === 'Desenvolvedor') || allAdmins[1];
                }
            }
            
            if (foundUser) {
                setAdminCredentialsData(prev => ({
                    ...prev,
                    [userType]: {
                        username: foundUser.username || userType,
                        password: '',
                        confirmPassword: '',
                    },
                }));
            }
        } catch (error) {
            console.error(`Erro ao recarregar dados de ${userType}:`, error);
        }
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

                {/* Seção de Gerenciamento de Credenciais de Administrador e Desenvolvedor */}
                <Card>
                    <div className="p-4 sm:p-6 space-y-6">
                        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gerenciar Credenciais do Sistema</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Altere o usuário e senha do Administrador e Desenvolvedor
                            </p>
                        </div>

                        {/* Administrador */}
                        <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Administrador</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Usuário: {adminCredentialsData.Administrador?.username || 'Administrador'}
                                    </p>
                                </div>
                                {editingAdminCredentials !== 'Administrador' && (
                                    <Button onClick={() => setEditingAdminCredentials('Administrador')} size="sm">
                                        Editar
                                    </Button>
                                )}
                            </div>

                            {editingAdminCredentials === 'Administrador' && (
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome de Usuário
                                        </label>
                                        <input
                                            type="text"
                                            value={adminCredentialsData.Administrador?.username || 'Administrador'}
                                            onChange={(e) => handleAdminCredentialsChange('Administrador', 'username', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nova Senha (deixe em branco para não alterar)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showAdminPassword['Administrador'] ? 'text' : 'password'}
                                                value={adminCredentialsData.Administrador?.password || ''}
                                                onChange={(e) => handleAdminCredentialsChange('Administrador', 'password', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminPassword(prev => ({ ...prev, Administrador: !prev['Administrador'] }))}
                                                className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {showAdminPassword['Administrador'] ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>
                                    {adminCredentialsData.Administrador?.password && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showAdminPassword['Administrador'] ? 'text' : 'password'}
                                                    value={adminCredentialsData.Administrador?.confirmPassword || ''}
                                                    onChange={(e) => handleAdminCredentialsChange('Administrador', 'confirmPassword', e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdminPassword(prev => ({ ...prev, Administrador: !prev['Administrador'] }))}
                                                    className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    {showAdminPassword['Administrador'] ? '👁️' : '👁️‍🗨️'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <Button variant="secondary" onClick={() => handleAdminCredentialsCancel('Administrador')} size="sm">
                                            Cancelar
                                        </Button>
                                        <Button onClick={() => handleAdminCredentialsSave('Administrador')} size="sm">
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desenvolvedor */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Desenvolvedor</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Usuário: {adminCredentialsData.Desenvolvedor?.username || 'Desenvolvedor'}
                                    </p>
                                </div>
                                {editingAdminCredentials !== 'Desenvolvedor' && (
                                    <Button onClick={() => setEditingAdminCredentials('Desenvolvedor')} size="sm">
                                        Editar
                                    </Button>
                                )}
                            </div>

                            {editingAdminCredentials === 'Desenvolvedor' && (
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome de Usuário
                                        </label>
                                        <input
                                            type="text"
                                            value={adminCredentialsData.Desenvolvedor?.username || 'Desenvolvedor'}
                                            onChange={(e) => handleAdminCredentialsChange('Desenvolvedor', 'username', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nova Senha (deixe em branco para não alterar)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showAdminPassword['Desenvolvedor'] ? 'text' : 'password'}
                                                value={adminCredentialsData.Desenvolvedor?.password || ''}
                                                onChange={(e) => handleAdminCredentialsChange('Desenvolvedor', 'password', e.target.value)}
                                                className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminPassword(prev => ({ ...prev, Desenvolvedor: !prev['Desenvolvedor'] }))}
                                                className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {showAdminPassword['Desenvolvedor'] ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>
                                    {adminCredentialsData.Desenvolvedor?.password && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showAdminPassword['Desenvolvedor'] ? 'text' : 'password'}
                                                    value={adminCredentialsData.Desenvolvedor?.confirmPassword || ''}
                                                    onChange={(e) => handleAdminCredentialsChange('Desenvolvedor', 'confirmPassword', e.target.value)}
                                                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdminPassword(prev => ({ ...prev, Desenvolvedor: !prev['Desenvolvedor'] }))}
                                                    className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                >
                                                    {showAdminPassword['Desenvolvedor'] ? '👁️' : '👁️‍🗨️'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <Button variant="secondary" onClick={() => handleAdminCredentialsCancel('Desenvolvedor')} size="sm">
                                            Cancelar
                                        </Button>
                                        <Button onClick={() => handleAdminCredentialsSave('Desenvolvedor')} size="sm">
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

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
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nome:</span>
                                        <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700">
                                            {user.nome || 'Não informado'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Usuário:</span>
                                        <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700">
                                            {user.username || 'Não informado'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Senha:</span>
                                        <p className="text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                                            ••••••••
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            A senha não pode ser exibida por questões de segurança. Use o botão "Editar" para alterá-la.
                                        </p>
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
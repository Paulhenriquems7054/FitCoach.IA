/**
 * Página de Gerenciamento de Alunos
 * Permite criar, editar, excluir e gerenciar alunos e treinadores
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { useUser } from '../context/UserContext';
import { usePermissions } from '../hooks/usePermissions';
import {
    createStudent,
    createTrainer,
    updateStudent,
    deleteStudent,
    getAllStudents,
    getAllTrainers,
    blockStudentAccess,
    unblockStudentAccess,
} from '../services/studentManagementService';
import type { User } from '../types';
import { Goal } from '../types';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';

const StudentManagementPage: React.FC = () => {
    const { user: currentUser } = useUser();
    const { showSuccess, showError } = useToast();
    const permissions = usePermissions();
    const [students, setStudents] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showTrainerForm, setShowTrainerForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [studentForm, setStudentForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nome: '',
        idade: 30,
        genero: 'Masculino' as 'Masculino' | 'Feminino',
        peso: 70,
        altura: 170,
        objetivo: Goal.MANTER_PESO,
    });

    const [trainerForm, setTrainerForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nome: '',
        idade: 30,
        genero: 'Masculino' as 'Masculino' | 'Feminino',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        // Se for Administrador ou Desenvolvedor padrão, pode ver todos os usuários
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        if (!currentUser.gymId && !isDefaultAdmin) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            
            if (isDefaultAdmin) {
                // Para Administrador/Desenvolvedor padrão, usar gymId padrão
                const defaultGymId = 'default-gym';
                const [studentsData, trainersData] = await Promise.all([
                    getAllStudents(defaultGymId),
                    getAllTrainers(defaultGymId),
                ]);
                setStudents(studentsData);
                setTrainers(trainersData);
            } else {
                const [studentsData, trainersData] = await Promise.all([
                    getAllStudents(currentUser.gymId!),
                    getAllTrainers(currentUser.gymId!),
                ]);
                setStudents(studentsData);
                setTrainers(trainersData);
            }
        } catch (error) {
            showError('Erro ao carregar usuários');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStudentForm((prev) => ({
            ...prev,
            [name]: name === 'idade' || name === 'peso' || name === 'altura' ? Number(value) || 0 : value,
        }));
    };

    const handleTrainerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTrainerForm((prev) => ({
            ...prev,
            [name]: name === 'idade' ? Number(value) || 0 : value,
        }));
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!currentUser.gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão ou criar um
        const gymId = currentUser.gymId || 'default-gym';

        if (studentForm.password !== studentForm.confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }

        if (studentForm.password.length < 4) {
            showError('A senha deve ter pelo menos 4 caracteres');
            return;
        }

        try {
            await createStudent(
                studentForm.username,
                studentForm.password,
                {
                    nome: studentForm.nome,
                    idade: studentForm.idade,
                    genero: studentForm.genero,
                    peso: studentForm.peso,
                    altura: studentForm.altura,
                    objetivo: studentForm.objetivo,
                },
                gymId
            );

            showSuccess('Aluno criado com sucesso!');
            setShowStudentForm(false);
            setStudentForm({
                username: '',
                password: '',
                confirmPassword: '',
                nome: '',
                idade: 30,
                genero: 'Masculino',
                peso: 70,
                altura: 170,
                objetivo: Goal.MANTER_PESO,
            });
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao criar aluno');
        }
    };

    const handleCreateTrainer = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!currentUser.gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão ou criar um
        const gymId = currentUser.gymId || 'default-gym';

        if (trainerForm.password !== trainerForm.confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }

        if (trainerForm.password.length < 4) {
            showError('A senha deve ter pelo menos 4 caracteres');
            return;
        }

        try {
            await createTrainer(
                trainerForm.username,
                trainerForm.password,
                {
                    nome: trainerForm.nome,
                    idade: trainerForm.idade,
                    genero: trainerForm.genero,
                },
                gymId
            );

            showSuccess('Treinador criado com sucesso!');
            setShowTrainerForm(false);
            setTrainerForm({
                username: '',
                password: '',
                confirmPassword: '',
                nome: '',
                idade: 30,
                genero: 'Masculino',
            });
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao criar treinador');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        if (user.gymRole === 'student') {
            setStudentForm({
                username: user.username || '',
                password: '',
                confirmPassword: '',
                nome: user.nome,
                idade: user.idade,
                genero: user.genero,
                peso: user.peso,
                altura: user.altura,
                objetivo: user.objetivo,
            });
            setShowStudentForm(true);
        }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            await updateStudent(editingUser.username || '', {
                nome: studentForm.nome,
                idade: studentForm.idade,
                genero: studentForm.genero,
                peso: studentForm.peso,
                altura: studentForm.altura,
                objetivo: studentForm.objetivo,
            });

            showSuccess('Aluno atualizado com sucesso!');
            setEditingUser(null);
            setShowStudentForm(false);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao atualizar aluno');
        }
    };

    const handleDeleteUser = async (username: string, userType: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir este ${userType}?`)) {
            return;
        }

        try {
            await deleteStudent(username);
            showSuccess(`${userType} excluído com sucesso!`);
            loadUsers();
        } catch (error: any) {
            showError(error.message || `Erro ao excluir ${userType}`);
        }
    };

    const handleBlockStudent = async (student: User) => {
        if (!window.confirm(`Tem certeza que deseja bloquear o acesso do aluno ${student.nome}?`)) {
            return;
        }

        try {
            const reason = prompt('Motivo do bloqueio (opcional):') || undefined;
            await blockStudentAccess(
                student.username || '',
                currentUser.username || 'Admin',
                reason
            );
            showSuccess(`Acesso do aluno ${student.nome} bloqueado com sucesso!`);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao bloquear acesso do aluno');
        }
    };

    const handleUnblockStudent = async (student: User) => {
        if (!window.confirm(`Tem certeza que deseja desbloquear o acesso do aluno ${student.nome}?`)) {
            return;
        }

        try {
            await unblockStudentAccess(
                student.username || '',
                currentUser.username || 'Admin'
            );
            showSuccess(`Acesso do aluno ${student.nome} desbloqueado com sucesso!`);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao desbloquear acesso do aluno');
        }
    };

    const parseFileContent = async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const fileName = file.name.toLowerCase();
                    
                    // Tentar parsear como JSON
                    if (fileName.endsWith('.json')) {
                        const data = JSON.parse(content);
                        resolve(Array.isArray(data) ? data : [data]);
                        return;
                    }
                    
                    // Tentar parsear como CSV
                    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
                        const lines = content.split('\n').filter(line => line.trim());
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        const data = lines.slice(1).map(line => {
                            const values = line.split(',').map(v => v.trim());
                            const obj: any = {};
                            headers.forEach((header, index) => {
                                obj[header] = values[index] || '';
                            });
                            return obj;
                        });
                        resolve(data);
                        return;
                    }
                    
                    // Para outros tipos de arquivo, tentar parsear como texto estruturado
                    // Formato esperado: uma linha por aluno, campos separados por vírgula, ponto e vírgula ou tab
                    const lines = content.split('\n').filter(line => line.trim());
                    const data = lines.map((line, index) => {
                        // Tentar diferentes separadores
                        const separators = [',', ';', '\t', '|'];
                        let values: string[] = [];
                        
                        for (const sep of separators) {
                            if (line.includes(sep)) {
                                values = line.split(sep).map(v => v.trim());
                                break;
                            }
                        }
                        
                        // Se não encontrou separador, usar a linha inteira como nome
                        if (values.length === 0) {
                            values = [line.trim()];
                        }
                        
                        // Mapear para estrutura esperada
                        return {
                            nome: values[0] || `Aluno ${index + 1}`,
                            username: values[1] || values[0]?.toLowerCase().replace(/\s+/g, '') || `aluno${index + 1}`,
                            password: values[2] || '1234',
                            idade: parseInt(values[3]) || 30,
                            genero: values[4]?.toLowerCase().includes('f') ? 'Feminino' : 'Masculino',
                            peso: parseFloat(values[5]) || 70,
                            altura: parseFloat(values[6]) || 170,
                            objetivo: values[7] || Goal.MANTER_PESO,
                        };
                    });
                    
                    resolve(data);
                } catch (error) {
                    reject(new Error('Erro ao processar arquivo. Verifique o formato.'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo.'));
            };
            
            // Ler como texto para todos os tipos de arquivo
            reader.readAsText(file, 'UTF-8');
        });
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!currentUser.gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão ou criar um
        const gymId = currentUser.gymId || 'default-gym';

        setIsImporting(true);
        
        try {
            const studentsData = await parseFileContent(file);
            
            if (!studentsData || studentsData.length === 0) {
                showError('Nenhum dado encontrado no arquivo.');
                setIsImporting(false);
                return;
            }

            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            // Processar cada aluno
            for (const studentData of studentsData) {
                try {
                    // Validar dados mínimos
                    const username = studentData.username || studentData.nome?.toLowerCase().replace(/\s+/g, '') || `aluno${Date.now()}`;
                    const password = studentData.password || '1234';
                    const nome = studentData.nome || username;

                    // Verificar se o usuário já existe
                    const existingStudent = students.find(s => s.username === username);
                    if (existingStudent) {
                        errorCount++;
                        errors.push(`${nome} (${username}): Usuário já existe`);
                        continue;
                    }

                    // Criar aluno
                    await createStudent(
                        username,
                        password,
                        {
                            nome: nome,
                            idade: studentData.idade || 30,
                            genero: studentData.genero || 'Masculino',
                            peso: studentData.peso || 70,
                            altura: studentData.altura || 170,
                            objetivo: studentData.objetivo || Goal.MANTER_PESO,
                        },
                        gymId
                    );

                    successCount++;
                } catch (error: any) {
                    errorCount++;
                    errors.push(`${studentData.nome || 'Aluno desconhecido'}: ${error.message || 'Erro ao criar'}`);
                }
            }

            // Mostrar resultado
            if (successCount > 0) {
                showSuccess(`${successCount} aluno(s) importado(s) com sucesso!`);
            }
            
            if (errorCount > 0) {
                showError(`${errorCount} aluno(s) não puderam ser importados. ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`);
            }

            // Limpar input e recarregar lista
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao importar arquivo');
        } finally {
            setIsImporting(false);
        }
    };

    if (!permissions.canViewStudents) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert type="error" title="Acesso Negado">
                    Você não tem permissão para acessar esta página.
                </Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <div className="p-6 text-center">
                        <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Gerenciamento de Usuários
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Gerencie alunos e treinadores da academia
                </p>
            </div>

            {/* Botões de ação */}
            {permissions.canCreateStudents && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3 mb-4">
                        <Button
                            onClick={() => {
                                setShowStudentForm(!showStudentForm);
                                setShowTrainerForm(false);
                                setEditingUser(null);
                            }}
                            variant="primary"
                        >
                            {showStudentForm ? '❌ Cancelar' : '➕ Criar Aluno'}
                        </Button>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="secondary"
                            disabled={isImporting}
                        >
                            {isImporting ? '⏳ Importando...' : '📥 Importar Alunos'}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="*/*"
                            onChange={handleImportFile}
                            className="hidden"
                            aria-label="Importar lista de alunos"
                        />
                        {permissions.canCreateTrainers && (
                            <Button
                                onClick={() => {
                                    setShowTrainerForm(!showTrainerForm);
                                    setShowStudentForm(false);
                                    setEditingUser(null);
                                }}
                                variant="secondary"
                            >
                                {showTrainerForm ? '❌ Cancelar' : '👨‍🏫 Criar Treinador'}
                            </Button>
                        )}
                    </div>
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                <strong>💡 Dica de Importação:</strong> Você pode importar alunos de qualquer tipo de arquivo (CSV, TXT, JSON, Excel, etc.).
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>Formato recomendado:</strong> Nome, Username, Senha, Idade, Gênero, Peso, Altura, Objetivo (separados por vírgula, ponto e vírgula ou tab). 
                                Campos opcionais serão preenchidos com valores padrão.
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Formulário de criar/editar aluno */}
            {showStudentForm && permissions.canCreateStudents && (
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            {editingUser ? 'Editar Aluno' : 'Criar Novo Aluno'}
                        </h2>
                        <form onSubmit={editingUser ? handleUpdateStudent : handleCreateStudent} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome de Usuário *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={studentForm.username}
                                        onChange={handleStudentFormChange}
                                        disabled={!!editingUser}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={studentForm.nome}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Senha *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={studentForm.password}
                                                onChange={handleStudentFormChange}
                                                className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Confirmar Senha *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={studentForm.confirmPassword}
                                                onChange={handleStudentFormChange}
                                                className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-2 top-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            >
                                                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Idade
                                    </label>
                                    <input
                                        type="number"
                                        name="idade"
                                        value={studentForm.idade}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Gênero
                                    </label>
                                    <select
                                        name="genero"
                                        value={studentForm.genero}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Peso (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="peso"
                                        value={studentForm.peso}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Altura (cm)
                                    </label>
                                    <input
                                        type="number"
                                        name="altura"
                                        value={studentForm.altura}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Objetivo
                                    </label>
                                    <select
                                        name="objetivo"
                                        value={studentForm.objetivo}
                                        onChange={handleStudentFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value={Goal.PERDER_PESO}>Perder Peso</option>
                                        <option value={Goal.MANTER_PESO}>Manter Peso</option>
                                        <option value={Goal.GANHAR_MASSA}>Ganhar Massa</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" variant="primary">
                                    {editingUser ? '💾 Salvar Alterações' : '➕ Criar Aluno'}
                                </Button>
                                {editingUser && (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setEditingUser(null);
                                            setShowStudentForm(false);
                                        }}
                                        variant="secondary"
                                    >
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </Card>
            )}

            {/* Formulário de criar treinador */}
            {showTrainerForm && permissions.canCreateTrainers && (
                <Card className="mb-6">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Criar Novo Treinador
                        </h2>
                        <form onSubmit={handleCreateTrainer} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome de Usuário *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={trainerForm.username}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={trainerForm.nome}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Senha *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={trainerForm.password}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Senha *
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={trainerForm.confirmPassword}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Idade
                                    </label>
                                    <input
                                        type="number"
                                        name="idade"
                                        value={trainerForm.idade}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Gênero
                                    </label>
                                    <select
                                        name="genero"
                                        value={trainerForm.genero}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" variant="primary">
                                ➕ Criar Treinador
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Lista de Alunos */}
            <Card className="mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        Alunos ({students.length})
                    </h2>
                    {students.length === 0 ? (
                        <p className="text-slate-600 dark:text-slate-400">Nenhum aluno cadastrado ainda.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Username</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Idade</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Objetivo</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                        {(permissions.canEditStudents || permissions.canViewStudents) && (
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.username} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${student.accessBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                            <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">{student.nome}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{student.username}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{student.idade}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{student.objetivo}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {student.accessBlocked ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                        🔒 Bloqueado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        ✓ Ativo
                                                    </span>
                                                )}
                                            </td>
                                            {(permissions.canEditStudents || permissions.canViewStudents) && (
                                                <td className="py-3 px-4 text-sm text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {permissions.canEditStudents && (
                                                            <Button
                                                                onClick={() => handleEditUser(student)}
                                                                variant="secondary"
                                                                size="sm"
                                                            >
                                                                ✏️ Editar
                                                            </Button>
                                                        )}
                                                        {(permissions.canEditStudents || permissions.canViewStudents) && (
                                                            <>
                                                                {student.accessBlocked ? (
                                                                    <Button
                                                                        onClick={() => handleUnblockStudent(student)}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="text-green-600 hover:text-green-700 dark:text-green-400"
                                                                    >
                                                                        🔓 Desbloquear
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={() => handleBlockStudent(student)}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                                                    >
                                                                        🔒 Bloquear
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                        {permissions.canDeleteStudents && (
                                                            <Button
                                                                onClick={() => handleDeleteUser(student.username || '', 'aluno')}
                                                                variant="secondary"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                            >
                                                                🗑️ Excluir
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            {/* Lista de Treinadores */}
            {permissions.canCreateTrainers && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Treinadores ({trainers.length})
                        </h2>
                        {trainers.length === 0 ? (
                            <p className="text-slate-600 dark:text-slate-400">Nenhum treinador cadastrado ainda.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Username</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Idade</th>
                                            {permissions.canDeleteStudents && (
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trainers.map((trainer) => (
                                            <tr key={trainer.username} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">{trainer.nome}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{trainer.username}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{trainer.idade}</td>
                                                {permissions.canDeleteStudents && (
                                                    <td className="py-3 px-4 text-sm text-right">
                                                        <Button
                                                            onClick={() => handleDeleteUser(trainer.username || '', 'treinador')}
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                        >
                                                            🗑️ Excluir
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StudentManagementPage;


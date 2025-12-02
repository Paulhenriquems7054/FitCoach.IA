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
    createReceptionist,
    updateStudent,
    deleteStudent,
    getAllStudents,
    getAllTrainers,
    getAllReceptionists,
    blockStudentAccess,
    unblockStudentAccess,
} from '../services/studentManagementService';
import { resetPassword } from '../services/databaseService';
import type { User } from '../types';
import { Goal } from '../types';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { getCompanyByUserId, getCompanyLicenseStats, type Company } from '../services/companyService';
import { logger } from '../utils/logger';

const StudentManagementPage: React.FC = () => {
    const { user: currentUser } = useUser();
    const { showSuccess, showError } = useToast();
    const permissions = usePermissions();
    const [students, setStudents] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<User[]>([]);
    const [receptionists, setReceptionists] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showTrainerForm, setShowTrainerForm] = useState(false);
    const [showReceptionistForm, setShowReceptionistForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTrainerPassword, setShowTrainerPassword] = useState(false);
    const [showTrainerConfirmPassword, setShowTrainerConfirmPassword] = useState(false);
    const [showReceptionistPassword, setShowReceptionistPassword] = useState(false);
    const [showReceptionistConfirmPassword, setShowReceptionistConfirmPassword] = useState(false);
    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [studentToBlock, setStudentToBlock] = useState<User | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [company, setCompany] = useState<Company | null>(null);
    const [licenseStats, setLicenseStats] = useState<{
        total: number;
        active: number;
        revoked: number;
        expired: number;
        available: number;
        maxLicenses: number;
    } | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    const [studentForm, setStudentForm] = useState({
        nome: '',
        matricula: '',
        idade: 30,
        genero: 'Masculino' as 'Masculino' | 'Feminino',
    });

    const [trainerForm, setTrainerForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nome: '',
        idade: 30,
        genero: 'Masculino' as 'Masculino' | 'Feminino',
    });

    const [receptionistForm, setReceptionistForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nome: '',
        idade: 30,
        genero: 'Masculino' as 'Masculino' | 'Feminino',
    });

    // Carregar empresa e estatísticas de licenças
    useEffect(() => {
        const loadCompanyAndStats = async () => {
            if (!currentUser.id) return;
            
            setIsLoadingStats(true);
            try {
                const companyResult = await getCompanyByUserId(currentUser.id);
                if (companyResult.success && companyResult.company) {
                    setCompany(companyResult.company);
                    
                    // Carregar estatísticas de licenças
                    const stats = await getCompanyLicenseStats(companyResult.company.id);
                    setLicenseStats(stats);
                }
            } catch (error) {
                logger.error('Erro ao carregar empresa e estatísticas', 'StudentManagementPage', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        loadCompanyAndStats();
    }, [currentUser.id]);

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
                const [studentsData, trainersData, receptionistsData] = await Promise.all([
                    getAllStudents(defaultGymId),
                    getAllTrainers(defaultGymId),
                    getAllReceptionists(defaultGymId),
                ]);
                setStudents(studentsData);
                setTrainers(trainersData);
                setReceptionists(receptionistsData);
            } else {
                const [studentsData, trainersData, receptionistsData] = await Promise.all([
                    getAllStudents(currentUser.gymId!),
                    getAllTrainers(currentUser.gymId!),
                    getAllReceptionists(currentUser.gymId!),
                ]);
                setStudents(studentsData);
                setTrainers(trainersData);
                setReceptionists(receptionistsData);
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
            [name]: name === 'idade' ? Number(value) || 0 : value,
        }));
    };

    const handleTrainerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTrainerForm((prev) => ({
            ...prev,
            [name]: name === 'idade' ? Number(value) || 0 : value,
        }));
    };

    const handleReceptionistFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setReceptionistForm((prev) => ({
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

        if (!studentForm.nome.trim()) {
            showError('O nome do aluno é obrigatório');
            return;
        }

        if (!studentForm.matricula.trim()) {
            showError('A matrícula do aluno é obrigatória');
            return;
        }

        try {
            // Para alunos, username será o nome e senha será a matrícula
            await createStudent(
                studentForm.nome, // username = nome
                studentForm.matricula, // password = matrícula
                {
                    nome: studentForm.nome,
                    matricula: studentForm.matricula,
                    idade: studentForm.idade,
                    genero: studentForm.genero,
                    // Peso, altura e objetivo serão coletados na enquete
                },
                gymId
            );

            showSuccess('Aluno criado com sucesso!');
            setShowStudentForm(false);
            setStudentForm({
                nome: '',
                matricula: '',
                idade: 30,
                genero: 'Masculino',
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

    const handleCreateReceptionist = async (e: React.FormEvent) => {
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

        if (receptionistForm.password !== receptionistForm.confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }

        if (receptionistForm.password.length < 4) {
            showError('A senha deve ter pelo menos 4 caracteres');
            return;
        }

        try {
            await createReceptionist(
                receptionistForm.username,
                receptionistForm.password,
                {
                    nome: receptionistForm.nome,
                    idade: receptionistForm.idade,
                    genero: receptionistForm.genero,
                },
                gymId
            );

            showSuccess('Recepcionista criado com sucesso!');
            setShowReceptionistForm(false);
            setReceptionistForm({
                username: '',
                password: '',
                confirmPassword: '',
                nome: '',
                idade: 30,
                genero: 'Masculino',
            });
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao criar recepcionista');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        if (user.gymRole === 'student') {
            setStudentForm({
                nome: user.nome,
                matricula: user.matricula || '',
                idade: user.idade,
                genero: user.genero,
                // Peso, altura e objetivo não são editáveis aqui (coletados na enquete)
            });
            setShowStudentPassword(true); // Mostrar matrícula por padrão
            setShowStudentForm(false);
            setShowTrainerForm(false);
            setShowReceptionistForm(false);
        } else if (user.gymRole === 'trainer') {
            setTrainerForm({
                username: user.username || '',
                password: '',
                confirmPassword: '',
                nome: user.nome,
                idade: user.idade,
                genero: user.genero,
            });
            setShowTrainerForm(true);
            setShowStudentForm(false);
            setShowReceptionistForm(false);
        } else if (user.gymRole === 'receptionist') {
            setReceptionistForm({
                username: user.username || '',
                password: '',
                confirmPassword: '',
                nome: user.nome,
                idade: user.idade,
                genero: user.genero,
            });
            setShowReceptionistForm(true);
            setShowStudentForm(false);
            setShowTrainerForm(false);
        }
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            const username = editingUser.username || editingUser.nome || '';
            
            // Atualizar dados do aluno
            await updateStudent(username, {
                nome: studentForm.nome,
                matricula: studentForm.matricula,
                idade: studentForm.idade,
                genero: studentForm.genero,
                // Peso, altura e objetivo não são editáveis aqui (coletados na enquete)
            });

            // Se a matrícula foi alterada, atualizar a senha também
            if (studentForm.matricula && studentForm.matricula.trim() !== '') {
                await resetPassword(username, studentForm.matricula);
            }

            showSuccess('Aluno atualizado com sucesso!');
            setEditingUser(null);
            setShowStudentForm(false);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao atualizar aluno');
        }
    };

    const handleUpdateTrainer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            const username = editingUser.username || '';
            
            // Atualizar dados do treinador
            await updateStudent(username, {
                nome: trainerForm.nome,
                idade: trainerForm.idade,
                genero: trainerForm.genero,
            });

            // Se a senha foi fornecida, atualizar
            if (trainerForm.password && trainerForm.password.trim() !== '') {
                if (trainerForm.password !== trainerForm.confirmPassword) {
                    showError('As senhas não coincidem');
                    return;
                }
                if (trainerForm.password.length < 4) {
                    showError('A senha deve ter pelo menos 4 caracteres');
                    return;
                }
                await resetPassword(username, trainerForm.password);
            }

            showSuccess('Treinador atualizado com sucesso!');
            setEditingUser(null);
            setShowTrainerForm(false);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao atualizar treinador');
        }
    };

    const handleUpdateReceptionist = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            const username = editingUser.username || '';
            
            // Atualizar dados do recepcionista
            await updateStudent(username, {
                nome: receptionistForm.nome,
                idade: receptionistForm.idade,
                genero: receptionistForm.genero,
            });

            // Se a senha foi fornecida, atualizar
            if (receptionistForm.password && receptionistForm.password.trim() !== '') {
                if (receptionistForm.password !== receptionistForm.confirmPassword) {
                    showError('As senhas não coincidem');
                    return;
                }
                if (receptionistForm.password.length < 4) {
                    showError('A senha deve ter pelo menos 4 caracteres');
                    return;
                }
                await resetPassword(username, receptionistForm.password);
            }

            showSuccess('Recepcionista atualizado com sucesso!');
            setEditingUser(null);
            setShowReceptionistForm(false);
            loadUsers();
        } catch (error: any) {
            showError(error.message || 'Erro ao atualizar recepcionista');
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

    const handleBlockStudent = (student: User) => {
        if (!student.username) {
            showError('Nome de usuário do aluno não encontrado');
            return;
        }
        setStudentToBlock(student);
        setBlockReason('');
        setShowBlockModal(true);
    };

    const confirmBlockStudent = async () => {
        if (!studentToBlock || !studentToBlock.username) {
            return;
        }

        try {
            const blockedBy = currentUser.username || 'Admin';
            
            await blockStudentAccess(
                studentToBlock.username,
                blockedBy,
                blockReason.trim() || undefined
            );
            
            showSuccess(`Acesso do aluno ${studentToBlock.nome} bloqueado com sucesso!`);
            setShowBlockModal(false);
            setStudentToBlock(null);
            setBlockReason('');
            await loadUsers();
        } catch (error: any) {
            console.error('Erro ao bloquear aluno:', error);
            showError(error.message || 'Erro ao bloquear acesso do aluno');
        }
    };

    const handleUnblockStudent = async (student: User) => {
        if (!student.username) {
            showError('Nome de usuário do aluno não encontrado');
            return;
        }

        // Usar confirm apenas para desbloquear (mais simples)
        const confirmed = window.confirm(`Tem certeza que deseja desbloquear o acesso do aluno ${student.nome}?`);
        if (!confirmed) {
            return;
        }

        try {
            const unblockedBy = currentUser.username || 'Admin';
            
            await unblockStudentAccess(
                student.username,
                unblockedBy
            );
            
            showSuccess(`Acesso do aluno ${student.nome} desbloqueado com sucesso!`);
            await loadUsers();
        } catch (error: any) {
            console.error('Erro ao desbloquear aluno:', error);
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
                        const arrayData = Array.isArray(data) ? data : [data];
                        // Garantir que nome e matrícula estejam mapeados corretamente
                        const processedData = arrayData.map((item: any, index: number) => {
                            const nome = item.nome || item.name || `Aluno ${index + 1}`;
                            const matricula = item.matricula || item.password || `MAT${index + 1}`;
                            return {
                                ...item,
                                nome: nome,
                                matricula: matricula,
                                username: nome, // Username será o nome
                                password: matricula, // Senha será a matrícula
                            };
                        });
                        resolve(processedData);
                        return;
                    }
                    
                    // Tentar parsear como CSV
                    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
                        const lines = content.split('\n').filter(line => line.trim());
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        const data = lines.slice(1).map((line, index) => {
                            const values = line.split(',').map(v => v.trim());
                            const obj: any = {};
                            headers.forEach((header, index) => {
                                obj[header] = values[index] || '';
                            });
                            
                            // Garantir que nome e matrícula estejam mapeados corretamente
                            const nome = obj.nome || obj.name || `Aluno ${index + 1}`;
                            const matricula = obj.matricula || obj.matricula || obj.password || `MAT${index + 1}`;
                            
                            return {
                                ...obj,
                                nome: nome,
                                matricula: matricula,
                                username: nome, // Username será o nome
                                password: matricula, // Senha será a matrícula
                            };
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
                        // Formato esperado: nome, matricula, idade, genero
                        const nome = values[0] || `Aluno ${index + 1}`;
                        const matricula = values[1] || `MAT${index + 1}`;
                        
                        return {
                            nome: nome,
                            matricula: matricula,
                            username: nome, // Username será o nome do aluno
                            password: matricula, // Senha será a matrícula
                            idade: parseInt(values[2]) || 30,
                            genero: values[3]?.toLowerCase().includes('f') ? 'Feminino' : 'Masculino',
                            // Peso, altura e objetivo serão coletados na enquete
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
                            // Peso, altura e objetivo serão coletados na enquete
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

            {/* Estatísticas de Licenças */}
            {company && licenseStats && (
                <Card className="mb-6">
                    <div className="p-4 sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            📊 Estatísticas de Licenças
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-200 dark:border-primary-800">
                                <div className="text-xs text-primary-600 dark:text-primary-400 mb-1">Total de Licenças</div>
                                <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                                    {licenseStats.maxLicenses}
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-xs text-green-600 dark:text-green-400 mb-1">Ativas</div>
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {licenseStats.active}
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Disponíveis</div>
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {licenseStats.available}
                                </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Uso</div>
                                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                    {licenseStats.maxLicenses > 0 
                                        ? Math.round((licenseStats.active / licenseStats.maxLicenses) * 100) 
                                        : 0}%
                                </div>
                            </div>
                        </div>
                        
                        {/* Barra de progresso */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                <span>Licenças em uso</span>
                                <span>{licenseStats.active} / {licenseStats.maxLicenses}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        licenseStats.available === 0 
                                            ? 'bg-red-500' 
                                            : licenseStats.available <= licenseStats.maxLicenses * 0.2
                                            ? 'bg-amber-500'
                                            : 'bg-primary-500'
                                    }`}
                                    style={{ 
                                        width: `${licenseStats.maxLicenses > 0 
                                            ? (licenseStats.active / licenseStats.maxLicenses) * 100 
                                            : 0}%` 
                                    }}
                                />
                            </div>
                        </div>

                        {/* Alerta quando próximo do limite */}
                        {licenseStats.available <= licenseStats.maxLicenses * 0.2 && licenseStats.available > 0 && (
                            <Alert type="warning" title="Atenção">
                                Você está usando {licenseStats.active} de {licenseStats.maxLicenses} licenças. 
                                Restam apenas {licenseStats.available} licenças disponíveis.
                            </Alert>
                        )}
                        {licenseStats.available === 0 && (
                            <Alert type="error" title="Limite Atingido">
                                Todas as {licenseStats.maxLicenses} licenças estão em uso. 
                                Considere fazer upgrade do plano para adicionar mais licenças.
                            </Alert>
                        )}
                    </div>
                </Card>
            )}

            {/* Botões de ação */}
            {permissions.canCreateStudents && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3 mb-4">
                        <Button
                            onClick={() => {
                                setShowStudentForm(!showStudentForm);
                                setShowTrainerForm(false);
                                setShowReceptionistForm(false);
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
                                    setShowReceptionistForm(false);
                                    setEditingUser(null);
                                }}
                                variant="secondary"
                            >
                                {showTrainerForm ? '❌ Cancelar' : '👨‍🏫 Criar Treinador'}
                            </Button>
                        )}
                        {permissions.canCreateTrainers && (
                            <Button
                                onClick={() => {
                                    setShowReceptionistForm(!showReceptionistForm);
                                    setShowStudentForm(false);
                                    setShowTrainerForm(false);
                                    setEditingUser(null);
                                }}
                                variant="secondary"
                            >
                                {showReceptionistForm ? '❌ Cancelar' : '👤 Criar Recepcionista'}
                            </Button>
                        )}
                    </div>
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                <strong>💡 Dica de Importação:</strong> Você pode importar alunos de qualquer tipo de arquivo (CSV, TXT, JSON, Excel, etc.).
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <strong>Formato recomendado:</strong> Nome, Matrícula, Idade, Gênero (separados por vírgula, ponto e vírgula ou tab). 
                                <br />
                                <strong>Login:</strong> O aluno fará login usando o <strong>Nome</strong> como usuário e a <strong>Matrícula</strong> como senha.
                                <br />
                                <strong>Dados adicionais:</strong> Peso, altura e objetivo serão coletados na enquete após o primeiro login.
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Formulário de criar aluno (no topo) */}
            {showStudentForm && permissions.canCreateStudents && !editingUser && (
                <Card className="mb-6" data-student-form>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Criar Novo Aluno
                        </h2>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        placeholder="Nome do aluno (será usado para login)"
                                    />
                                    {!editingUser && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            O nome será usado como usuário para login
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Matrícula *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showStudentPassword ? 'text' : 'password'}
                                            name="matricula"
                                            value={studentForm.matricula}
                                            onChange={handleStudentFormChange}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                            placeholder="Matrícula do aluno"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showStudentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showStudentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        A matrícula será usada como senha para login
                                    </p>
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

                            <Button type="submit" variant="primary">
                                ➕ Criar Aluno
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Formulário de criar recepcionista (no topo) */}
            {showReceptionistForm && permissions.canCreateTrainers && !editingUser && (
                <Card className="mb-6" data-receptionist-form>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Criar Novo Recepcionista
                        </h2>
                        <form onSubmit={editingUser && editingUser.gymRole === 'receptionist' ? handleUpdateReceptionist : handleCreateReceptionist} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome de Usuário *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={receptionistForm.username}
                                        onChange={handleReceptionistFormChange}
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
                                        value={receptionistForm.nome}
                                        onChange={handleReceptionistFormChange}
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
                                    <div className="relative">
                                        <input
                                            type={showReceptionistPassword ? 'text' : 'password'}
                                            name="password"
                                            value={receptionistForm.password}
                                            onChange={handleReceptionistFormChange}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowReceptionistPassword(!showReceptionistPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showReceptionistPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showReceptionistPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showReceptionistConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={receptionistForm.confirmPassword}
                                            onChange={handleReceptionistFormChange}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowReceptionistConfirmPassword(!showReceptionistConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showReceptionistConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showReceptionistConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
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
                                        value={receptionistForm.idade}
                                        onChange={handleReceptionistFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Gênero
                                    </label>
                                    <select
                                        name="genero"
                                        value={receptionistForm.genero}
                                        onChange={handleReceptionistFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" variant="primary">
                                ➕ Criar Recepcionista
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Formulário de criar treinador (no topo) */}
            {showTrainerForm && permissions.canCreateTrainers && !editingUser && (
                <Card className="mb-6" data-trainer-form>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Criar Novo Treinador
                        </h2>
                        <form onSubmit={handleCreateTrainer} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome de Usuário {editingUser && editingUser.gymRole === 'trainer' ? '' : '*'}
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={trainerForm.username}
                                        onChange={handleTrainerFormChange}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required={!editingUser || editingUser.gymRole !== 'trainer'}
                                        disabled={editingUser && editingUser.gymRole === 'trainer'}
                                    />
                                    {editingUser && editingUser.gymRole === 'trainer' && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            O nome de usuário não pode ser alterado
                                        </p>
                                    )}
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
                                    <div className="relative">
                                        <input
                                            type={showTrainerPassword ? 'text' : 'password'}
                                            name="password"
                                            value={trainerForm.password}
                                            onChange={handleTrainerFormChange}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowTrainerPassword(!showTrainerPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showTrainerPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showTrainerPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Confirmar Senha *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showTrainerConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={trainerForm.confirmPassword}
                                            onChange={handleTrainerFormChange}
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowTrainerConfirmPassword(!showTrainerConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showTrainerConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showTrainerConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
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
                    
                    {/* Formulário de editar aluno (aparece abaixo da tabela) */}
                    {editingUser && editingUser.gymRole === 'student' && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Editar Aluno
                            </h3>
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Matrícula (Senha)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="matricula"
                                                value={studentForm.matricula}
                                                onChange={handleStudentFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Matrícula do aluno"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Matrícula atual do aluno. Altere para modificar a senha.
                                        </p>
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

                                <div className="flex gap-3">
                                    <Button type="submit" variant="primary">
                                        💾 Salvar Alterações
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setEditingUser(null);
                                        }}
                                        variant="secondary"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </Card>

            {/* Lista de Treinadores */}
            {permissions.canCreateTrainers && (
                <Card className="mb-6">
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
                                            {(permissions.canEditStudents || permissions.canDeleteStudents) && (
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
                                                {(permissions.canEditStudents || permissions.canDeleteStudents) && (
                                                    <td className="py-3 px-4 text-sm text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {permissions.canEditStudents && (
                                                                <Button
                                                                    onClick={() => handleEditUser(trainer)}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                >
                                                                    ✏️ Editar
                                                                </Button>
                                                            )}
                                                            {permissions.canDeleteStudents && (
                                                                <Button
                                                                    onClick={() => handleDeleteUser(trainer.username || '', 'treinador')}
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
                        
                        {/* Formulário de editar treinador (aparece abaixo da tabela) */}
                        {editingUser && editingUser.gymRole === 'trainer' && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    Editar Treinador
                                </h3>
                                <form onSubmit={handleUpdateTrainer} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nome de Usuário
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={trainerForm.username}
                                                onChange={handleTrainerFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                disabled
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                O nome de usuário não pode ser alterado
                                            </p>
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
                                                Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showTrainerPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={trainerForm.password}
                                                    onChange={handleTrainerFormChange}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Deixe em branco para manter a senha atual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTrainerPassword(!showTrainerPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                    aria-label={showTrainerPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showTrainerPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showTrainerConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    value={trainerForm.confirmPassword}
                                                    onChange={handleTrainerFormChange}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    required={trainerForm.password.trim() !== ''}
                                                    placeholder="Deixe em branco para manter a senha atual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTrainerConfirmPassword(!showTrainerConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                    aria-label={showTrainerConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showTrainerConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
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

                                    <div className="flex gap-3">
                                        <Button type="submit" variant="primary">
                                            💾 Salvar Alterações
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setEditingUser(null);
                                            }}
                                            variant="secondary"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Lista de Recepcionistas */}
            {permissions.canCreateTrainers && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Recepcionistas ({receptionists.length})
                        </h2>
                        {receptionists.length === 0 ? (
                            <p className="text-slate-600 dark:text-slate-400">Nenhum recepcionista cadastrado ainda.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Nome</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Username</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Idade</th>
                                            {(permissions.canEditStudents || permissions.canDeleteStudents) && (
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ações</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receptionists.map((receptionist) => (
                                            <tr key={receptionist.username} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">{receptionist.nome}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{receptionist.username}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{receptionist.idade}</td>
                                                {(permissions.canEditStudents || permissions.canDeleteStudents) && (
                                                    <td className="py-3 px-4 text-sm text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {permissions.canEditStudents && (
                                                                <Button
                                                                    onClick={() => handleEditUser(receptionist)}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                >
                                                                    ✏️ Editar
                                                                </Button>
                                                            )}
                                                            {permissions.canDeleteStudents && (
                                                                <Button
                                                                    onClick={() => handleDeleteUser(receptionist.username || '', 'recepcionista')}
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
                        
                        {/* Formulário de editar recepcionista (aparece abaixo da tabela) */}
                        {editingUser && editingUser.gymRole === 'receptionist' && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    Editar Recepcionista
                                </h3>
                                <form onSubmit={handleUpdateReceptionist} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nome de Usuário
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={receptionistForm.username}
                                                onChange={handleReceptionistFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                disabled
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                O nome de usuário não pode ser alterado
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nome Completo *
                                            </label>
                                            <input
                                                type="text"
                                                name="nome"
                                                value={receptionistForm.nome}
                                                onChange={handleReceptionistFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showReceptionistPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={receptionistForm.password}
                                                    onChange={handleReceptionistFormChange}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Deixe em branco para manter a senha atual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReceptionistPassword(!showReceptionistPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                    aria-label={showReceptionistPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showReceptionistPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showReceptionistConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    value={receptionistForm.confirmPassword}
                                                    onChange={handleReceptionistFormChange}
                                                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    required={receptionistForm.password.trim() !== ''}
                                                    placeholder="Deixe em branco para manter a senha atual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReceptionistConfirmPassword(!showReceptionistConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                                    aria-label={showReceptionistConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showReceptionistConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                            </div>
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
                                                value={receptionistForm.idade}
                                                onChange={handleReceptionistFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Gênero
                                            </label>
                                            <select
                                                name="genero"
                                                value={receptionistForm.genero}
                                                onChange={handleReceptionistFormChange}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button type="submit" variant="primary">
                                            💾 Salvar Alterações
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setEditingUser(null);
                                            }}
                                            variant="secondary"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Modal de Bloqueio */}
            {showBlockModal && studentToBlock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Bloquear Acesso do Aluno
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Tem certeza que deseja bloquear o acesso do aluno <strong>{studentToBlock.nome}</strong>?
                            </p>
                            <div className="mb-4">
                                <label htmlFor="block-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Motivo do bloqueio (opcional)
                                </label>
                                <textarea
                                    id="block-reason"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="Digite o motivo do bloqueio..."
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowBlockModal(false);
                                        setStudentToBlock(null);
                                        setBlockReason('');
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmBlockStudent}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    🔒 Bloquear
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StudentManagementPage;


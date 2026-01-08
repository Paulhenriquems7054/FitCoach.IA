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
import { createInvite, getInviteUsageHistory, type InviteUsageHistory } from '../services/inviteService';
import { logger } from '../utils/logger';
import { getAccountType } from '../utils/accountType';
import { getPersonalTrainerClients, getPersonalTrainerActivationCode, getPersonalTrainerStats, type PersonalTrainerClient } from '../services/personalTrainerService';
import { loadGymConfig } from '../services/gymConfigService';

const StudentManagementPage: React.FC = () => {
    const { user: currentUser } = useUser();
    const { showSuccess, showError, showWarning } = useToast();
    const permissions = usePermissions();
    const accountType = getAccountType(currentUser);
    const mountedRef = useRef(true);
    const [students, setStudents] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<User[]>([]);
    const [receptionists, setReceptionists] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    
    // Estados para personal trainers
    const [clients, setClients] = useState<PersonalTrainerClient[]>([]);
    const [activationCode, setActivationCode] = useState<string | null>(null);
    const [personalStats, setPersonalStats] = useState<{
        totalClients: number;
        activeClients: number;
        totalWeightLoss: number;
        averageWeightLoss: number;
        clientsWithProgress: number;
    } | null>(null);
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
    // Convites B2B2C (alunos/personal)
    const [inviteStudentLink, setInviteStudentLink] = useState<string | null>(null);
    const [invitePersonalLink, setInvitePersonalLink] = useState<string | null>(null);
    const [inviteUsageHistory, setInviteUsageHistory] = useState<InviteUsageHistory[]>([]);
    const [showInviteHistory, setShowInviteHistory] = useState(false);
    const [isLoadingInviteHistory, setIsLoadingInviteHistory] = useState(false);

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
        mountedRef.current = true;
        loadUsers();
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Função helper para obter gymId (tenta do user, senão busca da academia salva)
    const getGymId = (): string | null => {
        // Se o usuário tem gymId, usar ele
        if (currentUser.gymId) {
            return currentUser.gymId;
        }
        
        // Se não tem, tentar buscar da academia salva no localStorage
        const savedGym = loadGymConfig();
        if (savedGym && savedGym.id) {
            logger.info(`Usando gymId da academia salva: ${savedGym.id}`, 'StudentManagementPage');
            return savedGym.id;
        }
        
        return null;
    };

    const loadUsers = async () => {
        // Se for Administrador ou Desenvolvedor padrão, pode ver todos os usuários
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Tentar obter gymId (do user ou da academia salva)
        const gymId = getGymId();
        
        if (!gymId && !isDefaultAdmin) {
            if (mountedRef.current) {
                setIsLoading(false);
            }
            return;
        }

        try {
            if (mountedRef.current) {
                setIsLoading(true);
            }
            
            const gymIdToUse = isDefaultAdmin ? 'default-gym' : gymId!;
            const [studentsData, trainersData, receptionistsData] = await Promise.all([
                getAllStudents(gymIdToUse),
                getAllTrainers(gymIdToUse),
                getAllReceptionists(gymIdToUse),
            ]);
            if (mountedRef.current) {
                setStudents(studentsData);
                setTrainers(trainersData);
                setReceptionists(receptionistsData);
            }
        } catch (error) {
            logger.error('Erro ao carregar usuários', 'StudentManagementPage', error);
            if (mountedRef.current) {
                showError('Erro ao carregar usuários. Tente novamente.');
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
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
        
        if (!mountedRef.current) return;

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Tentar obter gymId (do user ou da academia salva)
        const gymId = getGymId();
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão, senão usar o gymId obtido
        const gymIdToUse = isDefaultAdmin ? 'default-gym' : gymId!;

        if (!studentForm.nome.trim()) {
            showError('O nome do aluno é obrigatório');
            return;
        }

        if (!studentForm.matricula.trim()) {
            showError('A matrícula do aluno é obrigatória');
            return;
        }

        // Validações adicionais
        if (studentForm.nome.length < 2) {
            showError('O nome deve ter pelo menos 2 caracteres');
            return;
        }

        if (studentForm.matricula.length < 2) {
            showError('A matrícula deve ter pelo menos 2 caracteres');
            return;
        }

        try {
            logger.info(`Criando aluno: ${studentForm.nome}`, 'StudentManagementPage');
            
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

            if (!mountedRef.current) return;

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
            logger.error('Erro ao criar aluno', 'StudentManagementPage', error);
            if (mountedRef.current) {
                showError(error.message || 'Erro ao criar aluno. Verifique se o nome já não está em uso.');
            }
        }
    };

    const handleCreateTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mountedRef.current) return;

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Tentar obter gymId (do user ou da academia salva)
        const gymId = getGymId();
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão, senão usar o gymId obtido
        const gymIdToUse = isDefaultAdmin ? 'default-gym' : gymId!;

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
                gymIdToUse
            );

            if (!mountedRef.current) return;

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
        
        if (!mountedRef.current) return;

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Tentar obter gymId (do user ou da academia salva)
        const gymId = getGymId();
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão, senão usar o gymId obtido
        const gymIdToUse = isDefaultAdmin ? 'default-gym' : gymId!;

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
                gymIdToUse
            );

            if (!mountedRef.current) return;

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

        if (!mountedRef.current) return;

        // Verificar se é Administrador ou Desenvolvedor padrão
        const isDefaultAdmin = currentUser.username === 'Administrador' || currentUser.username === 'Desenvolvedor';
        
        // Tentar obter gymId (do user ou da academia salva)
        const gymId = getGymId();
        
        // Se não tem gymId e não é admin padrão, precisa criar/associar uma academia primeiro
        if (!gymId && !isDefaultAdmin) {
            showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
            return;
        }
        
        // Para admin padrão, usar um gymId padrão, senão usar o gymId obtido
        const gymIdToUse = isDefaultAdmin ? 'default-gym' : gymId!;

        // Validação de tamanho do arquivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError('O arquivo é muito grande. Tamanho máximo: 5MB');
            return;
        }

        if (mountedRef.current) {
            setIsImporting(true);
        }
        
        try {
            logger.info(`Importando arquivo: ${file.name}`, 'StudentManagementPage');
            
            const studentsData = await parseFileContent(file);
            
            if (!mountedRef.current) return;
            
            if (!studentsData || studentsData.length === 0) {
                showError('Nenhum dado encontrado no arquivo. Verifique o formato.');
                setIsImporting(false);
                return;
            }

            // Limitar importação a 100 alunos por vez para evitar sobrecarga
            if (studentsData.length > 100) {
                showWarning(`O arquivo contém ${studentsData.length} alunos. Apenas os primeiros 100 serão importados.`);
            }

            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            // Processar cada aluno
            for (const studentData of studentsData.slice(0, 100)) {
                if (!mountedRef.current) break;
                
                try {
                    // Validar dados mínimos
                    const nome = studentData.nome || studentData.name || '';
                    const matricula = studentData.matricula || studentData.password || '';
                    
                    if (!nome.trim() || !matricula.trim()) {
                        errorCount++;
                        errors.push(`Linha inválida: Nome ou matrícula vazios`);
                        continue;
                    }

                    const username = nome.toLowerCase().replace(/\s+/g, '');

                    // Verificar se o usuário já existe
                    const existingStudent = students.find(s => s.username === username || s.nome === nome);
                    if (existingStudent) {
                        errorCount++;
                        errors.push(`${nome}: Usuário já existe`);
                        continue;
                    }

                    // Criar aluno
                    await createStudent(
                        nome,
                        matricula,
                        {
                            nome: nome,
                            matricula: matricula,
                            idade: studentData.idade || 30,
                            genero: studentData.genero || 'Masculino',
                            // Peso, altura e objetivo serão coletados na enquete
                        },
                        gymIdToUse
                    );

                    successCount++;
                } catch (error: any) {
                    errorCount++;
                    const studentName = studentData.nome || studentData.name || 'Aluno desconhecido';
                    errors.push(`${studentName}: ${error.message || 'Erro ao criar'}`);
                    logger.error(`Erro ao criar aluno durante importação: ${studentName}`, 'StudentManagementPage', error);
                }
            }

            if (!mountedRef.current) return;

            // Mostrar resultado
            if (successCount > 0) {
                showSuccess(`${successCount} aluno(s) importado(s) com sucesso!`);
            }
            
            if (errorCount > 0) {
                const errorPreview = errors.slice(0, 5).join('; ');
                const moreErrors = errors.length > 5 ? ` e mais ${errors.length - 5} erro(s)` : '';
                showWarning(`${errorCount} aluno(s) não puderam ser importados. ${errorPreview}${moreErrors}`);
            }

            // Limpar input e recarregar lista
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            loadUsers();
        } catch (error: any) {
            logger.error('Erro ao importar arquivo', 'StudentManagementPage', error);
            if (mountedRef.current) {
                showError(error.message || 'Erro ao importar arquivo. Verifique o formato do arquivo.');
            }
        } finally {
            if (mountedRef.current) {
                setIsImporting(false);
            }
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

    // Se for personal trainer, mostrar interface de gerenciamento de clientes
    if (accountType === 'USER_PERSONAL') {
        return (
            <div className="container mx-auto px-4 py-6 sm:py-8">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Gerenciar Clientes
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Gerencie seus clientes e acompanhe o progresso deles
                    </p>
                </div>

                {/* Código de Equipe */}
                {activationCode && (
                    <Card className="mb-6">
                        <div className="p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                🔑 Código de Equipe
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-2 border-primary-300 dark:border-primary-700">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Compartilhe este código com seus clientes</p>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                                        {activationCode}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(activationCode);
                                        showSuccess('Código copiado para a área de transferência!');
                                    }}
                                    variant="primary"
                                >
                                    📋 Copiar
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                                Seus clientes devem usar este código ao se cadastrar no app para ter acesso Premium gratuito.
                            </p>
                        </div>
                    </Card>
                )}

                {/* Estatísticas */}
                {personalStats && (
                    <Card className="mb-6">
                        <div className="p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                📊 Estatísticas
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-200 dark:border-primary-800">
                                    <div className="text-xs text-primary-600 dark:text-primary-400 mb-1">Total de Clientes</div>
                                    <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                                        {personalStats.totalClients}
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="text-xs text-green-600 dark:text-green-400 mb-1">Clientes Ativos</div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {personalStats.activeClients}
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Perda Total (kg)</div>
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {personalStats.totalWeightLoss.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Média por Cliente</div>
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                        {personalStats.averageWeightLoss.toFixed(1)} kg
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Lista de Clientes */}
                {isLoadingClients ? (
                    <Card>
                        <div className="p-6 text-center">
                            <p className="text-slate-600 dark:text-slate-400">Carregando clientes...</p>
                        </div>
                    </Card>
                ) : clients.length === 0 ? (
                    <Card>
                        <div className="p-6 text-center">
                            <p className="text-slate-600 dark:text-slate-400 mb-2">Nenhum cliente vinculado ainda.</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                Compartilhe seu código de equipe para que clientes possam se vincular.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="p-4 sm:p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                👥 Lista de Clientes
                            </h2>
                            <div className="space-y-3">
                                {clients.map(client => {
                                    const hasProgress = client.weightHistory && client.weightHistory.length > 1;
                                    const weightChange = hasProgress ? (() => {
                                        const sorted = [...client.weightHistory].sort((a, b) => 
                                            new Date(a.date).getTime() - new Date(b.date).getTime()
                                        );
                                        return sorted[0].weight - sorted[sorted.length - 1].weight;
                                    })() : 0;

                                    return (
                                        <div key={client.userId} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    {client.photoUrl ? (
                                                        <img src={client.photoUrl} alt={client.nome} className="w-12 h-12 rounded-full" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                                                {client.nome.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">{client.nome}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {client.peso} kg • {client.altura} cm • {client.objetivo}
                                                        </p>
                                                        {hasProgress && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="text-xs text-slate-600 dark:text-slate-400">Progresso:</span>
                                                                <span className={`text-sm font-semibold ${weightChange > 0 ? 'text-green-600 dark:text-green-400' : weightChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                    {weightChange > 0 ? '-' : weightChange < 0 ? '+' : ''}{Math.abs(weightChange).toFixed(1)} kg
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!hasProgress && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Aguardando primeiro registro de peso</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => window.location.hash = `/analysis?client=${client.userId}`}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    Ver Progresso
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // Interface padrão para academias
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

            {/* Método Principal: Convites */}
            {permissions.canCreateStudents && (currentUser?.gymId || getGymId()) && (
                <Card className="mb-6 bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 border-2 border-primary-200 dark:border-primary-800">
                    <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">📧</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Método Recomendado: Convites
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Gere links de convite para que alunos, treinadores e recepcionistas façam seu próprio cadastro. 
                                    <strong className="text-primary-600 dark:text-primary-400"> Recomendado para a maioria dos casos.</strong>
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={async () => {
                                            if (!mountedRef.current) return;
                                            try {
                                                const gymId = getGymId();
                                                if (!gymId) {
                                                    showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
                                                    return;
                                                }
                                                logger.info('Gerando convite para aluno', 'StudentManagementPage');
                                                const result = await createInvite(gymId, currentUser.id!, 'student');
                                                const link = `${window.location.origin}/#/login?invite=${result.code}`;
                                                if (mountedRef.current) {
                                                    setInviteStudentLink(link);
                                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                                        navigator.clipboard.writeText(link).catch(() => {});
                                                    }
                                                    showSuccess('Convite para aluno gerado! Link copiado para a área de transferência.');
                                                }
                                            } catch (error) {
                                                logger.error('Erro ao gerar convite de aluno', 'StudentManagementPage', error);
                                                if (mountedRef.current) {
                                                    showError('Erro ao gerar convite de aluno. Tente novamente.');
                                                }
                                            }
                                        }}
                                    >
                                        🔗 Gerar Convite Aluno
                                    </Button>
                                    {permissions.canCreateTrainers && (
                                        <Button
                                            variant="primary"
                                        onClick={async () => {
                                            if (!mountedRef.current) return;
                                            try {
                                                const gymId = getGymId();
                                                if (!gymId) {
                                                    showError('Você precisa estar associado a uma academia. Configure a academia primeiro em Configurações da Academia.');
                                                    return;
                                                }
                                                logger.info('Gerando convite para personal', 'StudentManagementPage');
                                                const result = await createInvite(gymId, currentUser.id!, 'personal');
                                                    const link = `${window.location.origin}/#/login?invite=${result.code}`;
                                                    if (mountedRef.current) {
                                                        setInvitePersonalLink(link);
                                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                                            navigator.clipboard.writeText(link).catch(() => {});
                                                        }
                                                        showSuccess('Convite para personal gerado! Link copiado para a área de transferência.');
                                                    }
                                                } catch (error) {
                                                    logger.error('Erro ao gerar convite de personal', 'StudentManagementPage', error);
                                                    if (mountedRef.current) {
                                                        showError('Erro ao gerar convite de personal. Tente novamente.');
                                                    }
                                                }
                                            }}
                                        >
                                            🧑‍🏫 Gerar Convite Personal
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(inviteStudentLink || invitePersonalLink) && (
                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700 space-y-3">
                                {inviteStudentLink && (
                                    <div>
                                        <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                                            ✅ Convite para Aluno gerado:
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="break-all text-sm text-emerald-800 dark:text-emerald-200 flex-1 bg-white dark:bg-slate-800 p-2 rounded border border-emerald-300 dark:border-emerald-600">
                                                {inviteStudentLink}
                                            </p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                                        navigator.clipboard.writeText(inviteStudentLink).then(() => {
                                                            showSuccess('Link copiado!');
                                                        }).catch(() => {});
                                                    }
                                                }}
                                            >
                                                📋 Copiar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {invitePersonalLink && (
                                    <div>
                                        <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                                            ✅ Convite para Personal gerado:
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="break-all text-sm text-emerald-800 dark:text-emerald-200 flex-1 bg-white dark:bg-slate-800 p-2 rounded border border-emerald-300 dark:border-emerald-600">
                                                {invitePersonalLink}
                                            </p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                                        navigator.clipboard.writeText(invitePersonalLink).then(() => {
                                                            showSuccess('Link copiado!');
                                                        }).catch(() => {});
                                                    }
                                                }}
                                            >
                                                📋 Copiar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                                    💬 Envie estes links por WhatsApp, e-mail ou mostre como QR Code para que alunos e profissionais se cadastrem já vinculados à sua academia.
                                </p>
                                {(currentUser.gymId || getGymId()) && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={async () => {
                                            if (!mountedRef.current) return;
                                            setIsLoadingInviteHistory(true);
                                            const newShowState = !showInviteHistory;
                                            setShowInviteHistory(newShowState);
                                            if (newShowState) {
                                                try {
                                                    const gymId = getGymId();
                                                    if (!gymId) {
                                                        showError('Você precisa estar associado a uma academia.');
                                                        setIsLoadingInviteHistory(false);
                                                        return;
                                                    }
                                                    const history = await getInviteUsageHistory(gymId);
                                                    if (mountedRef.current) {
                                                        setInviteUsageHistory(history);
                                                    }
                                                } catch (error) {
                                                    logger.error('Erro ao carregar histórico de convites', 'StudentManagementPage', error);
                                                    if (mountedRef.current) {
                                                        showError('Erro ao carregar histórico de convites.');
                                                    }
                                                }
                                            }
                                            if (mountedRef.current) {
                                                setIsLoadingInviteHistory(false);
                                            }
                                        }}
                                    >
                                        {isLoadingInviteHistory ? 'Carregando...' : showInviteHistory ? '🔒 Ocultar Histórico' : '📊 Ver Histórico de Uso'}
                                    </Button>
                                )}
                            </div>
                        )}
                        {/* Histórico de uso de convites */}
                        {showInviteHistory && inviteUsageHistory.length > 0 && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    📊 Histórico de Uso dos Convites
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="text-left bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">Usuário</th>
                                                <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                                                <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">Data/Hora</th>
                                                <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inviteUsageHistory.map((usage, index) => (
                                                <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                                                    <td className="p-2 text-slate-900 dark:text-white">
                                                        {usage.userName}
                                                        {usage.userEmail && (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 block">
                                                                {usage.userEmail}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            usage.role === 'student' 
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                        }`}>
                                                            {usage.role === 'student' ? 'Aluno' : 'Personal'}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-slate-700 dark:text-slate-300">
                                                        {new Date(usage.usedAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td className="p-2 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                                        {usage.ipAddress || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {showInviteHistory && inviteUsageHistory.length === 0 && !isLoadingInviteHistory && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                                <p className="text-slate-600 dark:text-slate-400">
                                    Nenhum uso de convite registrado ainda.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Método Alternativo: Criação Manual */}
            {permissions.canCreateStudents && (
                <Card className="mb-6 border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">⚙️</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Método Alternativo: Criação Manual
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Crie usuários diretamente. <strong className="text-amber-600 dark:text-amber-400">Use para casos especiais:</strong> importação em massa, 
                                    acesso imediato, ou funcionários internos.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            if (!mountedRef.current) return;
                                            setShowStudentForm(!showStudentForm);
                                            setShowTrainerForm(false);
                                            setShowReceptionistForm(false);
                                            setEditingUser(null);
                                        }}
                                    >
                                        {showStudentForm ? '❌ Cancelar' : '➕ Criar Aluno Manualmente'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            if (!mountedRef.current) return;
                                            fileInputRef.current?.click();
                                        }}
                                        disabled={isImporting}
                                    >
                                        {isImporting ? '⏳ Importando...' : '📥 Importar Alunos (CSV)'}
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
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    if (!mountedRef.current) return;
                                                    setShowTrainerForm(!showTrainerForm);
                                                    setShowStudentForm(false);
                                                    setShowReceptionistForm(false);
                                                    setEditingUser(null);
                                                }}
                                            >
                                                {showTrainerForm ? '❌ Cancelar' : '👨‍🏫 Criar Treinador'}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    if (!mountedRef.current) return;
                                                    setShowReceptionistForm(!showReceptionistForm);
                                                    setShowStudentForm(false);
                                                    setShowTrainerForm(false);
                                                    setEditingUser(null);
                                                }}
                                            >
                                                {showReceptionistForm ? '❌ Cancelar' : '👤 Criar Recepcionista'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
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
                            </div>
                        </div>
                    </div>
                </Card>
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
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">IA Status</th>
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
                                            <td className="py-3 px-4 text-sm">
                                                {(() => {
                                                    const aiStatus = student.aiSubscriptionStatus || 'none';
                                                    const trialEndAt = student.aiTrialEndAt;
                                                    const isTrialExpired = trialEndAt && new Date(trialEndAt) < new Date();
                                                    
                                                    if (aiStatus === 'active') {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                ✓ Ativo
                                                            </span>
                                                        );
                                                    } else if (aiStatus === 'trial' && !isTrialExpired) {
                                                        const daysLeft = trialEndAt 
                                                            ? Math.ceil((new Date(trialEndAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                                            : 0;
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                                🧪 Trial ({daysLeft}d)
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                                                                ⏸️ Inativo
                                                            </span>
                                                        );
                                                    }
                                                })()}
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


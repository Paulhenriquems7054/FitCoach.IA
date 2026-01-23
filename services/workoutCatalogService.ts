/**
 * Serviço para gerenciar catálogo de treinos pré-configurados
 */

import type { PreconfiguredWorkout, WorkoutCatalog, WorkoutFilters, WorkoutCategory } from '../types';
import { Goal } from '../types';
import { parseWorkoutText } from './workoutParser';
import { processPublicFile } from './workoutDocumentProcessor';
import { 
    saveWorkoutToCache, 
    getWorkoutFromCache, 
    clearWorkoutCache,
    initDatabase
} from './databaseService';
import { logger } from '../utils/logger';

// Lista de arquivos de treino disponíveis (todos convertidos para PDF)
// Arquivos duplicados removidos: CORPO INTEIRO (2).pdf, CORPO INTEIRO (3).pdf, TREINO-PARA-HOMEM-EMAGRECIMENTO-DEFINICAO(EDITAVEL)(1).pdf
const WORKOUT_FILES = [
    'CORPO INTEIRO.pdf',
    'TREINO CORPO INTEIRO.pdf',
    'TREINO--MES--SETE.pdf',
    'TREINO-HOMEM-HIPERTROFIA.pdf',
    'TREINO-MES-1-3-5-7-9-11.pdf',
    'TREINO-MES-1.pdf',
    'TREINO-MES-3.pdf',
    'TREINO-MES-5.pdf',
    'TREINO-MES-9.pdf',
    'TREINO-MES-11.pdf',
    'TREINO-MULHER-EMAGRECIMENTO-DEFINICAO(EDITAVEL).pdf',
    'TREINO-MULHER-HIPERTROFIA.pdf',
];

// Cache do catálogo
let catalogCache: WorkoutCatalog | null = null;

/**
 * Lista todos os arquivos de treino disponíveis
 */
export async function listAvailableWorkouts(): Promise<string[]> {
    return WORKOUT_FILES;
}

/**
 * Processa um documento de treino e retorna PreconfiguredWorkout
 * Usa cache quando disponível, senão processa o arquivo real
 */
export async function processWorkoutDocument(filename: string): Promise<PreconfiguredWorkout> {
    // Verificar cache primeiro (com tratamento de erro)
    try {
        // Garantir que o banco está inicializado
        await initDatabase();
        const cached = await getWorkoutFromCache(filename);
        if (cached) {
            logger.info(`Treino ${filename} carregado do cache`, 'workoutCatalogService');
            return cached as PreconfiguredWorkout;
        }
    } catch (cacheError) {
        logger.warn(`Erro ao verificar cache para ${filename}, processando arquivo`, 'workoutCatalogService', cacheError);
        // Continuar processamento mesmo se cache falhar
    }

    try {

        // Extrair informações do nome do arquivo
        const info = extractInfoFromFilename(filename);
        
        let textoExtraido = '';
        let plano;

        // Tentar processar arquivo real (com fallback para mock)
        try {
            textoExtraido = await processPublicFile(filename);
            if (textoExtraido && textoExtraido.trim().length > 0) {
                plano = parseWorkoutText(textoExtraido);
                logger.info(`Treino ${filename} processado do arquivo real`, 'workoutCatalogService');
            } else {
                // Texto vazio, usar dados mockados
                logger.warn(`Texto vazio para ${filename}, usando dados mockados`, 'workoutCatalogService');
                const mockText = generateMockWorkoutText(info);
                plano = parseWorkoutText(mockText);
            }
        } catch (error) {
            // Se falhar, usar dados mockados (sempre funciona)
            logger.warn(`Erro ao processar ${filename}, usando dados mockados`, 'workoutCatalogService');
            const mockText = generateMockWorkoutText(info);
            plano = parseWorkoutText(mockText);
        }

        const workout: PreconfiguredWorkout = {
            id: generateId(filename),
            nome: info.nome,
            categoria: info.categoria,
            objetivo: info.objetivo,
            genero: info.genero,
            nivel: info.nivel,
            duracao_semanas: info.duracao_semanas,
            mes: info.mes,
            arquivo_origem: filename,
            data_importacao: new Date().toISOString(),
            versao: 1,
            plano: plano,
            metadata: {
                descricao: `Treino ${info.nome} para ${info.objetivo.join(', ')}`,
                tags: [info.categoria, info.nivel, ...info.objetivo.map(o => o.toString())]
            }
        };

        // Salvar no cache
        try {
            await saveWorkoutToCache(filename, workout);
        } catch (cacheError) {
            logger.warn('Erro ao salvar no cache', 'workoutCatalogService', cacheError);
        }

        return workout;
    } catch (error) {
        // Se tudo falhar, criar treino básico baseado no nome do arquivo
        logger.error('Erro ao processar documento de treino', 'workoutCatalogService', error);
        
        // Extrair informações do nome do arquivo para criar treino básico
        const info = extractInfoFromFilename(filename);
        const mockText = generateMockWorkoutText(info);
        const plano = parseWorkoutText(mockText);
        
        const fallbackWorkout: PreconfiguredWorkout = {
            id: generateId(filename),
            nome: info.nome,
            categoria: info.categoria,
            objetivo: info.objetivo,
            genero: info.genero,
            nivel: info.nivel,
            duracao_semanas: info.duracao_semanas,
            mes: info.mes,
            arquivo_origem: filename,
            data_importacao: new Date().toISOString(),
            versao: 1,
            plano: plano,
            metadata: {
                descricao: `Treino ${info.nome} para ${info.objetivo.join(', ')}`,
                tags: [info.categoria, info.nivel, ...info.objetivo.map(o => o.toString())]
            }
        };
        
        // Tentar salvar no cache (mas não falhar se não conseguir)
        try {
            await initDatabase();
            await saveWorkoutToCache(filename, fallbackWorkout);
        } catch (cacheError) {
            logger.warn('Erro ao salvar fallback no cache', 'workoutCatalogService', cacheError);
        }
        
        return fallbackWorkout;
    }
}

/**
 * Constrói o catálogo completo de treinos
 */
export async function buildWorkoutCatalog(): Promise<WorkoutCatalog> {
    if (catalogCache) {
        return catalogCache;
    }

    try {
        const treinos: PreconfiguredWorkout[] = [];
        const files = await listAvailableWorkouts();

        // Processar cada arquivo com tratamento de erro individual
        for (const file of files) {
            try {
                const workout = await processWorkoutDocument(file);
                if (workout && workout.plano && workout.plano.plano_treino_semanal.length > 0) {
                    treinos.push(workout);
                }
            } catch (error) {
                logger.warn(`Erro ao processar ${file}, pulando arquivo`, 'workoutCatalogService', error);
                // Continuar processando outros arquivos mesmo se este falhar
            }
        }

        // Se não conseguiu processar nenhum treino, criar treinos padrão
        if (treinos.length === 0) {
            logger.warn('Nenhum treino foi processado, criando treinos padrão', 'workoutCatalogService');
            // Criar pelo menos um treino padrão para não retornar vazio
            const defaultWorkout: PreconfiguredWorkout = {
                id: 'default-corpo-inteiro',
                nome: 'Treino Corpo Inteiro',
                categoria: 'corpo-inteiro',
                objetivo: [Goal.GANHAR_MASSA, Goal.MANTER_PESO],
                genero: 'unisex',
                nivel: 'intermediario',
                arquivo_origem: 'default',
                data_importacao: new Date().toISOString(),
                versao: 1,
                plano: {
                    plano_treino_semanal: [
                        {
                            dia_semana: 'Segunda-feira',
                            foco_treino: 'Corpo Inteiro Superior',
                            exercicios: [
                                { name: 'Supino reto', sets: '4', reps: '8-10' },
                                { name: 'Remada curvada', sets: '4', reps: '8-10' },
                                { name: 'Desenvolvimento', sets: '3', reps: '10-12' }
                            ],
                            duracao_estimada: '60-75 minutos',
                            intensidade: 'alta'
                        },
                        {
                            dia_semana: 'Terça-feira',
                            foco_treino: 'Corpo Inteiro Inferior',
                            exercicios: [
                                { name: 'Agachamento', sets: '4', reps: '8-10' },
                                { name: 'Leg Press', sets: '3', reps: '12-15' },
                                { name: 'Panturrilha', sets: '4', reps: '15-20' }
                            ],
                            duracao_estimada: '60-75 minutos',
                            intensidade: 'alta'
                        },
                        {
                            dia_semana: 'Quarta-feira',
                            foco_treino: 'Descanso',
                            exercicios: [],
                            duracao_estimada: '0 minutos'
                        }
                    ],
                    recomendacoes_suplementos: [],
                    dicas_adicionais: 'Mantenha boa forma em todos os exercícios. Aumente a carga progressivamente.',
                    data_geracao: new Date().toISOString(),
                    versao: 1
                },
                metadata: {
                    descricao: 'Treino padrão de corpo inteiro',
                    tags: ['corpo-inteiro', 'intermediario']
                }
            };
            treinos.push(defaultWorkout);
        }

        // Organizar por filtros
        const filtros = {
            por_objetivo: {
                [Goal.PERDER_PESO]: treinos.filter(t => t.objetivo.includes(Goal.PERDER_PESO)),
                [Goal.MANTER_PESO]: treinos.filter(t => t.objetivo.includes(Goal.MANTER_PESO)),
                [Goal.GANHAR_MASSA]: treinos.filter(t => t.objetivo.includes(Goal.GANHAR_MASSA)),
            },
            por_genero: {
                'masculino': treinos.filter(t => !t.genero || t.genero === 'masculino' || t.genero === 'unisex'),
                'feminino': treinos.filter(t => !t.genero || t.genero === 'feminino' || t.genero === 'unisex'),
                'unisex': treinos.filter(t => !t.genero || t.genero === 'unisex'),
            },
            por_nivel: {
                'iniciante': treinos.filter(t => t.nivel === 'iniciante'),
                'intermediario': treinos.filter(t => t.nivel === 'intermediario'),
                'avancado': treinos.filter(t => t.nivel === 'avancado'),
            }
        };

        const categorias: WorkoutCategory[] = Array.from(new Set(treinos.map(t => t.categoria))) as WorkoutCategory[];

        catalogCache = {
            treinos,
            categorias,
            filtros
        };

        logger.info(`Catálogo construído com sucesso: ${treinos.length} treinos`, 'workoutCatalogService');
        return catalogCache;
    } catch (error) {
        logger.error('Erro ao construir catálogo', 'workoutCatalogService', error);
        // Retornar catálogo vazio ao invés de lançar erro
        return {
            treinos: [],
            categorias: [],
            filtros: {
                por_objetivo: {
                    [Goal.PERDER_PESO]: [],
                    [Goal.MANTER_PESO]: [],
                    [Goal.GANHAR_MASSA]: [],
                },
                por_genero: {
                    'masculino': [],
                    'feminino': [],
                    'unisex': [],
                },
                por_nivel: {
                    'iniciante': [],
                    'intermediario': [],
                    'avancado': [],
                }
            }
        };
    }
}

/**
 * Filtra treinos baseado nos filtros fornecidos
 */
export function filterWorkouts(
    treinos: PreconfiguredWorkout[],
    filters: WorkoutFilters
): PreconfiguredWorkout[] {
    let filtered = [...treinos];

    if (filters.categoria) {
        filtered = filtered.filter(t => t.categoria === filters.categoria);
    }

    if (filters.objetivo) {
        filtered = filtered.filter(t => t.objetivo.includes(filters.objetivo!));
    }

    if (filters.genero) {
        filtered = filtered.filter(t => 
            !t.genero || 
            t.genero === filters.genero || 
            t.genero === 'unisex'
        );
    }

    if (filters.nivel) {
        filtered = filtered.filter(t => t.nivel === filters.nivel);
    }

    if (filters.busca) {
        const buscaLower = filters.busca.toLowerCase();
        filtered = filtered.filter(t => 
            t.nome.toLowerCase().includes(buscaLower) ||
            t.categoria.toLowerCase().includes(buscaLower) ||
            t.metadata?.tags?.some(tag => tag.toLowerCase().includes(buscaLower))
        );
    }

    return filtered;
}

/**
 * Extrai informações do nome do arquivo
 */
function extractInfoFromFilename(filename: string): {
    nome: string;
    categoria: WorkoutCategory;
    objetivo: Goal[];
    genero?: 'masculino' | 'feminino' | 'unisex';
    nivel: 'iniciante' | 'intermediario' | 'avancado';
    duracao_semanas?: number;
    mes?: number;
} {
    const lower = filename.toLowerCase();
    
    // Categoria
    let categoria: WorkoutCategory = 'corpo-inteiro';
    if (lower.includes('hipertrofia')) categoria = 'hipertrofia';
    else if (lower.includes('emagrecimento') || lower.includes('emagrecer')) categoria = 'emagrecimento';
    else if (lower.includes('definicao') || lower.includes('definição')) categoria = 'definicao';
    else if (lower.includes('forca') || lower.includes('força')) categoria = 'forca';
    else if (lower.includes('resistencia') || lower.includes('resistência')) categoria = 'resistencia';
    else if (lower.includes('funcional')) categoria = 'funcional';
    else if (lower.includes('cardio')) categoria = 'cardio';

    // Objetivo
    const objetivo: Goal[] = [];
    if (lower.includes('hipertrofia') || lower.includes('massa')) {
        objetivo.push(Goal.GANHAR_MASSA);
    }
    if (lower.includes('emagrecimento') || lower.includes('emagrecer') || lower.includes('definicao')) {
        objetivo.push(Goal.PERDER_PESO);
    }
    if (objetivo.length === 0) {
        objetivo.push(Goal.GANHAR_MASSA, Goal.MANTER_PESO);
    }

    // Gênero
    let genero: 'masculino' | 'feminino' | 'unisex' | undefined;
    if (lower.includes('homem') || lower.includes('masculino')) genero = 'masculino';
    else if (lower.includes('mulher') || lower.includes('feminino')) genero = 'feminino';
    else genero = 'unisex';

    // Nível
    let nivel: 'iniciante' | 'intermediario' | 'avancado' = 'intermediario';
    if (lower.includes('iniciante') || lower.includes('basico')) nivel = 'iniciante';
    else if (lower.includes('avancado') || lower.includes('avançado') || lower.includes('pro')) nivel = 'avancado';

    // Mês
    const mesMatch = lower.match(/mes[-\s]*(\d+)/i);
    const mes = mesMatch ? parseInt(mesMatch[1]) : undefined;

    // Nome
    const nome = filename
        .replace(/\.(docx?|pdf)$/i, '')
        .replace(/\(EDITAVEL\)/i, '')
        .replace(/\((\d+)\)/g, '')
        .trim();

    return {
        nome,
        categoria,
        objetivo,
        genero,
        nivel,
        mes,
        duracao_semanas: mes ? undefined : 12
    };
}

/**
 * Gera ID único baseado no nome do arquivo
 */
function generateId(filename: string): string {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Gera texto mockado de treino (temporário até implementar processamento real)
 */
function generateMockWorkoutText(info: ReturnType<typeof extractInfoFromFilename>): string {
    const exerciciosBase = {
        'corpo-inteiro': [
            'Segunda-feira - Corpo Inteiro Superior\nSupino reto 4x8-10\nRemada curvada 4x8-10\nDesenvolvimento 3x10-12\nTríceps pulley 3x12',
            'Terça-feira - Corpo Inteiro Inferior\nAgachamento 4x8-10\nLeg Press 3x12-15\nExtensão de pernas 3x12\nPanturrilha 4x15-20',
            'Quarta-feira - Descanso',
            'Quinta-feira - Corpo Inteiro Superior\nSupino inclinado 4x8-10\nPuxada frontal 4x8-10\nElevação lateral 3x12\nRosca direta 3x12',
            'Sexta-feira - Corpo Inteiro Inferior\nAgachamento frontal 4x8-10\nStiff 3x10-12\nAvanço 3x12 cada perna\nPanturrilha 4x15-20'
        ],
        'hipertrofia': [
            'Segunda-feira - Peito e Tríceps\nSupino reto 4x8-10\nSupino inclinado 4x8-10\nCrucifixo 3x12\nTríceps testa 3x10-12\nTríceps pulley 3x12',
            'Terça-feira - Costas e Bíceps\nBarra fixa 4x8-10\nRemada curvada 4x8-10\nPuxada frontal 4x10-12\nRosca direta 3x12\nRosca martelo 3x12',
            'Quarta-feira - Pernas\nAgachamento 4x8-10\nLeg Press 4x12-15\nStiff 3x10-12\nExtensão de pernas 3x12\nPanturrilha 4x15-20',
            'Quinta-feira - Ombros e Trapézio\nDesenvolvimento 4x8-10\nElevação lateral 3x12\nElevação frontal 3x12\nEncolhimento 3x12',
            'Sexta-feira - Braços\nRosca direta 4x10-12\nRosca alternada 3x12\nTríceps testa 4x10-12\nTríceps pulley 3x12'
        ],
        'emagrecimento': [
            'Segunda-feira - Treino Funcional\nAgachamento 3x15\nBurpee 3x12\nMountain climber 3x20\nPrancha 3x45s',
            'Terça-feira - Cardio\nCorrida 30min\nBicicleta 20min',
            'Quarta-feira - Treino Funcional\nAvanço 3x15 cada\nFlexão 3x12\nAbdominal 3x20\nPrancha lateral 3x30s cada',
            'Quinta-feira - Cardio\nCorda 20min\nEsteira 25min',
            'Sexta-feira - Treino Completo\nCircuito: 3x (Agachamento 15, Flexão 10, Abdominal 15, Prancha 30s)'
        ]
    };

    const treino = exerciciosBase[info.categoria] || exerciciosBase['corpo-inteiro'];
    return treino.join('\n\n');
}

/**
 * Limpa o cache do catálogo (memória e banco)
 */
export async function clearCatalogCache(): Promise<void> {
    catalogCache = null;
    try {
        await clearWorkoutCache();
    } catch (error) {
        logger.warn('Erro ao limpar cache do banco', 'workoutCatalogService', error);
    }
}

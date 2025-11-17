/**
 * Serviço offline para geração de planos de bem-estar
 * Fornece planos pré-definidos baseados no objetivo do usuário
 * 
 * Este arquivo contém templates de planos de treino e suplementos
 * que são usados quando a IA online não está disponível.
 */

import type { User, WellnessPlan, WorkoutDay, Supplement, WellnessTips } from '../types';
import { Goal } from '../types';
import { getAllAvailableExercises, getExerciseGif } from './exerciseGifService';

/**
 * Mapeamento direto de exercícios genéricos para nomes exatos dos GIFs
 */
const exerciseMapping: Record<string, string> = {
    'Caminhada rápida ou corrida leve': 'Esteira Ergométrica',
    'Agachamento Livre': 'Agachamento livre com barra',
    'Agachamento com Peso Corporal': 'Agachamento livre com barra',
    'Flexão de Braço': 'Paralelas',
    'Flexão de Braço (modificada se necessário)': 'Paralelas',
    'Prancha': 'Prancha Frontal Alta',
    'Prancha Lateral': 'Prancha Lateral',
    'HIIT - Corrida/Caminhada': 'Esteira Ergométrica',
    'Burpees': 'Agachamento livre com barra', // Fallback - não temos GIF específico
    'Mountain Climber': 'Abdominal Bicicleta', // Similar
    'Remada Inclinada (com halteres ou elástico)': 'Remada Inclinada com Halteres',
    'Remada Inclinada': 'Remada Inclinada com Halteres',
    'Lunges': 'Afundo livre',
    'Bicicleta ou Elíptico': 'Bicicleta Ergométrica Reclinada',
    'Bicicleta': 'Bicicleta Ergométrica Reclinada',
    'Elíptico': 'Máquina Elíptica',
    'Abdominais': 'Abdominal',
    'Elevação de Pernas': 'Abdominal Infra',
    'Caminhada ou trilha': 'Esteira Ergométrica',
    'Alongamento completo': 'Esteira Ergométrica', // Fallback
    'Supino ou Flexão de Braço': 'Supino',
    'Supino': 'Supino',
    'Supino Inclinado': 'Supino Inclinado com Halteres',
    'Tríceps Pulley ou Mergulho': 'Tríceps pulley corda',
    'Mergulho': 'Tríceps Mergulho no banco',
    'Crucifixo': 'Crucifixo com halteres',
    'Barra ou Puxada Frontal': 'Barra fixa',
    'Puxada Frontal': 'Puxada Alta',
    'Remada Curvada': 'Remada Curvada com Barra',
    'Rosca Direta': 'Rosca Direta com Barra',
    'Rosca Martelo': 'Rosca martelo',
    'Agachamento Livre ou com Barra': 'Agachamento livre com barra',
    'Leg Press': 'leg press',
    'Extensão de Pernas': 'cadeira extensora',
    'Panturrilha em Pé': 'Elevação de Panturrilha com Barra em Pé',
    'Desenvolvimento com Halteres': 'Desenvolvimento de ombro com halteres em pé com pegada neutra',
    'Elevação Lateral': 'Elevação lateral de braços com halteres',
    'Elevação Frontal': 'Elevação frontal com halteres',
    'Encolhimento (Trapézio)': 'encolhimento livre com halteres',
    'Rosca Alternada': 'Rosca alternada com halteres sentado',
    'Rosca Alternada com Halteres': 'Rosca alternada com halteres sentado',
    'Tríceps Testa': 'Tríceps testa com barra',
    'Tríceps Pulley': 'Tríceps pulley corda',
    'Caminhada ou Bicicleta': 'Bicicleta Ergométrica Reclinada',
    'Corrida ou Caminhada': 'Esteira Ergométrica',
    'Agachamento': 'Agachamento livre com barra',
    'Agachamento com Peso': 'Agachamento livre com barra',
    'Remada': 'Remada Curvada com Barra',
    'Supino ou Flexão': 'Supino',
    'Esporte ou atividade preferida': 'Esteira Ergométrica', // Fallback
    'Alongamento': 'Esteira Ergométrica', // Fallback
};

/**
 * Mapeia exercícios genéricos para nomes exatos dos GIFs disponíveis
 */
function mapToAvailableExercise(genericName: string): string {
    // Verificar mapeamento direto primeiro
    if (exerciseMapping[genericName]) {
        const mapped = exerciseMapping[genericName];
        // Verificar se o exercício mapeado existe
        const gif = getExerciseGif(mapped);
        if (gif) {
            return mapped;
        }
    }
    
    // Se não tem mapeamento direto, buscar por similaridade
    const allExercises = getAllAvailableExercises();
    const normalizedGeneric = genericName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Buscar exercício mais similar
    for (const exercise of allExercises) {
        const normalizedExercise = exercise.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Verificar correspondência exata ou parcial
        if (normalizedExercise.includes(normalizedGeneric) || normalizedGeneric.includes(normalizedExercise)) {
            const gif = getExerciseGif(exercise);
            if (gif) {
                return exercise;
            }
        }
    }
    
    // Se não encontrou, retornar o nome genérico
    return genericName;
}

/**
 * Gera um plano de bem-estar offline baseado no objetivo do usuário
 * 
 * @param user - Dados do usuário
 * @returns Plano de bem-estar completo
 */
export const generateWellnessPlanOffline = (user: User): WellnessPlan => {
    // Calcular IMC para ajustar intensidade
    const alturaMetros = user.altura / 100;
    const imc = user.peso / (alturaMetros * alturaMetros);
    const nivelCondicionamento = user.disciplineScore >= 80 ? 'avançado' : 
                                 user.disciplineScore >= 60 ? 'intermediário' : 'iniciante';

    // Selecionar plano baseado no objetivo
    let plan: WellnessPlan;
    
    if (user.objetivo === Goal.PERDER_PESO) {
        plan = getWeightLossPlan(user, nivelCondicionamento, imc);
    } else if (user.objetivo === Goal.GANHAR_MASSA) {
        plan = getMuscleGainPlan(user, nivelCondicionamento, imc);
    } else {
        plan = getMaintenancePlan(user, nivelCondicionamento, imc);
    }

    // Adicionar metadados
    plan.data_geracao = new Date().toISOString();
    plan.versao = 2;

    return plan;
};

/**
 * Plano para perda de peso
 */
function getWeightLossPlan(user: User, nivel: string, imc: number): WellnessPlan {
    const intensidade = imc > 30 ? 'moderada' : nivel === 'iniciante' ? 'baixa' : 'moderada';
    
    const plano_treino_semanal: WorkoutDay[] = [
        {
            dia_semana: 'Segunda-feira',
            foco_treino: 'Cardio + Corpo Inteiro',
            exercicios: [
                { name: mapToAvailableExercise('Esteira Ergométrica'), reps: '30-40 min', calories: 200, tips: 'Mantenha ritmo constante' },
                { name: mapToAvailableExercise('Agachamento livre com barra'), reps: '3x15', rest: '45s', calories: 50, tips: 'Foque na forma correta' },
                { name: mapToAvailableExercise('Flexão de Braço'), reps: '3x10-12', rest: '60s', calories: 40 },
                { name: mapToAvailableExercise('Prancha Frontal Alta'), reps: '3x30-60s', rest: '60s', calories: 30, tips: 'Mantenha o core contraído' },
            ],
            duracao_estimada: '45-50 minutos',
            intensidade: intensidade as 'baixa' | 'moderada' | 'alta',
            observacoes: 'Foque em manter frequência cardíaca elevada durante o cardio'
        },
        {
            dia_semana: 'Terça-feira',
            foco_treino: 'Cardio Intervalado',
            exercicios: [
                { name: mapToAvailableExercise('HIIT - Corrida/Caminhada'), reps: '20 min (30s rápido / 60s lento)', calories: 250, tips: 'Ajuste intensidade conforme condicionamento' },
                { name: mapToAvailableExercise('Burpees'), reps: '3x8-10', rest: '90s', calories: 60, tips: 'Modifique se necessário' },
                { name: mapToAvailableExercise('Mountain Climber'), reps: '3x20', rest: '60s', calories: 40 },
            ],
            duracao_estimada: '30-35 minutos',
            intensidade: 'alta' as const,
            observacoes: 'Treino de alta intensidade - descanse bem entre intervalos'
        },
        {
            dia_semana: 'Quarta-feira',
            foco_treino: 'Descanso Ativo',
            exercicios: [],
            duracao_estimada: '20-30 minutos',
            intensidade: 'baixa' as const,
            observacoes: 'Caminhada leve, alongamento ou yoga'
        },
        {
            dia_semana: 'Quinta-feira',
            foco_treino: 'Treino de Força - Corpo Inteiro',
            exercicios: [
                { name: mapToAvailableExercise('Agachamento com Peso Corporal'), reps: '4x12-15', rest: '60s', calories: 60, tips: 'Desça até coxas paralelas ao chão' },
                { name: mapToAvailableExercise('Flexão de Braço'), reps: '3x10-15', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Remada Inclinada (com halteres ou elástico)'), reps: '3x12', rest: '60s', calories: 40 },
                { name: mapToAvailableExercise('Lunges'), reps: '3x10 cada perna', rest: '60s', calories: 50, tips: 'Mantenha o joelho alinhado' },
            ],
            duracao_estimada: '40-45 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sexta-feira',
            foco_treino: 'Cardio + Core',
            exercicios: [
                { name: mapToAvailableExercise('Bicicleta ou Elíptico'), reps: '25-30 min', calories: 200 },
                { name: mapToAvailableExercise('Abdominais'), reps: '3x15-20', rest: '45s', calories: 30 },
                { name: mapToAvailableExercise('Prancha Lateral'), reps: '3x30s cada lado', rest: '60s', calories: 25 },
                { name: mapToAvailableExercise('Elevação de Pernas'), reps: '3x12', rest: '45s', calories: 20 },
            ],
            duracao_estimada: '40 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sábado',
            foco_treino: 'Atividade ao Ar Livre',
            exercicios: [
                { name: mapToAvailableExercise('Caminhada ou trilha'), reps: '45-60 min', calories: 250, tips: 'Aproveite a natureza' },
                { name: mapToAvailableExercise('Alongamento completo'), reps: '15-20 min', calories: 20 },
            ],
            duracao_estimada: '60-75 minutos',
            intensidade: 'baixa' as const,
        },
        {
            dia_semana: 'Domingo',
            foco_treino: 'Descanso',
            exercicios: [],
            duracao_estimada: '0 minutos',
            intensidade: 'baixa' as const,
            observacoes: 'Dia de descanso completo - recuperação é essencial'
        },
    ];

    const recomendacoes_suplementos: Supplement[] = [
        {
            nome: 'Whey Protein',
            dosagem_sugerida: '20-25g',
            melhor_horario: 'Pós-treino',
            justificativa: `Ajuda na recuperação muscular após treinos, preservando massa magra durante o déficit calórico. Essencial para ${user.nome} que está em processo de perda de peso.`,
            beneficios: [
                'Preserva massa muscular durante déficit calórico',
                'Acelera recuperação pós-treino',
                'Aumenta saciedade'
            ],
        },
        {
            nome: 'Ômega-3',
            dosagem_sugerida: '1-2g',
            melhor_horario: 'Com uma refeição',
            justificativa: 'Ajuda na redução de inflamação, melhora saúde cardiovascular e pode auxiliar na perda de gordura.',
            beneficios: [
                'Reduz inflamação',
                'Melhora saúde cardiovascular',
                'Pode auxiliar na queima de gordura'
            ],
        },
        {
            nome: 'Vitamina D',
            dosagem_sugerida: '2000-4000 UI',
            melhor_horario: 'Manhã com gordura',
            justificativa: 'Fundamental para função muscular, saúde óssea e sistema imunológico. Muitas pessoas têm deficiência.',
            beneficios: [
                'Melhora função muscular',
                'Fortalece sistema imunológico',
                'Auxilia na saúde óssea'
            ],
        },
    ];

    const dicas_adicionais = `Para ${user.nome}, com objetivo de perder peso:
1. Mantenha um déficit calórico moderado (15-20%) combinado com atividade física regular.
2. Priorize proteínas magras e vegetais em todas as refeições.
3. Durma 7-9 horas por noite para otimizar recuperação e controle hormonal.
4. Beba pelo menos ${Math.round(user.peso * 35)}ml de água por dia (aproximadamente ${Math.round(user.peso * 35 / 1000)} litros).
5. Faça refeições a cada 3-4 horas para manter metabolismo ativo.`;

    const dicas_inteligentes: WellnessTips = {
        hidratacao: `Com ${user.peso}kg, recomendo beber aproximadamente ${Math.round(user.peso * 35 / 1000)} litros de água por dia. Aumente para ${Math.round(user.peso * 40 / 1000)} litros nos dias de treino intenso.`,
        horario_treino: `Para perda de peso, treine preferencialmente pela manhã (6h-10h) quando o metabolismo está mais ativo. Se não for possível, qualquer horário é válido - o importante é ser consistente.`,
        descanso: `Com ${nivel} nível de condicionamento, respeite os dias de descanso. Se sentir fadiga excessiva, reduza a intensidade ou adicione um dia extra de descanso.`,
        sono: `Durma 7-9 horas por noite. Sono adequado regula hormônios que controlam fome (grelina/leptina) e é essencial para recuperação muscular.`,
        nutricao: `Priorize proteínas (${Math.round(user.peso * 1.6)}-${Math.round(user.peso * 2)}g por dia) para preservar massa muscular durante o déficit. Consuma carboidratos principalmente antes e depois dos treinos.`
    };

    return {
        plano_treino_semanal,
        recomendacoes_suplementos,
        dicas_adicionais,
        dicas_inteligentes,
    };
}

/**
 * Plano para ganho de massa
 */
function getMuscleGainPlan(user: User, nivel: string, imc: number): WellnessPlan {
    const intensidade = nivel === 'iniciante' ? 'moderada' : 'alta';
    
    const plano_treino_semanal: WorkoutDay[] = [
        {
            dia_semana: 'Segunda-feira',
            foco_treino: 'Peito e Tríceps',
            exercicios: [
                { name: mapToAvailableExercise('Supino ou Flexão de Braço'), reps: '4x8-12', rest: '90s', calories: 80, tips: 'Foque na contração máxima' },
                { name: mapToAvailableExercise('Supino Inclinado'), reps: '3x10-12', rest: '90s', calories: 70 },
                { name: mapToAvailableExercise('Tríceps Pulley ou Mergulho'), reps: '3x10-12', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Crucifixo'), reps: '3x12-15', rest: '60s', calories: 40 },
            ],
            duracao_estimada: '50-60 minutos',
            intensidade: intensidade as 'baixa' | 'moderada' | 'alta',
        },
        {
            dia_semana: 'Terça-feira',
            foco_treino: 'Costas e Bíceps',
            exercicios: [
                { name: mapToAvailableExercise('Barra ou Puxada Frontal'), reps: '4x8-12', rest: '90s', calories: 80, tips: 'Contração completa' },
                { name: mapToAvailableExercise('Remada Curvada'), reps: '4x8-12', rest: '90s', calories: 70 },
                { name: mapToAvailableExercise('Rosca Direta'), reps: '3x10-12', rest: '60s', calories: 40 },
                { name: mapToAvailableExercise('Rosca Martelo'), reps: '3x10-12', rest: '60s', calories: 35 },
            ],
            duracao_estimada: '50-60 minutos',
            intensidade: intensidade as 'baixa' | 'moderada' | 'alta',
        },
        {
            dia_semana: 'Quarta-feira',
            foco_treino: 'Pernas e Glúteos',
            exercicios: [
                { name: mapToAvailableExercise('Agachamento Livre ou com Barra'), reps: '4x8-12', rest: '120s', calories: 100, tips: 'Movimento completo' },
                { name: mapToAvailableExercise('Leg Press'), reps: '4x10-15', rest: '90s', calories: 80 },
                { name: mapToAvailableExercise('Extensão de Pernas'), reps: '3x12-15', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Panturrilha em Pé'), reps: '4x15-20', rest: '45s', calories: 30 },
            ],
            duracao_estimada: '55-65 minutos',
            intensidade: 'alta' as const,
            observacoes: 'Treino mais pesado da semana - descanse bem após'
        },
        {
            dia_semana: 'Quinta-feira',
            foco_treino: 'Ombros e Trapézio',
            exercicios: [
                { name: mapToAvailableExercise('Desenvolvimento com Halteres'), reps: '4x8-12', rest: '90s', calories: 70 },
                { name: mapToAvailableExercise('Elevação Lateral'), reps: '3x12-15', rest: '60s', calories: 40 },
                { name: mapToAvailableExercise('Elevação Frontal'), reps: '3x12-15', rest: '60s', calories: 35 },
                { name: mapToAvailableExercise('Encolhimento (Trapézio)'), reps: '3x12-15', rest: '60s', calories: 30 },
            ],
            duracao_estimada: '45-50 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sexta-feira',
            foco_treino: 'Braços (Bíceps e Tríceps)',
            exercicios: [
                { name: mapToAvailableExercise('Rosca Direta'), reps: '4x8-12', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Rosca Alternada'), reps: '3x10-12', rest: '60s', calories: 40 },
                { name: mapToAvailableExercise('Tríceps Testa'), reps: '4x8-12', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Tríceps Pulley'), reps: '3x10-12', rest: '60s', calories: 40 },
            ],
            duracao_estimada: '40-45 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sábado',
            foco_treino: 'Cardio Leve ou Descanso Ativo',
            exercicios: [
                { name: mapToAvailableExercise('Caminhada ou Bicicleta'), reps: '30-40 min', calories: 150, tips: 'Intensidade leve para recuperação' },
                { name: mapToAvailableExercise('Alongamento'), reps: '15-20 min', calories: 20 },
            ],
            duracao_estimada: '45-60 minutos',
            intensidade: 'baixa' as const,
        },
        {
            dia_semana: 'Domingo',
            foco_treino: 'Descanso',
            exercicios: [],
            duracao_estimada: '0 minutos',
            intensidade: 'baixa' as const,
            observacoes: 'Descanso completo - essencial para crescimento muscular'
        },
    ];

    const recomendacoes_suplementos: Supplement[] = [
        {
            nome: 'Whey Protein',
            dosagem_sugerida: '30-40g',
            melhor_horario: 'Pós-treino e entre refeições',
            justificativa: `Essencial para ${user.nome} que busca ganhar massa. Fornece aminoácidos de rápida absorção para síntese proteica muscular.`,
            beneficios: [
                'Acelera recuperação e síntese proteica',
                'Conveniente para atingir meta de proteína diária',
                'Aumenta anabolismo pós-treino'
            ],
        },
        {
            nome: 'Creatina Monohidratada',
            dosagem_sugerida: '5g',
            melhor_horario: 'Pós-treino (com carboidrato)',
            justificativa: 'Aumenta força e potência muscular, permitindo treinos mais intensos e maior ganho de massa.',
            beneficios: [
                'Aumenta força e potência',
                'Melhora performance em treinos',
                'Acelera ganho de massa muscular'
            ],
        },
        {
            nome: 'Multivitamínico',
            dosagem_sugerida: '1 comprimido',
            melhor_horario: 'Manhã com refeição',
            justificativa: 'Garante que todas as vitaminas e minerais estejam cobertos, essencial para processos anabólicos.',
            beneficios: [
                'Suporta processos metabólicos',
                'Previne deficiências nutricionais',
                'Otimiza recuperação'
            ],
        },
        {
            nome: 'BCAA (opcional)',
            dosagem_sugerida: '5-10g',
            melhor_horario: 'Durante ou pós-treino',
            justificativa: 'Pode ajudar na recuperação durante treinos muito intensos ou longos.',
            beneficios: [
                'Reduz fadiga muscular',
                'Acelera recuperação',
                'Preserva massa durante treinos longos'
            ],
        },
    ];

    const dicas_adicionais = `Para ${user.nome}, com objetivo de ganhar massa muscular:
1. Mantenha superávit calórico de 10-15% (aproximadamente ${Math.round(user.peso * 35 * 1.1)}-${Math.round(user.peso * 35 * 1.15)} calorias por dia).
2. Consuma ${Math.round(user.peso * 2)}g de proteína por kg de peso corporal (${Math.round(user.peso * 2)}g por dia).
3. Priorize carboidratos complexos para energia e recuperação.
4. Durma 8-9 horas por noite - crescimento muscular acontece durante o sono.
5. Progressão é chave: aumente carga ou repetições semanalmente.`;

    const dicas_inteligentes: WellnessTips = {
        hidratacao: `Com treinos intensos, beba ${Math.round(user.peso * 40 / 1000)}-${Math.round(user.peso * 45 / 1000)} litros de água por dia. Hidratação adequada é crucial para performance e recuperação.`,
        horario_treino: `Para ganho de massa, treine preferencialmente entre 14h-18h quando a força e testosterona estão em pico. Evite treinar muito tarde (após 21h) para não afetar o sono.`,
        descanso: `Com treinos de alta intensidade, descanse 48-72h entre treinar o mesmo grupo muscular. ${nivel === 'iniciante' ? 'Como iniciante, comece com 3-4 treinos por semana.' : 'Você pode treinar 5-6 dias por semana.'}`,
        sono: `Durma 8-9 horas por noite. Sono profundo é quando ocorre a maior liberação de hormônio do crescimento (GH) e testosterona, essenciais para ganho de massa.`,
        nutricao: `Consuma ${Math.round(user.peso * 2)}g de proteína diariamente, distribuída em 4-6 refeições. Carboidratos devem ser consumidos antes (energia) e depois (recuperação) dos treinos.`
    };

    return {
        plano_treino_semanal,
        recomendacoes_suplementos,
        dicas_adicionais,
        dicas_inteligentes,
    };
}

/**
 * Plano para manutenção de peso
 */
function getMaintenancePlan(user: User, nivel: string, imc: number): WellnessPlan {
    const intensidade = nivel === 'iniciante' ? 'baixa' : 'moderada';
    
    const plano_treino_semanal: WorkoutDay[] = [
        {
            dia_semana: 'Segunda-feira',
            foco_treino: 'Corpo Inteiro',
            exercicios: [
                { name: mapToAvailableExercise('Agachamento'), reps: '3x12-15', rest: '60s', calories: 60 },
                { name: mapToAvailableExercise('Flexão de Braço'), reps: '3x10-15', rest: '60s', calories: 50 },
                { name: mapToAvailableExercise('Remada'), reps: '3x12', rest: '60s', calories: 45 },
                { name: mapToAvailableExercise('Prancha'), reps: '3x45-60s', rest: '60s', calories: 30 },
            ],
            duracao_estimada: '40-45 minutos',
            intensidade: intensidade as 'baixa' | 'moderada' | 'alta',
        },
        {
            dia_semana: 'Terça-feira',
            foco_treino: 'Cardio Moderado',
            exercicios: [
                { name: mapToAvailableExercise('Corrida ou Caminhada'), reps: '30-40 min', calories: 200 },
                { name: mapToAvailableExercise('Alongamento'), reps: '10-15 min', calories: 15 },
            ],
            duracao_estimada: '40-55 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Quarta-feira',
            foco_treino: 'Descanso Ativo',
            exercicios: [],
            duracao_estimada: '20-30 minutos',
            intensidade: 'baixa' as const,
        },
        {
            dia_semana: 'Quinta-feira',
            foco_treino: 'Força - Corpo Inteiro',
            exercicios: [
                { name: mapToAvailableExercise('Agachamento com Peso'), reps: '3x10-12', rest: '90s', calories: 70 },
                { name: mapToAvailableExercise('Supino ou Flexão'), reps: '3x10-12', rest: '90s', calories: 60 },
                { name: mapToAvailableExercise('Remada'), reps: '3x10-12', rest: '90s', calories: 55 },
                { name: mapToAvailableExercise('Lunges'), reps: '3x10 cada perna', rest: '60s', calories: 50 },
            ],
            duracao_estimada: '45-50 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sexta-feira',
            foco_treino: 'Cardio + Core',
            exercicios: [
                { name: mapToAvailableExercise('Bicicleta ou Elíptico'), reps: '25-30 min', calories: 180 },
                { name: mapToAvailableExercise('Abdominais'), reps: '3x15-20', rest: '45s', calories: 30 },
                { name: mapToAvailableExercise('Prancha Lateral'), reps: '3x30s cada lado', rest: '60s', calories: 25 },
            ],
            duracao_estimada: '35-40 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Sábado',
            foco_treino: 'Atividade Recreativa',
            exercicios: [
                { name: mapToAvailableExercise('Esporte ou atividade preferida'), reps: '45-60 min', calories: 200, tips: 'Divirta-se enquanto se exercita!' },
            ],
            duracao_estimada: '45-60 minutos',
            intensidade: 'moderada' as const,
        },
        {
            dia_semana: 'Domingo',
            foco_treino: 'Descanso',
            exercicios: [],
            duracao_estimada: '0 minutos',
            intensidade: 'baixa' as const,
        },
    ];

    const recomendacoes_suplementos: Supplement[] = [
        {
            nome: 'Multivitamínico',
            dosagem_sugerida: '1 comprimido',
            melhor_horario: 'Manhã com refeição',
            justificativa: 'Garante cobertura de todas as vitaminas e minerais essenciais para saúde geral e performance.',
            beneficios: [
                'Suporta saúde geral',
                'Previne deficiências',
                'Otimiza energia e bem-estar'
            ],
        },
        {
            nome: 'Ômega-3',
            dosagem_sugerida: '1-2g',
            melhor_horario: 'Com uma refeição',
            justificativa: 'Essencial para saúde cardiovascular, função cerebral e redução de inflamação.',
            beneficios: [
                'Melhora saúde cardiovascular',
                'Reduz inflamação',
                'Suporta função cerebral'
            ],
        },
        {
            nome: 'Vitamina D',
            dosagem_sugerida: '2000 UI',
            melhor_horario: 'Manhã com gordura',
            justificativa: 'Fundamental para sistema imunológico, saúde óssea e função muscular.',
            beneficios: [
                'Fortalece sistema imunológico',
                'Melhora saúde óssea',
                'Otimiza função muscular'
            ],
        },
    ];

    const dicas_adicionais = `Para ${user.nome}, mantendo peso saudável:
1. Mantenha balanço calórico (consuma aproximadamente ${Math.round(user.peso * 30)} calorias por dia).
2. Priorize alimentos nutritivos e variados.
3. Mantenha atividade física regular (4-5 vezes por semana).
4. Durma 7-8 horas por noite.
5. Hidrate-se adequadamente (${Math.round(user.peso * 35 / 1000)} litros de água por dia).`;

    const dicas_inteligentes: WellnessTips = {
        hidratacao: `Mantenha hidratação adequada: ${Math.round(user.peso * 35 / 1000)} litros de água por dia. Aumente nos dias de treino.`,
        horario_treino: `Para manutenção, qualquer horário funciona. Escolha o que se encaixa melhor na sua rotina e seja consistente.`,
        descanso: `Com ${nivel} nível, mantenha 1-2 dias de descanso por semana. Ouça seu corpo e ajuste conforme necessário.`,
        sono: `Durma 7-8 horas por noite para manter saúde geral, energia e recuperação adequada.`,
        nutricao: `Mantenha dieta equilibrada com foco em alimentos integrais. Consuma proteínas (${Math.round(user.peso * 1.5)}g por dia), carboidratos complexos e gorduras saudáveis.`
    };

    return {
        plano_treino_semanal,
        recomendacoes_suplementos,
        dicas_adicionais,
        dicas_inteligentes,
    };
}


/**
 * Serviço para parsear texto de treinos e converter para formato WellnessPlan
 */

import type { WellnessPlan, WorkoutDay, Exercise, Goal } from '../types';
import { logger } from '../utils/logger';

/**
 * Parseia texto de treino e converte para WellnessPlan
 * @param text - Texto extraído do documento
 * @returns WellnessPlan estruturado
 */
export function parseWorkoutText(text: string): WellnessPlan {
    const days: WorkoutDay[] = [];
    
    try {
        // Normalizar texto
        const normalizedText = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();

        // Padrão para identificar treinos: "TREINO A – (segunda-feira)" ou "Treino B – (terça-feira)"
        // Suporta tanto "TREINO" quanto "Treino" e diferentes tipos de hífen
        const workoutPattern = /(?:TREINO|Treino)\s+([A-Z])\s*[–—-]\s*\(([^)]+)\)/gi;
        const workoutMatches = [...normalizedText.matchAll(workoutPattern)];

        if (workoutMatches.length > 0) {
            // Processar cada treino encontrado
            for (let i = 0; i < workoutMatches.length; i++) {
                const match = workoutMatches[i];
                const workoutId = match[1]; // A, B, C, D
                const dayName = match[2].trim(); // segunda-feira, terça-feira, etc.
                const startIndex = match.index! + match[0].length;
                const endIndex = i < workoutMatches.length - 1 
                    ? workoutMatches[i + 1].index! 
                    : normalizedText.length;
                
                const workoutContent = normalizedText.substring(startIndex, endIndex);
                const workoutDay = parseWorkoutDayFromPDF(dayName, workoutContent, workoutId);
                
                if (workoutDay && workoutDay.exercicios.length > 0) {
                    days.push(workoutDay);
                } else {
                    // Se não conseguiu parsear, tentar método alternativo
                    const fallbackDay = parseWorkoutDay(dayName, workoutContent);
                    if (fallbackDay && fallbackDay.exercicios.length > 0) {
                        days.push(fallbackDay);
                    }
                }
            }
        } else {
            // Fallback: tentar padrões antigos
            const dayPatterns = [
                { pattern: /(?:Segunda|Segunda-feira|SEGUNDA|SEGUNDA-FEIRA)/i, name: 'Segunda-feira' },
                { pattern: /(?:Terça|Terça-feira|TERÇA|TERÇA-FEIRA)/i, name: 'Terça-feira' },
                { pattern: /(?:Quarta|Quarta-feira|QUARTA|QUARTA-FEIRA)/i, name: 'Quarta-feira' },
                { pattern: /(?:Quinta|Quinta-feira|QUINTA|QUINTA-FEIRA)/i, name: 'Quinta-feira' },
                { pattern: /(?:Sexta|Sexta-feira|SEXTA|SEXTA-FEIRA)/i, name: 'Sexta-feira' },
                { pattern: /(?:Sábado|Sabado|SÁBADO|SABADO)/i, name: 'Sábado' },
                { pattern: /(?:Domingo|DOMINGO)/i, name: 'Domingo' },
            ];

            const sections: { day: string; content: string }[] = [];
            let lastIndex = 0;

            for (const dayPattern of dayPatterns) {
                const match = normalizedText.substring(lastIndex).match(dayPattern.pattern);
                if (match) {
                    const startIndex = lastIndex + (match.index || 0);
                    sections.push({
                        day: dayPattern.name,
                        content: normalizedText.substring(startIndex)
                    });
                    lastIndex = startIndex;
                }
            }

            for (const section of sections) {
                const workoutDay = parseWorkoutDay(section.day, section.content);
                if (workoutDay && workoutDay.exercicios.length > 0) {
                    days.push(workoutDay);
                }
            }
        }

        // Se não encontrou dias estruturados, criar um dia único com todos os exercícios
        if (days.length === 0) {
            const exercises = extractExercises(normalizedText);
            if (exercises.length > 0) {
                days.push({
                    dia_semana: 'Treino Completo',
                    foco_treino: 'Corpo Inteiro',
                    exercicios: exercises,
                    duracao_estimada: '60-90 minutos',
                    intensidade: 'moderada'
                });
            }
        }

    } catch (error) {
        logger.error('Erro ao parsear treino', 'workoutParser', error);
    }

    return {
        plano_treino_semanal: days.length > 0 ? days : getDefaultWorkoutPlan(),
        recomendacoes_suplementos: [],
        dicas_adicionais: 'Mantenha boa forma em todos os exercícios. Aumente a carga progressivamente.',
        data_geracao: new Date().toISOString(),
        versao: 1
    };
}

/**
 * Parseia um dia de treino do formato estruturado (PDF ou Word)
 * Formato: TREINO A – (segunda-feira)
 *          10 min: esteira ou elíptico
 *          EXERCICIO SET REPS OBS INTERVALO
 *          Nome exercício (pode ser múltiplas linhas)
 *          SET REPS OBS INTERVALO
 * 
 * Funciona tanto para PDF quanto para Word, desde que tenham o mesmo formato estruturado
 */
function parseWorkoutDayFromPDF(dayName: string, content: string, workoutId: string): WorkoutDay | null {
    const lines = content.split('\n').map(l => l.trim());
    
    // Encontrar onde começa a tabela (linha com cabeçalho)
    // Suporta diferentes formatos de cabeçalho (com ou sem acentos, espaços variados)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Padrões mais flexíveis para detectar cabeçalho
        if (line.match(/EXERCICIO\s+SET\s+REPS\s+OBS\s+INTERVALO/i) || 
            line.match(/EXERCÍCIO\s+SET\s+REPS\s+OBS\s+INTERVALO/i) ||
            line.match(/EXERCICIO.*SET.*REPS.*OBS.*INTERVALO/i) ||
            line.match(/EXERCÍCIO.*SET.*REPS.*OBS.*INTERVALO/i) ||
            // Para Word, pode ter formato de tabela com pipes ou tabs
            line.match(/^EXERCICIO\s*[|]\s*SET\s*[|]\s*REPS\s*[|]\s*OBS\s*[|]\s*INTERVALO/i) ||
            line.match(/^EXERCÍCIO\s*[|]\s*SET\s*[|]\s*REPS\s*[|]\s*OBS\s*[|]\s*INTERVALO/i)) {
            headerIndex = i;
            break;
        }
    }
    
    // Se não encontrou cabeçalho exato, tentar encontrar padrão mais flexível
    if (headerIndex === -1) {
        // Procurar por qualquer linha que contenha as palavras-chave do cabeçalho
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const hasExercicio = /EXERCICIO|EXERCÍCIO/i.test(line);
            const hasSet = /SET/i.test(line);
            const hasReps = /REPS/i.test(line);
            const hasIntervalo = /INTERVALO/i.test(line);
            
            // Se a linha contém todas as palavras-chave principais, considerar como cabeçalho
            if (hasExercicio && hasSet && hasReps && hasIntervalo) {
                headerIndex = i;
                break;
            }
        }
    }
    
    if (headerIndex === -1) {
        return null;
    }
    
    // Extrair instruções de aquecimento (linha antes do cabeçalho)
    let warmup = '';
    if (headerIndex > 0) {
        const warmupLine = lines[headerIndex - 1].trim();
        if (warmupLine.match(/\d+\s*min:/i)) {
            warmup = warmupLine;
        }
    }
    
    // Extrair exercícios (após o cabeçalho)
    // Filtrar linhas vazias e manter apenas linhas com conteúdo
    const exerciseLines = lines.slice(headerIndex + 1)
        .filter(l => l.trim().length > 0)
        .map(l => l.trim());
    
    const exercises = extractExercisesFromPDFFormat(exerciseLines);
    
    if (exercises.length === 0) {
        return null;
    }
    
    // Extrair observações finais (como "Esteira: 15 min...")
    let observacoes = '';
    for (let i = lines.length - 1; i >= headerIndex; i--) {
        const line = lines[i].trim();
        if (line.match(/Esteira:|ESTRUTURA DO TREINO/i)) {
            observacoes = line;
            break;
        }
    }
    
    return {
        dia_semana: dayName,
        foco_treino: `Treino ${workoutId}`,
        exercicios: exercises,
        duracao_estimada: warmup || undefined,
        intensidade: 'moderada',
        observacoes: observacoes || undefined
    };
}

/**
 * Parseia um dia de treino
 */
function parseWorkoutDay(dayName: string, content: string): WorkoutDay | null {
    const exercises = extractExercises(content);
    
    if (exercises.length === 0) {
        return null;
    }

    // Extrair foco do treino
    const focusMatch = content.match(/(?:foco|treino|musculatura|grupo)[:\s]+([^\n]+)/i);
    const focoTreino = focusMatch 
        ? focusMatch[1].trim() 
        : inferFocusFromExercises(exercises);

    // Extrair duração
    const durationMatch = content.match(/(?:duração|duração estimada|tempo)[:\s]+([^\n]+)/i);
    const duracao = durationMatch ? durationMatch[1].trim() : '60-75 minutos';

    // Extrair intensidade
    const intensityMatch = content.match(/(?:intensidade|intensidade)[:\s]+(baixa|moderada|alta)/i);
    const intensidade = intensityMatch 
        ? (intensityMatch[1].toLowerCase() as 'baixa' | 'moderada' | 'alta')
        : 'moderada';

    return {
        dia_semana: dayName,
        foco_treino: focoTreino,
        exercicios: exercises,
        duracao_estimada: duracao,
        intensidade: intensidade
    };
}

/**
 * Extrai exercícios do formato PDF específico
 * Formato: Nome (pode ser múltiplas linhas)
 *          SET REPS [OBS] INTERVALO
 * Exemplos:
 *   Puxada frontal
 *   pegada
 *   pronada
 *   4 15-15-12-10
 *   2 min
 *   
 *   Remada
 *   curvada 3 12 1,5 min
 *   
 *   Stiff 4 12
 *   45 s
 */
/**
 * Extrai exercícios do formato estruturado (PDF ou Word)
 * Funciona tanto para PDF quanto para Word, desde que tenham o mesmo formato estruturado
 */
function extractExercisesFromPDFFormat(lines: string[]): Exercise[] {
    const exercises: Exercise[] = [];
    let i = 0;
    
    // Pular até encontrar o cabeçalho da tabela (formato mais flexível)
    while (i < lines.length) {
        const line = lines[i].trim();
        // Verificar se é cabeçalho (formato mais flexível)
        if (line.match(/EXERCICIO\s+SET\s+REPS\s+OBS\s+INTERVALO/i) || 
            line.match(/EXERCÍCIO\s+SET\s+REPS\s+OBS\s+INTERVALO/i) ||
            line.match(/EXERCICIO.*SET.*REPS.*OBS.*INTERVALO/i) ||
            line.match(/EXERCÍCIO.*SET.*REPS.*OBS.*INTERVALO/i) ||
            // Para Word, pode ter formato de tabela com pipes ou tabs
            line.match(/^EXERCICIO\s*[|]\s*SET\s*[|]\s*REPS\s*[|]\s*OBS\s*[|]\s*INTERVALO/i) ||
            line.match(/^EXERCÍCIO\s*[|]\s*SET\s*[|]\s*REPS\s*[|]\s*OBS\s*[|]\s*INTERVALO/i)) {
            // Encontrou cabeçalho, pular ele
            i++;
            break;
        }
        i++;
    }
    
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Ignorar linhas que são cabeçalhos, títulos, ou instruções
        if (line.match(/^(?:TREINO|Treino|EXERCICIO|EXERCÍCIO|PRESCRIÇÃO|ESTRUTURA|Esteira:|QUARTA-FEIRA|DESCANSO|--\s*\d+\s+of\s+\d+\s*--|\d+\s*min:|NOME:|DATA)/i)) {
            i++;
            continue;
        }
        
        // Se linha vazia, pular
        if (line.length === 0) {
            i++;
            continue;
        }
        
        // Verificar primeiro se a linha atual é REPS ou INTERVALO solto para associar ao anterior
        if (/^\d+/.test(line)) {
            // Verificar se é apenas um range de REPS (ex: "20-15-12-10-15")
            if (line.match(/^\d+(-\d+)+$/)) {
                // É REPS solto, associar ao exercício anterior se existir
                if (exercises.length > 0) {
                    const lastExercise = exercises[exercises.length - 1];
                    if (!lastExercise.reps) {
                        lastExercise.reps = line;
                        i++;
                        continue;
                    }
                }
            }
            // Verificar se é apenas INTERVALO (ex: "1,5 min", "45 s", "1min", "1 min.", "Sem descanso", "2 min")
            // Regex melhorado para capturar intervalos que começam com número seguido de espaço opcional e "min" ou "s" (com ou sem ponto)
            if (line.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\.?\b|\d+[,.]?\d*(?:min|s|MIN|S)\.?\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\.?\b)/i)) {
                // É INTERVALO solto, associar ao exercício anterior se existir
                if (exercises.length > 0) {
                    const lastExercise = exercises[exercises.length - 1];
                    if (!lastExercise.rest) {
                        lastExercise.rest = line;
                        i++;
                        continue;
                    }
                }
            }
        }
        
        // Coletar nome do exercício (linhas de texto até encontrar linha que começa com número)
        const nameParts: string[] = [];
        let nameEndIndex = i;
        
        while (nameEndIndex < lines.length) {
            const currentLine = lines[nameEndIndex].trim();
            
            // Se é linha vazia ou instrução, parar
            if (currentLine.length === 0 || 
                currentLine.match(/^(?:Esteira:|ESTRUTURA|--|TREINO|Treino|PRESCRIÇÃO|NOME:|DATA|EXERCICIO)/i)) {
                break;
            }
            
            // Se a linha começa com número, é a linha de dados (SET REPS...)
            if (/^\d+/.test(currentLine)) {
                // Verificar se é apenas REPS solto (range) ou INTERVALO solto
                // Se for, não é parte do nome, é dado do exercício
                if (currentLine.match(/^\d+(-\d+)+$/) || 
                    currentLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s)\.?\b|\d+[,.]?\d*(?:min|s)\.?\b|Sem descanso|sem descanso)/i)) {
                    // É REPS ou INTERVALO solto, parar de coletar nome
                    break;
                }
                // É linha de dados completa (SET REPS...), parar de coletar nome
                break;
            }
            
            // Se contém apenas texto (sem números no início), é parte do nome
            if (currentLine.length > 0) {
                nameParts.push(currentLine);
            }
            
            nameEndIndex++;
        }
        
        // Se não coletou nome válido, pular
        if (nameParts.length === 0) {
            i++;
            continue;
        }
        
        const exerciseName = nameParts.join(' ').trim();
        
        // Validar nome (não deve ser apenas números, muito curto, ou ser um cabeçalho)
        if (exerciseName.length < 3 || 
            /^\d+$/.test(exerciseName) ||
            exerciseName.match(/^(?:EXERCICIO|EXERCÍCIO|SET|REPS|OBS|INTERVALO|TREINO|Treino|NOME|DATA|PRESCRIÇÃO|ESTRUTURA)/i) ||
            exerciseName.match(/^[A-Z\s]+$/)) { // Se é tudo maiúsculo e muito curto, pode ser cabeçalho
            i = nameEndIndex;
            continue;
        }
        
        // Se chegou ao fim sem dados, adicionar apenas nome
        if (nameEndIndex >= lines.length) {
            if (exerciseName.length > 3) {
                exercises.push({ name: exerciseName });
            }
            break;
        }
        
        // Processar linha de dados (SET REPS [OBS] INTERVALO)
        // nameEndIndex aponta para a linha que começa com número (dados do exercício)
        // Exemplo: se nome termina na linha 9, nameEndIndex = 10 (linha com "4 15-15-12-10")
        let sets = '';
        let reps = '';
        let obs = '';
        let rest = '';
        let nextLineIndex = nameEndIndex + 1; // Próxima linha após a linha de dados (inicializar aqui para usar depois)
        
        // Verificar se há uma linha de dados após o nome
        if (nameEndIndex < lines.length) {
            const dataLine = lines[nameEndIndex].trim();
            
            // Verificar se a linha começa com número (pode ser SET ou apenas REPS)
            if (/^\d+/.test(dataLine)) {
                const parts = dataLine.split(/\s+/);
                
                // Verificar se é apenas um range de REPS (ex: "20-15-12-10-15")
                // Mas também pode ser SET seguido de REPS (ex: "4 15-15-12-10")
                if (parts.length === 1 && dataLine.match(/^\d+(-\d+)+$/)) {
                    // É apenas REPS (range), não tem SET na mesma linha
                    reps = dataLine;
                    // Verificar próxima linha para INTERVALO (mais comum: REPS na linha atual, INTERVALO na próxima)
                    if (nextLineIndex < lines.length) {
                        const nextLine = lines[nextLineIndex].trim();
                        // Verificar se é INTERVALO primeiro (mais comum)
                        // Regex melhorado para capturar "2 min", "45 s", "1,5 min", "1min", "1 min.", "Sem descanso"
                        if (nextLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\.?\b|\d+[,.]?\d*(?:min|s|MIN|S)\.?\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\.?\b)/i)) {
                            // É INTERVALO
                            rest = nextLine;
                            nextLineIndex++;
                        } else if (/^\d+/.test(nextLine)) {
                            // Se próxima linha começa com número, pode ser SET
                            const nextParts = nextLine.split(/\s+/);
                            // Se é um número simples, pode ser SET
                            if (nextParts.length === 1 && /^\d+$/.test(nextLine)) {
                                sets = nextLine;
                                nextLineIndex++;
                                // Verificar linha seguinte para INTERVALO
                                if (nextLineIndex < lines.length) {
                                    const intervalLine = lines[nextLineIndex].trim();
                                    if (intervalLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\b|\d+[,.]?\d*(?:min|s|MIN|S)\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\b)/i)) {
                                        rest = intervalLine;
                                        nextLineIndex++;
                                    }
                                }
                            }
                        }
                    }
                } else if (parts.length === 1 && dataLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\.?\b|\d+[,.]?\d*(?:min|s|MIN|S)\.?\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\.?\b)/i)) {
                    // É apenas INTERVALO
                    rest = dataLine;
                    nextLineIndex++;
                } else if (parts.length >= 2) {
                    // Linha tem múltiplos elementos, processar normalmente
                    // Padrão: número (SET) seguido de número/range (REPS) seguido opcionalmente de OBS e INTERVALO
                    // Exemplo: "4 15-15-12-10" -> SET=4, REPS=15-15-12-10
                    sets = parts[0];
                    reps = parts[1];
                    
                    // Verificar se há intervalo na mesma linha
                    let intervalIndex = -1;
                    for (let j = 2; j < parts.length; j++) {
                        const part = parts[j];
                        // Verificar se é intervalo: contém "min", "s", ou "Sem descanso"
                        if (part.match(/(?:min|s|Sem descanso|sem descanso)/i) || 
                            (j > 2 && parts[j-1].match(/^\d+[,.]?\d*$/) && part.match(/^(?:min|s)/i))) {
                            intervalIndex = j;
                            break;
                        }
                    }
                    
                    if (intervalIndex > 0) {
                        // INTERVALO encontrado na mesma linha
                        // Verificar se há OBS entre REPS e INTERVALO
                        if (intervalIndex > 2) {
                            const middleText = parts.slice(2, intervalIndex).join(' ');
                            // Se o texto médio não é numérico, é OBS
                            if (!middleText.match(/^\d+([-x]\d+)*$/)) {
                                obs = middleText;
                            }
                        }
                        rest = parts.slice(intervalIndex).join(' ');
                    } else {
                        // INTERVALO não está na mesma linha
                        // Verificar se há OBS na mesma linha (texto não numérico após REPS)
                        if (parts.length > 2) {
                            const remainingText = parts.slice(2).join(' ');
                            // Se não é numérico e não contém "min" ou "s", pode ser OBS
                            if (!remainingText.match(/^\d+([-x]\d+)*$/) && 
                                !remainingText.match(/(?:min|s)/i)) {
                                obs = remainingText;
                            }
                        }
                        
                        // SEMPRE verificar próxima linha para intervalo quando não está na mesma linha
                        // Este é o caso mais comum: SET REPS na linha atual, INTERVALO na próxima
                        // Exemplo: linha 10 = "4 15-15-12-10", linha 11 = "2 min"
                        // nextLineIndex já está apontando para a próxima linha (nameEndIndex + 1)
                        if (nextLineIndex < lines.length) {
                            const nextLine = lines[nextLineIndex].trim();
                            
                            // Padrões de intervalo: "2 min", "45 s", "1,5 min", "30 s", "1min", "1 min.", "Sem descanso"
                            // Verificar se a linha é APENAS um intervalo
                            // IMPORTANTE: Verificar primeiro se é intervalo antes de verificar outras coisas
                            // Regex simplificado e mais direto para capturar intervalos
                            // Aceita: "2 min", "45 s", "1,5 min", "30 s", "1min", "45s", "1 min.", "Sem descanso"
                            // Padrão: número (opcionalmente com vírgula/ponto) seguido de espaço opcional e "min" ou "s" (com ou sem ponto)
                            // OU "Sem descanso" (case insensitive)
                            const isIntervalPattern = /^(\d+[,.]?\d*\s*(?:min|s)\.?\b|\d+[,.]?\d*(?:min|s)\.?\b|Sem\s+descanso|sem\s+descanso)$/i;
                            
                            if (isIntervalPattern.test(nextLine)) {
                                // É um intervalo válido
                                rest = nextLine;
                                nextLineIndex++; // Pular essa linha
                            } else if (nextLine.length > 0 && !/^\d+/.test(nextLine) && nextLine.match(/^(?:cada|em|com|no|na|pé|pés|frente|em cima)/i)) {
                                // Pode ser OBS na próxima linha (ex: "cada perna", "pé da frente")
                                // Verificar se há mais linhas de OBS
                                let obsLines = [nextLine];
                                let obsEndIndex = nextLineIndex + 1;
                                
                                // Coletar todas as linhas de OBS até encontrar intervalo ou próximo exercício
                                while (obsEndIndex < lines.length) {
                                    const obsLine = lines[obsEndIndex].trim();
                                    if (obsLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s)|Sem descanso|sem descanso)/i)) {
                                        // Encontrou intervalo
                                        rest = obsLine;
                                        nextLineIndex = obsEndIndex + 1;
                                        break;
                                    } else if (/^\d+/.test(obsLine) && !obsLine.match(/^\d+(-\d+)+$/)) {
                                        // Próximo exercício (não é apenas REPS)
                                        nextLineIndex = obsEndIndex;
                                        break;
                                    } else if (obsLine.length > 0 && !obsLine.match(/^(?:Esteira:|ESTRUTURA|--|TREINO|Treino|PRESCRIÇÃO)/i)) {
                                        obsLines.push(obsLine);
                                        obsEndIndex++;
                                    } else {
                                        nextLineIndex = obsEndIndex;
                                        break;
                                    }
                                }
                                
                                if (obsLines.length > 0) {
                                    obs = obsLines.join(' ');
                                }
                                
                                if (!rest && obsEndIndex < lines.length) {
                                    const intervalLine = lines[obsEndIndex].trim();
                                    if (intervalLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\.?\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\.?\b)/i)) {
                                        rest = intervalLine;
                                        nextLineIndex = obsEndIndex + 1;
                                    }
                                }
                            } else {
                                // Não é intervalo nem OBS, pode ser próximo exercício
                                // Manter nextLineIndex onde está (não incrementar)
                            }
                        }
                    }
                } else {
                    // Linha tem apenas um número, pode ser SET ou REPS
                    // Se é um número simples, assumir que é SET e procurar REPS na próxima linha
                    if (/^\d+$/.test(dataLine)) {
                        sets = dataLine;
                        // Verificar próxima linha para REPS
                        if (nextLineIndex < lines.length) {
                            const nextLine = lines[nextLineIndex].trim();
                            if (/^\d+/.test(nextLine)) {
                                const nextParts = nextLine.split(/\s+/);
                                if (nextParts.length >= 1) {
                                    reps = nextParts[0];
                                    // Verificar se há mais dados na mesma linha
                                    if (nextParts.length > 1) {
                                        // Pode ter OBS ou INTERVALO
                                        let intervalIndex = -1;
                                        for (let j = 1; j < nextParts.length; j++) {
                                            if (nextParts[j].match(/(?:min|s|Sem descanso|sem descanso)/i)) {
                                                intervalIndex = j;
                                                break;
                                            }
                                        }
                                        if (intervalIndex > 0) {
                                            if (intervalIndex > 1) {
                                                obs = nextParts.slice(1, intervalIndex).join(' ');
                                            }
                                            rest = nextParts.slice(intervalIndex).join(' ');
                                        } else {
                                            obs = nextParts.slice(1).join(' ');
                                        }
                                    }
                                    nextLineIndex++;
                                    // Verificar linha seguinte para INTERVALO se ainda não encontrou
                                    if (!rest && nextLineIndex < lines.length) {
                                        const intervalLine = lines[nextLineIndex].trim();
                                        if (intervalLine.match(/^(?:\d+[,.]?\d*\s*(?:min|s|MIN|S)\.?\b|\d+[,.]?\d*(?:min|s|MIN|S)\.?\b|Sem descanso|sem descanso|\d+\s+(?:min|s|MIN|S)\.?\b)/i)) {
                                            rest = intervalLine;
                                            nextLineIndex++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Validar que temos pelo menos nome
        // Nome deve ter pelo menos 3 caracteres e não ser um cabeçalho
        // SET é opcional (pode não estar presente em alguns formatos)
        if (exerciseName.length >= 3 && 
            !exerciseName.match(/^(?:EXERCICIO|EXERCÍCIO|SET|REPS|OBS|INTERVALO|TREINO|Treino|NOME|DATA|PRESCRIÇÃO|ESTRUTURA|Esteira|QUARTA-FEIRA|DESCANSO)/i)) {
            // Adicionar exercício com todos os dados disponíveis
            const exercise: Exercise = {
                name: exerciseName,
                sets: sets || undefined,
                reps: reps || undefined,
                tips: obs || undefined,
                rest: rest || undefined,
            };
            
            // Debug temporário para verificar intervalos
            if (exerciseName.toLowerCase().includes('puxada') || exerciseName.toLowerCase().includes('remada')) {
                console.log('[DEBUG INTERVALO]', {
                    exercise: exerciseName,
                    sets,
                    reps,
                    rest: rest || 'VAZIO',
                    nextLineIndex,
                    totalLines: lines.length,
                });
            }
            
            exercises.push(exercise);
        }
        
        // Atualizar i para continuar do ponto correto
        i = nextLineIndex;
    }
    
    return exercises;
}

/**
 * Extrai exercícios do texto (fallback para formatos antigos)
 * Suporta múltiplos formatos incluindo tabelas com colunas separadas
 */
function extractExercises(text: string): Exercise[] {
    const exercises: Exercise[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.length < 3) continue;

        // Padrão 1: Tabela com colunas separadas (EXERCICIO | SET | REPS | OBS | INTERVALO)
        const tablePattern = /^([^|]+?)\s*\|\s*(\d+)?\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]+?)$/i;
        const tableMatch = trimmed.match(tablePattern);
        
        if (tableMatch) {
            const name = tableMatch[1].trim();
            const sets = tableMatch[2]?.trim() || '';
            const reps = tableMatch[3]?.trim() || '';
            const obs = tableMatch[4]?.trim() || '';
            const intervalo = tableMatch[5]?.trim() || '';

            exercises.push({
                name: name,
                sets: sets || undefined,
                reps: reps || undefined,
                tips: obs || undefined,
                rest: intervalo || undefined,
            });
            continue;
        }

        // Padrão 2: Nome do exercício seguido de séries x repetições
        const exercisePattern = /^([A-Za-zÀ-ÿ\s]+?)\s+(\d+)x(\d+[-]?\d*)\s*(?:\(([^)]+)\))?/i;
        const match = trimmed.match(exercisePattern);

        if (match) {
            const name = match[1].trim();
            const sets = match[2];
            const reps = match[3];
            const extraInfo = match[4]?.trim() || '';

            let rest: string | undefined;
            let tips: string | undefined;

            if (extraInfo) {
                const restMatch = extraInfo.match(/(?:descanso|intervalo|rest)[:\s]+([^\s,]+)/i);
                if (restMatch) {
                    rest = restMatch[1];
                } else if (extraInfo.match(/(?:sem\s+)?descanso/i)) {
                    rest = 'Sem descanso';
                }

                if (!rest) {
                    tips = extraInfo;
                } else {
                    const obsMatch = extraInfo.replace(restMatch?.[0] || '', '').trim();
                    if (obsMatch && obsMatch !== rest) {
                        tips = obsMatch;
                    }
                }
            }

            exercises.push({
                name: name,
                sets: sets,
                reps: reps,
                tips: tips,
                rest: rest,
            });
        } else {
            // Padrão 3: Apenas nome do exercício
            if (!trimmed.match(/^(?:dia|foco|duração|intensidade|observações|descanso|exercício|set|reps|obs|intervalo|TREINO|Treino|PRESCRIÇÃO|ESTRUTURA)/i) &&
                trimmed.length > 5 &&
                !trimmed.match(/^\d+$/) &&
                !trimmed.match(/^[•\-\*]/)) {
                exercises.push({
                    name: trimmed,
                });
            }
        }
    }

    return exercises;
}

/**
 * Infere o foco do treino baseado nos exercícios
 */
function inferFocusFromExercises(exercises: Exercise[]): string {
    const exerciseNames = exercises.map(e => typeof e === 'string' ? e : e.name).join(' ').toLowerCase();
    
    if (exerciseNames.match(/(peito|supino|crucifixo|peitoral)/i)) {
        return 'Peito e Tríceps';
    }
    if (exerciseNames.match(/(costas|remada|puxada|puxar)/i)) {
        return 'Costas e Bíceps';
    }
    if (exerciseNames.match(/(perna|agachamento|leg|quadriceps|posterior)/i)) {
        return 'Pernas';
    }
    if (exerciseNames.match(/(ombro|desenvolvimento|elevação)/i)) {
        return 'Ombros';
    }
    if (exerciseNames.match(/(braço|bíceps|tríceps|rosca)/i)) {
        return 'Braços';
    }
    
    return 'Corpo Inteiro';
}

/**
 * Retorna um plano padrão caso não consiga parsear
 */
function getDefaultWorkoutPlan(): WorkoutDay[] {
    return [
        {
            dia_semana: 'Segunda-feira',
            foco_treino: 'Corpo Inteiro',
            exercicios: [
                { name: 'Agachamento', sets: '3', reps: '12' },
                { name: 'Supino', sets: '3', reps: '10' },
                { name: 'Remada', sets: '3', reps: '12' }
            ],
            duracao_estimada: '60 minutos',
            intensidade: 'moderada'
        }
    ];
}

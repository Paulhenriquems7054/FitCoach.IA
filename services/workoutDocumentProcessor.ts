/**
 * Serviço para processar documentos de treino (Word/PDF)
 * Extrai texto dos arquivos e retorna para parsing
 */

import { logger } from '../utils/logger';

/**
 * Processa um arquivo Word (.docx) e extrai texto
 */
export async function processWordDocument(file: File | Blob): Promise<string> {
    try {
        // Tentar importar mammoth dinamicamente
        const mammoth = await import('mammoth').catch(() => null);
        
        if (!mammoth) {
            logger.warn('Biblioteca mammoth não disponível, usando fallback', 'workoutDocumentProcessor');
            return await processWordFallback(file);
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        return result.value;
    } catch (error) {
        logger.error('Erro ao processar documento Word', 'workoutDocumentProcessor', error);
        return await processWordFallback(file);
    }
}

/**
 * Processa um arquivo PDF e extrai texto
 */
export async function processPdfDocument(file: File | Blob): Promise<string> {
    try {
        // Tentar importar pdf-parse dinamicamente
        const pdfParse = await import('pdf-parse').catch(() => null);
        
        if (!pdfParse) {
            logger.warn('Biblioteca pdf-parse não disponível, usando fallback', 'workoutDocumentProcessor');
            return await processPdfFallback(file);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse.default(buffer);
        
        return data.text;
    } catch (error) {
        logger.error('Erro ao processar documento PDF', 'workoutDocumentProcessor', error);
        return await processPdfFallback(file);
    }
}

/**
 * Processa um documento baseado na extensão
 */
export async function processDocument(file: File | Blob, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
        case 'docx':
        case 'doc':
            return await processWordDocument(file);
        case 'pdf':
            return await processPdfDocument(file);
        default:
            throw new Error(`Formato de arquivo não suportado: ${extension}`);
    }
}

/**
 * Processa um arquivo Word da pasta public
 */
export async function processPublicWordFile(filename: string): Promise<string> {
    try {
        const response = await fetch(`/GIFS/TREINOS/${encodeURIComponent(filename)}`, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            // Se arquivo não encontrado, retornar string vazia (fallback será usado)
            if (response.status === 404) {
                logger.warn(`Arquivo não encontrado: ${filename}`, 'workoutDocumentProcessor');
                return '';
            }
            throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        return await processWordDocument(blob);
    } catch (error) {
        // Não lançar erro, apenas logar e retornar vazio (fallback será usado)
        logger.warn(`Erro ao processar arquivo público Word: ${filename}`, 'workoutDocumentProcessor', error);
        return '';
    }
}

/**
 * Processa um arquivo PDF da pasta public
 */
export async function processPublicPdfFile(filename: string): Promise<string> {
    try {
        const response = await fetch(`/GIFS/TREINOS/${encodeURIComponent(filename)}`, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            // Se arquivo não encontrado, retornar string vazia (fallback será usado)
            if (response.status === 404) {
                logger.warn(`Arquivo não encontrado: ${filename}`, 'workoutDocumentProcessor');
                return '';
            }
            throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        return await processPdfDocument(blob);
    } catch (error) {
        // Não lançar erro, apenas logar e retornar vazio (fallback será usado)
        logger.warn(`Erro ao processar arquivo público PDF: ${filename}`, 'workoutDocumentProcessor', error);
        return '';
    }
}

/**
 * Processa um arquivo público baseado na extensão
 */
export async function processPublicFile(filename: string): Promise<string> {
    try {
        const extension = filename.toLowerCase().split('.').pop();
        
        switch (extension) {
            case 'docx':
            case 'doc':
                return await processPublicWordFile(filename);
            case 'pdf':
                return await processPublicPdfFile(filename);
            default:
                logger.warn(`Formato de arquivo não suportado: ${extension}`, 'workoutDocumentProcessor');
                return ''; // Retornar vazio ao invés de lançar erro
        }
    } catch (error) {
        logger.warn(`Erro ao processar arquivo público: ${filename}`, 'workoutDocumentProcessor', error);
        return ''; // Retornar vazio para usar fallback
    }
}

// ==================== FALLBACKS ====================

/**
 * Fallback para processar Word quando mammoth não está disponível
 */
async function processWordFallback(file: File | Blob): Promise<string> {
    // Retornar texto vazio e deixar o sistema usar dados mockados
    logger.warn('Usando fallback para Word - retornando texto vazio', 'workoutDocumentProcessor');
    return '';
}

/**
 * Fallback para processar PDF quando pdf-parse não está disponível
 */
async function processPdfFallback(file: File | Blob): Promise<string> {
    // Retornar texto vazio e deixar o sistema usar dados mockados
    logger.warn('Usando fallback para PDF - retornando texto vazio', 'workoutDocumentProcessor');
    return '';
}

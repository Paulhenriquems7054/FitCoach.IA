export interface ActivityLog {
  id: string;
  event: string;
  ip?: string;
  timestamp: string;
  type: 'login' | 'profile' | 'plan' | 'report' | 'security' | 'other';
  details?: Record<string, any>;
}

const STORAGE_KEY = 'nutri_ia_activity_logs';
const MAX_LOGS = 100; // Manter apenas os últimos 100 logs

/**
 * Obtém o IP do usuário (opcional - não bloqueia se falhar)
 * Retorna 'N/A' se offline ou se a API falhar
 */
const getUserIP = async (): Promise<string> => {
  // Verificar se está online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'N/A';
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout de 2s
    
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || 'N/A';
    }
    return 'N/A';
  } catch {
    // Silenciosamente retorna 'N/A' se falhar (app funciona sem IP)
    return 'N/A';
  }
};

/**
 * Salva um log de atividade
 */
export const logActivity = async (
  event: string,
  type: ActivityLog['type'] = 'other',
  details?: Record<string, any>
): Promise<void> => {
  try {
    const logs = getActivityLogs();
    const ip = await getUserIP();
    
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      ip,
      timestamp: new Date().toLocaleString('pt-BR'),
      type,
      details,
    };

    logs.unshift(newLog);
    
    // Manter apenas os últimos MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs.splice(MAX_LOGS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Erro ao salvar log de atividade:', error);
  }
};

/**
 * Obtém todos os logs de atividade
 */
export const getActivityLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ActivityLog[];
  } catch {
    return [];
  }
};

/**
 * Filtra logs por tipo
 */
export const filterLogsByType = (logs: ActivityLog[], type: ActivityLog['type']): ActivityLog[] => {
  return logs.filter(log => log.type === type);
};

/**
 * Filtra logs por data
 */
export const filterLogsByDate = (logs: ActivityLog[], startDate?: Date, endDate?: Date): ActivityLog[] => {
  if (!startDate && !endDate) return logs;
  
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;
    return true;
  });
};

/**
 * Limpa todos os logs
 */
export const clearActivityLogs = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Exporta logs em formato JSON
 */
export const exportActivityLogs = (): void => {
  const logs = getActivityLogs();
  const jsonString = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nutri-ia-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location?: string;
  ip?: string;
  lastActivity: string;
  isCurrent: boolean;
}

const STORAGE_KEY = 'nutri_ia_active_sessions';
const SESSION_ID_KEY = 'nutri_ia_current_session_id';

/**
 * Detecta informações do dispositivo e navegador
 */
const detectDeviceInfo = (): { device: string; browser: string } => {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  let browser = 'Unknown';

  // Detectar dispositivo
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /iphone|ipad/i.test(ua) ? 'iOS' : 'Android';
  } else if (/tablet/i.test(ua)) {
    device = 'Tablet';
  }

  // Detectar navegador
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  return { device, browser };
};

/**
 * Obtém o IP do usuário
 */
const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'N/A';
  } catch {
    return 'N/A';
  }
};

/**
 * Cria ou atualiza a sessão atual
 */
export const createOrUpdateSession = async (): Promise<ActiveSession> => {
  const existingSessionId = localStorage.getItem(SESSION_ID_KEY);
  const sessions = getActiveSessions();
  const { device, browser } = detectDeviceInfo();
  const ip = await getUserIP();
  const now = new Date().toISOString();

  let currentSession: ActiveSession;

  if (existingSessionId) {
    // Atualizar sessão existente
    const existingSession = sessions.find(s => s.id === existingSessionId);
    if (existingSession) {
      existingSession.lastActivity = now;
      existingSession.isCurrent = true;
      currentSession = existingSession;
    } else {
      // Criar nova sessão se a anterior não existir
      currentSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        device,
        browser,
        ip,
        lastActivity: now,
        isCurrent: true,
      };
      sessions.push(currentSession);
      localStorage.setItem(SESSION_ID_KEY, currentSession.id);
    }
  } else {
    // Criar nova sessão
    currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      device,
      browser,
      ip,
      lastActivity: now,
      isCurrent: true,
    };
    sessions.push(currentSession);
    localStorage.setItem(SESSION_ID_KEY, currentSession.id);
  }

  // Marcar outras sessões como não atuais
  sessions.forEach(s => {
    if (s.id !== currentSession.id) {
      s.isCurrent = false;
    }
  });

  // Limitar a 10 sessões
  if (sessions.length > 10) {
    sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    sessions.splice(10);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return currentSession;
};

/**
 * Obtém todas as sessões ativas
 */
export const getActiveSessions = (): ActiveSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const sessions = JSON.parse(stored) as ActiveSession[];
    return sessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  } catch {
    return [];
  }
};

/**
 * Encerra uma sessão específica
 */
export const endSession = (sessionId: string): void => {
  const sessions = getActiveSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  
  // Se for a sessão atual, limpar
  const currentSessionId = localStorage.getItem(SESSION_ID_KEY);
  if (currentSessionId === sessionId) {
    localStorage.removeItem(SESSION_ID_KEY);
  }
};

/**
 * Encerra todas as sessões exceto a atual
 */
export const endAllOtherSessions = (): void => {
  const sessions = getActiveSessions();
  const currentSession = sessions.find(s => s.isCurrent);
  if (currentSession) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([currentSession]));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};


/**
 * Sistema centralizado de logging para o Nutri.IA
 * 
 * Em produção, os logs são removidos automaticamente pelo Terser.
 * Em desenvolvimento, os logs são exibidos no console.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error | unknown;
  timestamp: number;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Limitar quantidade de logs em memória

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const contextStr = context ? `[${context}]` : '';
    return `${contextStr} ${message}`;
  }

  private addLog(entry: LogEntry): void {
    if (!this.isDevelopment) return;
    
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove o log mais antigo
    }
  }

  debug(message: string, context?: string): void {
    if (!this.isDevelopment) return;
    const entry: LogEntry = {
      level: 'debug',
      message,
      context,
      timestamp: Date.now(),
    };
    this.addLog(entry);
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: string): void {
    if (!this.isDevelopment) return;
    const entry: LogEntry = {
      level: 'info',
      message,
      context,
      timestamp: Date.now(),
    };
    this.addLog(entry);
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: string, error?: Error | unknown): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      context,
      error,
      timestamp: Date.now(),
    };
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context), error);
    }
  }

  error(message: string, context?: string, error?: Error | unknown): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      context,
      error,
      timestamp: Date.now(),
    };
    this.addLog(entry);
    
    // Em produção, ainda logamos erros críticos
    console.error(this.formatMessage('error', message, context), error);
    
    // Aqui você pode adicionar integração com serviços de error tracking
    // como Sentry, se necessário
  }

  /**
   * Obtém os logs armazenados (útil para debug)
   */
  getLogs(): ReadonlyArray<LogEntry> {
    return [...this.logs];
  }

  /**
   * Limpa os logs armazenados
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Exportar instância singleton
export const logger = new Logger();

// Exportar tipos para uso em outros arquivos
export type { LogLevel, LogEntry };


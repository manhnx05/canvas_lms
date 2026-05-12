/**
 * Structured logging system
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  maxLogs: number;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private readonly maxLogsInMemory = 1000;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
      maxLogs: 1000,
      ...config
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, context?: Record<string, any>): void {
    const errorInfo = error ? {
      message: error.message || String(error),
      stack: error.stack,
      code: error.code
    } : undefined;

    this.log(LogLevel.ERROR, message, context, errorInfo);
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error | any, context?: Record<string, any>): void {
    const errorInfo = error ? {
      message: error.message || String(error),
      stack: error.stack,
      code: error.code
    } : undefined;

    this.log(LogLevel.FATAL, message, context, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: { message: string; stack?: string; code?: string }
  ): void {
    // Check if log level is enabled
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  /**
   * Log to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}]`;
    
    const logData = {
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.error && { error: entry.error })
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logData);
        break;
      case LogLevel.INFO:
        console.info(prefix, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, logData);
        break;
    }
  }

  /**
   * Get recent logs
   */
  getLogs(limit?: number, level?: LogLevel): LogEntry[] {
    let filtered = this.logs;

    if (level !== undefined) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (limit) {
      return filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Get log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      },
      recentErrors: this.logs
        .filter(log => log.level >= LogLevel.ERROR)
        .slice(-5)
        .map(log => ({
          timestamp: log.timestamp,
          message: log.message,
          error: log.error?.message
        }))
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level].toLowerCase() as keyof typeof stats.byLevel;
      stats.byLevel[levelName]++;
    });

    return stats;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Create a child logger with context
 */
export function createLogger(defaultContext: Record<string, any>): Logger {
  const childLogger = new Logger();
  
  // Override log methods to include default context
  const originalLog = (childLogger as any).log.bind(childLogger);
  (childLogger as any).log = function(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: any
  ) {
    originalLog(level, message, { ...defaultContext, ...context }, error);
  };

  return childLogger;
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  const level = statusCode >= 500 ? LogLevel.ERROR : 
                statusCode >= 400 ? LogLevel.WARN : 
                LogLevel.INFO;

  logger.log(level, `API Request: ${method} ${path}`, {
    method,
    path,
    statusCode,
    duration,
    userId
  });
}

/**
 * Log database query
 */
export function logDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  error?: Error
): void {
  if (error) {
    logger.error(`Database Error: ${operation} on ${table}`, error, {
      operation,
      table,
      duration
    });
  } else if (duration > 1000) {
    logger.warn(`Slow Database Query: ${operation} on ${table}`, {
      operation,
      table,
      duration
    });
  } else {
    logger.debug(`Database Query: ${operation} on ${table}`, {
      operation,
      table,
      duration
    });
  }
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'failed_login',
  userId?: string,
  email?: string,
  reason?: string
): void {
  const level = event === 'failed_login' ? LogLevel.WARN : LogLevel.INFO;
  
  logger.log(level, `Auth Event: ${event}`, {
    event,
    userId,
    email,
    reason
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
): void {
  const level = severity === 'critical' || severity === 'high' ? 
                LogLevel.ERROR : LogLevel.WARN;
  
  logger.log(level, `Security Event: ${event}`, {
    event,
    severity,
    ...details
  });
}

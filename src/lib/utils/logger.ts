/**
 * Structured logging utility
 * Provides consistent logging format across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Logger class for structured logging
 */
class Logger {
  private serviceName: string;

  constructor(serviceName: string = 'url-shortener') {
    this.serviceName = serviceName;
  }

  /**
   * Format log entry as JSON
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context: { ...context, service: this.serviceName } }),
    };

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        ...(error.stack && { stack: error.stack }),
      };
    }

    return entry;
  }

  /**
   * Write log to console
   */
  private write(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      this.write(this.formatLog('debug', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.write(this.formatLog('info', message, context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.write(this.formatLog('warn', message, context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.write(this.formatLog('error', message, context, error));
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.serviceName);

    // Override write method to include parent context
    const originalWrite = childLogger.write.bind(childLogger);
    childLogger.write = (entry: LogEntry) => {
      entry.context = {
        ...context,
        ...entry.context,
      };
      originalWrite(entry);
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger for a specific API route
 */
export function createRouteLogger(route: string): Logger {
  return logger.child({ route });
}

/**
 * Create a logger for a specific service
 */
export function createServiceLogger(service: string): Logger {
  return logger.child({ service });
}

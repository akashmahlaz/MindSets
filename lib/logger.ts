/**
 * Production-safe logger utility
 * Only logs in development mode (__DEV__)
 * In production, logs are silenced to improve performance and security
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enabledLevels: LogLevel[];
  prefix: string;
}

const defaultConfig: LoggerConfig = {
  enabledLevels: ['log', 'info', 'warn', 'error', 'debug'],
  prefix: '[MindHeal]',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    // Only log in development mode
    if (!__DEV__) return false;
    return this.config.enabledLevels.includes(level);
  }

  private formatMessage(level: LogLevel, ...args: unknown[]): string[] {
    const timestamp = new Date().toISOString();
    const prefix = `${this.config.prefix} [${level.toUpperCase()}] ${timestamp}:`;
    return [prefix, ...args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    )];
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', ...args));
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}${prefix}`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for creating child loggers with specific contexts
export const createLogger = (prefix: string): Logger => {
  return new Logger({ prefix: `[MindHeal]${prefix}` });
};

// Export class for custom configurations
export { Logger };


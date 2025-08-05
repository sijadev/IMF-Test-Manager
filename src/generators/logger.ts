// ========================================
// CENTRALIZED LOGGING UTILITY
// ========================================

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk').default || require('chalk');

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type LogOutput = 'console' | 'file' | 'both';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, any>;
  error?: Error;
}

interface LoggerConfig {
  level: LogLevel;
  output: LogOutput;
  logDir: string;
  maxFileSize: number; // in MB
  maxFiles: number;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableMetadata: boolean;
}

/**
 * Centralized logging utility for IMF Test Manager
 */
class Logger {
  private static globalConfig: LoggerConfig = {
    level: 'info',
    output: 'console',
    logDir: './logs',
    maxFileSize: 10,
    maxFiles: 5,
    enableColors: true,
    enableTimestamp: true,
    enableMetadata: true
  };

  private static logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  private static fileHandle: any = null;

  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  // ========================================
  // STATIC CONFIGURATION METHODS
  // ========================================

  static setLevel(level: LogLevel): void {
    Logger.globalConfig.level = level;
  }

  static setOutput(output: LogOutput): void {
    Logger.globalConfig.output = output;
  }

  static enableFileLogging(logDir?: string): void {
    if (logDir) {
      Logger.globalConfig.logDir = logDir;
    }
    Logger.globalConfig.output = Logger.globalConfig.output === 'console' ? 'both' : 'file';
    Logger.initializeFileLogging();
  }

  static disableColors(): void {
    Logger.globalConfig.enableColors = false;
  }

  static configure(config: Partial<LoggerConfig>): void {
    Logger.globalConfig = { ...Logger.globalConfig, ...config };
    if (config.output === 'file' || config.output === 'both') {
      Logger.initializeFileLogging();
    }
  }

  // ========================================
  // INSTANCE LOGGING METHODS
  // ========================================

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log('error', message, metadata, error);
  }

  fatal(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log('fatal', message, metadata, error);
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      metadata,
      error
    };

    this.writeLog(logEntry);
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.logLevels[level] >= Logger.logLevels[Logger.globalConfig.level];
  }

  private writeLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);

    if (Logger.globalConfig.output === 'console' || Logger.globalConfig.output === 'both') {
      console.log(formattedMessage.console);
    }

    if (Logger.globalConfig.output === 'file' || Logger.globalConfig.output === 'both') {
      this.writeToFile(formattedMessage.file);
    }
  }

  private formatMessage(entry: LogEntry): { console: string; file: string } {
    const timestamp = Logger.globalConfig.enableTimestamp 
      ? entry.timestamp.toISOString() 
      : '';
    
    const level = entry.level.toUpperCase().padEnd(5);
    const component = `[${entry.component}]`;
    
    // Base message
    let baseMessage = '';
    if (timestamp) baseMessage += `${timestamp} `;
    baseMessage += `${level} ${component} ${entry.message}`;
    
    // Add metadata if present and enabled
    if (Logger.globalConfig.enableMetadata && entry.metadata) {
      const metadataStr = JSON.stringify(entry.metadata, null, 2);
      baseMessage += `\n  Metadata: ${metadataStr}`;
    }
    
    // Add error details if present
    if (entry.error) {
      baseMessage += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        baseMessage += `\n  Stack: ${entry.error.stack}`;
      }
    }

    // Create colored version for console
    let coloredMessage = baseMessage;
    if (Logger.globalConfig.enableColors) {
      coloredMessage = this.colorizeMessage(entry, baseMessage);
    }

    return {
      console: coloredMessage,
      file: baseMessage
    };
  }

  private colorizeMessage(entry: LogEntry, message: string): string {
    const colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
      fatal: chalk.red.bold
    };

    const colorFn = colors[entry.level];
    
    // Color the level part
    const parts = message.split(' ');
    if (parts.length >= 3) {
      parts[1] = colorFn(parts[1]); // Color the level
      parts[2] = chalk.cyan(parts[2]); // Color the component
    }
    
    return parts.join(' ');
  }

  private writeToFile(message: string): void {
    if (!Logger.fileHandle) {
      Logger.initializeFileLogging();
    }

    if (Logger.fileHandle) {
      Logger.fileHandle.write(message + '\n');
    }
  }

  private static initializeFileLogging(): void {
    try {
      // Ensure log directory exists
      fs.ensureDirSync(Logger.globalConfig.logDir);

      // Generate log file name
      const logFileName = `imf-test-manager-${new Date().toISOString().split('T')[0]}.log`;
      const logPath = path.join(Logger.globalConfig.logDir, logFileName);

      // Close existing file handle
      if (Logger.fileHandle) {
        Logger.fileHandle.end();
      }

      // Create new file handle
      Logger.fileHandle = fs.createWriteStream(logPath, { flags: 'a' });

      // Handle file rotation
      Logger.checkFileRotation(logPath);

    } catch (error) {
      console.error('Failed to initialize file logging:', error);
    }
  }

  private static checkFileRotation(logPath: string): void {
    try {
      const stats = fs.statSync(logPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > Logger.globalConfig.maxFileSize) {
        Logger.rotateLogFile(logPath);
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
    }
  }

  private static rotateLogFile(logPath: string): void {
    try {
      const logDir = path.dirname(logPath);
      const logName = path.basename(logPath, '.log');
      
      // Close current file handle
      if (Logger.fileHandle) {
        Logger.fileHandle.end();
        Logger.fileHandle = null;
      }

      // Rotate existing files
      for (let i = Logger.globalConfig.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(logDir, `${logName}.${i}.log`);
        const newFile = path.join(logDir, `${logName}.${i + 1}.log`);
        
        if (fs.existsSync(oldFile)) {
          if (i === Logger.globalConfig.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current file to .1
      const rotatedFile = path.join(logDir, `${logName}.1.log`);
      fs.renameSync(logPath, rotatedFile);

      // Reinitialize logging
      Logger.initializeFileLogging();

    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  static createLogger(component: string): Logger {
    return new Logger(component);
  }

  static getLogLevel(): LogLevel {
    return Logger.globalConfig.level;
  }

  static isDebugEnabled(): boolean {
    return Logger.logLevels[Logger.globalConfig.level] <= Logger.logLevels.debug;
  }

  static flush(): void {
    if (Logger.fileHandle) {
      Logger.fileHandle.end();
      Logger.fileHandle = null;
    }
  }
}

// ========================================
// CONVENIENCE EXPORTS
// ========================================

const logger = new Logger('Global');

function createLogger(component: string): Logger {
  return new Logger(component);
}

function enableDebugLogging(): void {
  Logger.setLevel('debug');
}

function enableFileLogging(logDir?: string): void {
  Logger.enableFileLogging(logDir);
}

function configureLogging(config: Partial<LoggerConfig>): void {
  Logger.configure(config);
}

function disableColors(): void {
  Logger.disableColors();
}

// CommonJS exports
module.exports = {
  Logger,
  logger,
  createLogger,
  enableDebugLogging,
  enableFileLogging,
  configureLogging,
  disableColors
};

// Process cleanup
process.on('exit', () => {
  Logger.flush();
});

process.on('SIGINT', () => {
  Logger.flush();
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.flush();
  process.exit(0);
});
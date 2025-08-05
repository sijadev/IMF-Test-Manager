// ========================================
// LOG DATA GENERATOR
// ========================================

import { 
  LogEntry, 
  LogFile, 
  TestScenario, 
  LogPattern, 
  ErrorType,
  TestProfile 
} from '../types';
const { Logger } = require('./logger');

export interface LogGenerationConfig {
  baseFrequency: number; // Logs per second
  timespan: number; // Duration in milliseconds
  pattern: LogPattern;
  errorRate: number; // 0-1 percentage of error logs
  sources: string[]; // Log sources (services, components)
  outputFormat: 'json' | 'text' | 'structured';
  includeStackTraces: boolean;
  seed?: number;
}

export interface LogGenerationResult {
  logFiles: LogFile[];
  totalEntries: number;
  generationTime: number;
  statistics: {
    debugCount: number;
    infoCount: number;
    warnCount: number;
    errorCount: number;
    fatalCount: number;
  };
}

export class LogDataGenerator {
  private logger: Logger;
  private random: () => number;
  private seed: number;

  // Log message templates by category
  private messageTemplates = {
    info: [
      'Request processed successfully',
      'User {userId} logged in from {ip}',
      'Cache hit for key {key}',
      'Database connection established',
      'Service {service} started on port {port}',
      'Processing batch of {count} items',
      'Configuration loaded from {file}',
      'Health check passed for {component}',
      'Scheduled job {job} completed',
      'API rate limit reset for {user}'
    ],
    
    warn: [
      'High memory usage detected: {memory}%',
      'Slow query detected: {duration}ms',
      'Cache miss for frequently accessed key {key}',
      'Deprecated API endpoint used: {endpoint}',
      'Retry attempt {attempt} for {operation}',
      'Connection pool nearing capacity: {used}/{total}',
      'Disk space low on {disk}: {space}% remaining',
      'Rate limit approaching for {user}: {requests}/{limit}',
      'SSL certificate expires in {days} days',
      'Background job {job} taking longer than expected'
    ],
    
    error: [
      'Database connection failed: {error}',
      'Authentication failed for user {user}',
      'API request timeout: {endpoint}',
      'Failed to parse configuration: {file}',
      'Service {service} unavailable',
      'Memory allocation failed',
      'File not found: {filename}',
      'Permission denied for operation {operation}',
      'Network connection lost',
      'Invalid input data: {data}'
    ],
    
    fatal: [
      'System out of memory',
      'Database server unreachable',
      'Critical service {service} crashed',
      'Security breach detected',
      'Data corruption in {table}',
      'System overload - shutting down',
      'Critical configuration error',
      'Unrecoverable error in {component}',
      'System integrity check failed',
      'Emergency shutdown initiated'
    ],
    
    debug: [
      'Entering function {function} with args {args}',
      'Variable {var} = {value}',
      'SQL query: {query}',
      'HTTP request: {method} {url}',
      'Cache operation: {operation} on {key}',
      'Thread {thread} processing {task}',
      'Memory usage: {heap}/{total} MB',
      'Processing step {step}: {description}',
      'State transition: {from} -> {to}',
      'Debug checkpoint reached: {checkpoint}'
    ]
  };

  // Stack trace templates
  private stackTraceTemplates = [
    `at Object.processRequest (/app/src/api/handler.js:42:15)
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:137:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:112:3)`,
    
    `at DatabaseConnection.query (/app/src/db/connection.js:128:11)
    at UserService.findById (/app/src/services/user.js:56:23)
    at AuthController.authenticate (/app/src/controllers/auth.js:89:17)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)`,
    
    `at MemoryManager.allocate (/app/src/utils/memory.js:34:8)
    at CacheService.store (/app/src/services/cache.js:67:12)
    at RequestProcessor.handle (/app/src/processors/request.js:91:7)
    at Server.processRequest (/app/src/server.js:156:14)`
  ];

  // Service/source names
  private sources = [
    'api-gateway',
    'user-service',
    'auth-service',
    'database-service',
    'cache-service',
    'notification-service',
    'payment-service',
    'analytics-service',
    'file-service',
    'monitoring-service'
  ];

  constructor(config: Partial<LogGenerationConfig> = {}) {
    this.logger = new Logger('LogDataGenerator');
    this.seed = config.seed || Date.now();
    this.random = this.createSeededRandom(this.seed);
    
    this.logger.info('LogDataGenerator initialized', { 
      seed: this.seed,
      config 
    });
  }

  /**
   * Generates log data for a test scenario
   */
  async generateLogs(scenario: TestScenario, profile: TestProfile): Promise<LogGenerationResult> {
    const startTime = Date.now();
    
    this.logger.info('Starting log generation', { 
      scenarioId: scenario.id,
      profileId: profile.id 
    });

    const config = this.buildGenerationConfig(scenario, profile);
    const logFiles: LogFile[] = [];
    
    // Generate logs for each source
    for (const source of config.sources) {
      const logFile = await this.generateLogFile(source, config, scenario);
      logFiles.push(logFile);
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(logFiles);
    const totalEntries = logFiles.reduce((sum, file) => sum + file.entries.length, 0);

    const result: LogGenerationResult = {
      logFiles,
      totalEntries,
      generationTime: Date.now() - startTime,
      statistics
    };

    this.logger.info('Log generation completed', {
      scenarioId: scenario.id,
      totalEntries,
      generationTime: result.generationTime,
      statistics
    });

    return result;
  }

  /**
   * Generates a single log file for a specific source
   */
  private async generateLogFile(
    source: string, 
    config: LogGenerationConfig, 
    scenario: TestScenario
  ): Promise<LogFile> {
    const entries: LogEntry[] = [];
    const startTime = Date.now();
    const endTime = startTime + config.timespan;
    
    // Calculate log frequency based on pattern
    const frequency = this.calculateFrequency(config.pattern, config.baseFrequency);
    const interval = 1000 / frequency; // milliseconds between logs
    
    let currentTime = startTime;
    let logIndex = 0;
    
    while (currentTime < endTime) {
      // Generate log entry
      const entry = this.generateLogEntry(
        new Date(currentTime),
        source,
        config,
        scenario,
        logIndex
      );
      
      entries.push(entry);
      
      // Calculate next log time based on pattern
      const nextInterval = this.calculateNextInterval(
        interval, 
        config.pattern, 
        logIndex,
        currentTime - startTime,
        config.timespan
      );
      
      currentTime += nextInterval;
      logIndex++;
    }

    // Calculate file metadata
    const metadata = {
      totalSize: entries.reduce((sum, entry) => sum + entry.message.length, 0),
      lineCount: entries.length,
      errorCount: entries.filter(e => e.level === 'ERROR' || e.level === 'FATAL').length,
      warningCount: entries.filter(e => e.level === 'WARN').length
    };

    return {
      filePath: `/logs/${source}-${scenario.id}.log`,
      source,
      entries,
      metadata
    };
  }

  /**
   * Generates a single log entry
   */
  private generateLogEntry(
    timestamp: Date,
    source: string,
    config: LogGenerationConfig,
    scenario: TestScenario,
    index: number
  ): LogEntry {
    // Determine log level based on error rate and patterns
    const level = this.determineLogLevel(config.errorRate, config.pattern, index);
    
    // Generate message
    const message = this.generateMessage(level, source, scenario, index);
    
    // Generate metadata
    const metadata: Record<string, any> = {
      requestId: this.generateRequestId(),
      sessionId: this.generateSessionId(),
      userId: this.random() < 0.7 ? this.generateUserId() : null,
      ip: this.generateIpAddress(),
      userAgent: this.generateUserAgent()
    };

    // Add stack trace for errors if configured
    if ((level === 'ERROR' || level === 'FATAL') && config.includeStackTraces) {
      metadata.stackTrace = this.generateStackTrace();
    }

    // Determine if this is a generated entry (for problem injection)
    const isGenerated = this.shouldInjectProblem(scenario, index);
    const errorType = isGenerated ? this.selectErrorType(scenario.codeInjection.errorTypes) : undefined;

    return {
      timestamp,
      level: level as any,
      message,
      source,
      metadata,
      generated: isGenerated,
      errorType,
      scenarioId: scenario.id
    };
  }

  /**
   * Determines the log level for an entry
   */
  private determineLogLevel(
    baseErrorRate: number, 
    pattern: LogPattern, 
    index: number
  ): string {
    let errorRate = baseErrorRate;
    
    // Adjust error rate based on pattern
    switch (pattern) {
      case 'error-heavy':
        errorRate *= 3;
        break;
      case 'burst':
        // Increase error rate in bursts
        const burstCycle = Math.floor(index / 50);
        errorRate *= (burstCycle % 3 === 0) ? 5 : 0.5;
        break;
      case 'sparse':
        errorRate *= 0.3;
        break;
    }

    const rand = this.random();
    
    if (rand < errorRate * 0.1) return 'FATAL';
    if (rand < errorRate * 0.3) return 'ERROR';
    if (rand < errorRate * 0.6) return 'WARN';
    if (rand < 0.8) return 'INFO';
    return 'DEBUG';
  }

  /**
   * Generates a log message based on level and context
   */
  private generateMessage(
    level: string, 
    source: string, 
    scenario: TestScenario, 
    index: number
  ): string {
    const templates = this.messageTemplates[level.toLowerCase() as keyof typeof this.messageTemplates] || this.messageTemplates.info;
    const template = templates[Math.floor(this.random() * templates.length)];
    
    // Replace placeholders with realistic values
    return template
      .replace(/{userId}/g, this.generateUserId())
      .replace(/{ip}/g, this.generateIpAddress())
      .replace(/{key}/g, this.generateCacheKey())
      .replace(/{service}/g, source)
      .replace(/{port}/g, String(3000 + Math.floor(this.random() * 9000)))
      .replace(/{count}/g, String(Math.floor(this.random() * 1000) + 1))
      .replace(/{file}/g, '/config/app.json')
      .replace(/{component}/g, source.replace('-service', ''))
      .replace(/{job}/g, `job-${Math.floor(this.random() * 100)}`)
      .replace(/{user}/g, this.generateUsername())
      .replace(/{memory}/g, String(Math.floor(this.random() * 40) + 60))
      .replace(/{duration}/g, String(Math.floor(this.random() * 5000) + 1000))
      .replace(/{endpoint}/g, `/api/v1/${this.generateEndpoint()}`)
      .replace(/{attempt}/g, String(Math.floor(this.random() * 5) + 1))
      .replace(/{operation}/g, this.generateOperation())
      .replace(/{used}/g, String(Math.floor(this.random() * 80) + 10))
      .replace(/{total}/g, String(100))
      .replace(/{disk}/g, '/var/log')
      .replace(/{space}/g, String(Math.floor(this.random() * 20) + 5))
      .replace(/{requests}/g, String(Math.floor(this.random() * 900) + 100))
      .replace(/{limit}/g, String(1000))
      .replace(/{days}/g, String(Math.floor(this.random() * 30) + 1))
      .replace(/{error}/g, this.generateErrorMessage())
      .replace(/{filename}/g, `/tmp/file-${Math.floor(this.random() * 1000)}.tmp`)
      .replace(/{data}/g, 'invalid_json_format')
      .replace(/{table}/g, `users_${Math.floor(this.random() * 10)}`)
      .replace(/{function}/g, this.generateFunctionName())
      .replace(/{args}/g, '[object Object]')
      .replace(/{var}/g, this.generateVariableName())
      .replace(/{value}/g, String(Math.floor(this.random() * 1000)))
      .replace(/{query}/g, 'SELECT * FROM users WHERE id = ?')
      .replace(/{method}/g, this.generateHttpMethod())
      .replace(/{url}/g, `/api/${this.generateEndpoint()}`)
      .replace(/{thread}/g, `thread-${Math.floor(this.random() * 10)}`)
      .replace(/{task}/g, `task-${Math.floor(this.random() * 100)}`)
      .replace(/{heap}/g, String(Math.floor(this.random() * 512) + 256))
      .replace(/{step}/g, String(Math.floor(this.random() * 10) + 1))
      .replace(/{description}/g, 'processing user request')
      .replace(/{from}/g, 'idle')
      .replace(/{to}/g, 'processing')
      .replace(/{checkpoint}/g, `checkpoint-${Math.floor(this.random() * 20) + 1}`);
  }

  /**
   * Calculates base frequency for a pattern
   */
  private calculateFrequency(pattern: LogPattern, baseFrequency: number): number {
    switch (pattern) {
      case 'burst': return baseFrequency * 0.3; // Lower base, higher bursts
      case 'error-heavy': return baseFrequency * 1.5;
      case 'sparse': return baseFrequency * 0.4;
      case 'structured': return baseFrequency * 0.8;
      default: return baseFrequency;
    }
  }

  /**
   * Calculates the next interval between log entries
   */
  private calculateNextInterval(
    baseInterval: number,
    pattern: LogPattern,
    index: number,
    elapsed: number,
    totalDuration: number
  ): number {
    switch (pattern) {
      case 'burst':
        // Create bursts every 50 entries
        const burstPhase = index % 50;
        if (burstPhase < 10) {
          return baseInterval * 0.1; // Very frequent during burst
        } else {
          return baseInterval * 3; // Sparse between bursts
        }
        
      case 'error-heavy':
        // Gradually increase frequency toward the end
        const progress = elapsed / totalDuration;
        return baseInterval * (2 - progress);
        
      case 'sparse':
        // Add random gaps
        return baseInterval * (1 + this.random() * 3);
        
      case 'structured':
        // Regular intervals with slight variation
        return baseInterval * (0.8 + this.random() * 0.4);
        
      default:
        // Normal pattern with some randomness
        return baseInterval * (0.5 + this.random());
    }
  }

  /**
   * Builds generation configuration from scenario and profile
   */
  private buildGenerationConfig(
    scenario: TestScenario, 
    profile: TestProfile
  ): LogGenerationConfig {
    const baseFrequency = this.calculateBaseFrequency(
      profile.sourceConfig.complexity,
      scenario.type
    );
    
    return {
      baseFrequency,
      timespan: scenario.duration * 1000,
      pattern: scenario.metricsPattern.logPattern,
      errorRate: this.calculateErrorRate(scenario),
      sources: this.selectSources(profile.sourceConfig.directories.length),
      outputFormat: 'json',
      includeStackTraces: true,
      seed: this.seed
    };
  }

  private calculateBaseFrequency(complexity: string, scenarioType: string): number {
    let base = 10; // logs per second
    
    switch (complexity) {
      case 'simple': base = 5; break;
      case 'medium': base = 15; break;
      case 'complex': base = 30; break;
    }
    
    switch (scenarioType) {
      case 'performance': base *= 2; break;
      case 'security': base *= 0.7; break;
      case 'chaos': base *= 3; break;
    }
    
    return base;
  }

  private calculateErrorRate(scenario: TestScenario): number {
    let base = 0.1; // 10% base error rate
    
    switch (scenario.type) {
      case 'performance': base = 0.15; break;
      case 'security': base = 0.05; break;
      case 'chaos': base = 0.25; break;
      case 'integration': base = 0.12; break;
    }
    
    return base * scenario.codeInjection.frequency;
  }

  private selectSources(directoryCount: number): string[] {
    const count = Math.min(Math.max(directoryCount, 2), this.sources.length);
    const selected = [];
    
    for (let i = 0; i < count; i++) {
      const index = Math.floor(this.random() * this.sources.length);
      if (!selected.includes(this.sources[index])) {
        selected.push(this.sources[index]);
      }
    }
    
    return selected.length > 0 ? selected : ['api-gateway', 'user-service'];
  }

  private shouldInjectProblem(scenario: TestScenario, index: number): boolean {
    return this.random() < scenario.codeInjection.frequency * 0.1;
  }

  private selectErrorType(errorTypes: ErrorType[]): ErrorType {
    return errorTypes[Math.floor(this.random() * errorTypes.length)];
  }

  private calculateStatistics(logFiles: LogFile[]) {
    const stats = {
      debugCount: 0,
      infoCount: 0,
      warnCount: 0,
      errorCount: 0,
      fatalCount: 0
    };

    logFiles.forEach(file => {
      file.entries.forEach(entry => {
        switch (entry.level) {
          case 'DEBUG': stats.debugCount++; break;
          case 'INFO': stats.infoCount++; break;
          case 'WARN': stats.warnCount++; break;
          case 'ERROR': stats.errorCount++; break;
          case 'FATAL': stats.fatalCount++; break;
        }
      });
    });

    return stats;
  }

  // ========================================
  // UTILITY GENERATORS
  // ========================================

  private generateRequestId(): string {
    return `req-${this.generateRandomString(8)}`;
  }

  private generateSessionId(): string {
    return `sess-${this.generateRandomString(12)}`;
  }

  private generateUserId(): string {
    return `user-${Math.floor(this.random() * 10000)}`;
  }

  private generateUsername(): string {
    const names = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    return names[Math.floor(this.random() * names.length)];
  }

  private generateIpAddress(): string {
    return `${Math.floor(this.random() * 255)}.${Math.floor(this.random() * 255)}.${Math.floor(this.random() * 255)}.${Math.floor(this.random() * 255)}`;
  }

  private generateUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
    return agents[Math.floor(this.random() * agents.length)];
  }

  private generateCacheKey(): string {
    return `cache:${this.generateRandomString(6)}`;
  }

  private generateEndpoint(): string {
    const endpoints = ['users', 'posts', 'comments', 'auth', 'profile', 'settings'];
    return endpoints[Math.floor(this.random() * endpoints.length)];
  }

  private generateOperation(): string {
    const operations = ['read', 'write', 'delete', 'update', 'create'];
    return operations[Math.floor(this.random() * operations.length)];
  }

  private generateErrorMessage(): string {
    const errors = [
      'Connection timeout',
      'Invalid credentials',
      'Resource not found',
      'Permission denied',
      'Internal server error'
    ];
    return errors[Math.floor(this.random() * errors.length)];
  }

  private generateFunctionName(): string {
    const functions = ['processRequest', 'validateUser', 'saveData', 'loadConfig', 'handleError'];
    return functions[Math.floor(this.random() * functions.length)];
  }

  private generateVariableName(): string {
    const vars = ['result', 'data', 'config', 'user', 'request', 'response'];
    return vars[Math.floor(this.random() * vars.length)];
  }

  private generateHttpMethod(): string {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    return methods[Math.floor(this.random() * methods.length)];
  }

  private generateStackTrace(): string {
    return this.stackTraceTemplates[Math.floor(this.random() * this.stackTraceTemplates.length)];
  }

  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(this.random() * chars.length));
    }
    return result;
  }

  private createSeededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }
}

// ========================================
// EXPORT HELPER FUNCTIONS
// ========================================

export function createLogGenerator(config?: Partial<LogGenerationConfig>): LogDataGenerator {
  return new LogDataGenerator(config);
}

export function generateBasicLogs(
  source: string,
  count: number,
  errorRate: number = 0.1
): LogEntry[] {
  const generator = new LogDataGenerator();
  const entries: LogEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const level = Math.random() < errorRate ? 'ERROR' : 'INFO';
    const entry: LogEntry = {
      timestamp: new Date(Date.now() - (count - i) * 1000),
      level: level as any,
      message: `${level === 'ERROR' ? 'Error processing' : 'Successfully processed'} request ${i}`,
      source,
      generated: true
    };
    entries.push(entry);
  }
  
  return entries;
}
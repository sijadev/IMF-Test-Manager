export interface TestProfile {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Source Configuration
  sourceConfig: {
    directories: string[];
    languages: string[];
    complexity: 'simple' | 'medium' | 'complex';
    excludePatterns?: string[];
  };
  
  // Test Scenarios
  scenarios: TestScenario[];
  
  // Expected Outcomes
  expectations: {
    detectionRate: number;        // 0-100%
    fixSuccessRate: number;       // 0-100%
    falsePositiveRate: number;    // 0-100%
    mlAccuracy: number;           // 0-100%
    avgResponseTime?: number;     // milliseconds
  };
  
  // Generation Rules
  generationRules: {
    sampleCount: number;
    varianceLevel: 'low' | 'medium' | 'high';
    timespan: string;             // '1h', '1d', '1w'
    errorDistribution: Record<string, number>;
    dataOutputPath?: string;
  };
  
  // IMF Integration
  imfConfig?: {
    endpoint: string;
    apiKey?: string;
    timeout: number;
  };
  
  // Output Configuration  
  outputConfig?: {
    format: string;
    compression?: boolean;
    encryption?: boolean;
  };
}

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  type: 'performance' | 'security' | 'integration' | 'ml-training' | 'chaos';
  duration: number;             // seconds
  enabled: boolean;
  
  // Problem Types to Generate
  problemTypes: ProblemType[];
  
  // Code Injection Rules
  codeInjection: {
    errorTypes: ErrorType[];
    frequency: number;            // 0.0 - 1.0
    complexity: 'simple' | 'medium' | 'complex';
    targetFiles?: string[];      // specific files to inject errors
  };
  
  // Metrics to Generate
  metricsPattern: {
    cpuPattern: MetricPattern;
    memoryPattern: MetricPattern;
    diskPattern: MetricPattern;
    networkPattern: MetricPattern;
    logPattern: LogPattern;
  };
  
  // Load Generation
  loadConfig?: {
    requestsPerSecond: number;
    concurrentUsers: number;
    rampUpTime: number;
  };
}

export type ProblemType = 
  | 'memory_leak'
  | 'cpu_spike'
  | 'disk_full' 
  | 'network_timeout'
  | 'database_lock'
  | 'api_error'
  | 'security_breach'
  | 'data_corruption'
  | 'service_unavailable';

export type ErrorType =
  | 'null_pointer'
  | 'type_error'
  | 'memory_leak'
  | 'buffer_overflow'
  | 'api_timeout'
  | 'database_connection'
  | 'file_not_found'
  | 'permission_denied'
  | 'syntax_error'
  | 'logic_error';

export type MetricPattern = 
  | 'stable'       // Konstante Werte
  | 'linear'       // Linearer Anstieg/Abfall
  | 'spike'        // Plötzliche Spitzen
  | 'gradual'      // Langsame Änderung
  | 'random'       // Zufällige Schwankungen
  | 'cyclical';    // Wiederkehrende Muster

export type LogPattern =
  | 'normal'       // Normale Log-Frequenz
  | 'burst'        // Log-Bursts
  | 'error-heavy'  // Viele Fehler
  | 'sparse'       // Wenige Logs
  | 'structured';  // Strukturierte Patterns

export interface GeneratedTestData {
  profileId: string;
  generatedAt: Date;
  generationDuration: number;   // milliseconds
  
  data: {
    logFiles: LogFile[];
    metricStreams: MetricStream[];
    codeProblems: CodeProblem[];
    scenarios: ScenarioData[];
  };
  
  statistics: {
    totalLogEntries: number;
    totalMetricPoints: number;
    totalCodeProblems: number;
    dataSize: number;            // bytes
  };
  
  metadata: {
    generatorVersion: string;
    profile: TestProfile;
    outputPath: string;
    totalSamples: number;
    totalDuration?: number;
    dataSize?: number;
  };
  
  summary?: {
    samplesGenerated?: number;
    problemsInjected: number;
    metricsGenerated: number; 
    logsGenerated: number;
    successRate: number;
  };
}

export interface LogFile {
  filePath: string;
  source: string;              // 'application' | 'system' | 'database'
  entries: LogEntry[];
  metadata: {
    totalSize: number;
    lineCount: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface LogEntry {
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  source: string;
  metadata?: Record<string, any>;
  
  // Generated data markers
  generated: boolean;
  errorType?: ErrorType;
  scenarioId?: string;
}

export interface MetricStream {
  name: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'custom';
  unit: string;
  points: MetricPoint[];
  metadata: {
    avgValue: number;
    minValue: number;
    maxValue: number;
    pattern: MetricPattern;
  };
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
  
  // Generated data markers
  generated: boolean;
  scenarioId?: string;
  problemType?: ProblemType;
}

export interface CodeProblem {
  id: string;
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
  errorType: ErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  problem: {
    description: string;
    originalCode: string;
    problematicCode: string;
    suggestion?: string;
  };
  
  context: {
    functionName?: string;
    className?: string;
    language: string;
    framework?: string;
  };
  
  // Generation metadata
  generated: boolean;
  scenarioId: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface ScenarioData {
  scenarioId: string;
  name: string;
  executedAt: Date;
  duration: number;
  
  generatedData: {
    logs?: LogEntry[];
    metrics?: MetricPoint[];
    codeProblems?: CodeProblem[];
    loadTest?: LoadTestData;
  };
  
  statistics: {
    problemsInjected: number;
    metricsGenerated: number;
    logsGenerated: number;
    successRate: number;
  };
}

export interface LoadTestData {
  requests: RequestData[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
  };
}

export interface RequestData {
  timestamp: Date;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  size: number;
  error?: string;
}

// IMF Integration Types
export interface IMFResults {
  detectionRate: number;
  fixSuccessRate: number;
  falsePositiveRate: number;
  mlAccuracy: number;
  avgResponseTime: number;
  
  details: {
    problemsDetected: number;
    problemsExpected: number;
    fixesAttempted: number;
    fixesSuccessful: number;
    falsePositives: number;
    processingTime: number;
    
    mlMetrics: {
      precision: number;
      recall: number;
      f1Score: number;
      accuracy: number;
    };
    
    performanceMetrics: {
      avgDetectionTime: number;
      avgFixTime: number;
      totalProcessingTime: number;
    };
  };
  
  mlMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingTime: number;
    validationScore: number;
  };
}

export interface TestExecutionResult {
  profileId: string;
  executedAt: Date;
  executionDuration: number;
  duration?: number;
  executionId?: string;
  status?: string;
  
  testData: GeneratedTestData;
  imfResults: IMFResults;
  comparison: ResultComparison;
  
  passed: boolean;
  score: number;               // 0-100
  recommendations: string[];
}

export interface ResultComparison {
  detectionRate: MetricComparison;
  fixSuccessRate: MetricComparison;
  falsePositiveRate: MetricComparison;
  mlAccuracy: MetricComparison;
  avgResponseTime?: MetricComparison;
  overall?: {
    score: number;
    passed: boolean;
    summary: string;
  } | null;
  metrics?: Record<string, any>;
  recommendations?: string[];
}

export interface MetricComparison {
  expected: number;
  actual: number;
  variance: number;
  percentageDiff: number;
  passed: boolean;
  tolerance: number;
  status: 'pass' | 'fail' | 'warning';
}

// Configuration Types
export interface TestManagerConfig {
  defaultOutputPath: string;
  imfEndpoint?: string;
  apiKey?: string;
  maxConcurrentTests: number;
  
  generators: {
    logGenerator: LogGeneratorConfig;
    metricGenerator: MetricGeneratorConfig;
    codeGenerator: CodeGeneratorConfig;
  };
  
  validation: {
    strictMode: boolean;
    timeoutMs: number;
    retryCount: number;
  };
}

export interface LogGeneratorConfig {
  defaultFrequency: number;
  maxEntriesPerFile: number;
  supportedFormats: string[];
  templates: Record<string, string[]>;
}

export interface MetricGeneratorConfig {
  defaultInterval: number;      // seconds
  maxPoints: number;
  valueRanges: Record<string, { min: number; max: number }>;
  patterns: Record<MetricPattern, any>;
}

export interface CodeGeneratorConfig {
  supportedLanguages: string[];
  errorTemplates: Record<ErrorType, any>;
  complexityRules: Record<string, any>;
  maxProblemsPerFile: number;
}

// API Types
export interface LoadResult {
  success: boolean;
  loadedItems: number;
  errors: string[];
  duration: number;
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorInfo[];
  warnings: ValidationWarning[];
}

export interface ValidationErrorInfo {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// CLI Types
export interface CLIOptions {
  profile?: string;
  output?: string;
  verbose?: boolean;
  dryRun?: boolean;
  force?: boolean;
  config?: string;
}

export interface CLICommand {
  name: string;
  description: string;
  options: CLIOptions;
  handler: (options: CLIOptions) => Promise<void>;
}

// UI Integration Types
export interface UITestProfile {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'security' | 'integration' | 'ml-training' | 'chaos';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // seconds
  tags: string[];
  
  // UI-specific metadata
  icon?: string;
  color?: string;
  featured?: boolean;
  
  // Source configuration (template - can be overridden by UI)
  sourceTemplate: {
    supportedLanguages: string[];
    defaultComplexity: 'simple' | 'medium' | 'complex';
    excludePatterns?: string[];
    requiredFiles?: string[]; // Files that must exist in source directory
    recommendedStructure?: string; // Description of recommended project structure
  };
  
  // Expected outcomes for UI display
  expectedMetrics: {
    detectionRate: number;
    fixSuccessRate: number;
    falsePositiveRate: number;
    mlAccuracy: number;
  };
  
  // Scenario overview for UI
  scenarioCount: number;
  scenarioTypes: string[];
  
  // Resource requirements
  resourceRequirements: {
    cpu: 'low' | 'medium' | 'high';
    memory: 'low' | 'medium' | 'high';
    disk: 'low' | 'medium' | 'high';
  };
}

export interface LiveTestMetrics {
  executionId: string;
  profileId: string;
  startTime: Date;
  elapsedTime: number; // milliseconds
  status: 'preparing' | 'running' | 'analyzing' | 'completed' | 'failed';
  progress: number; // 0-100
  
  // Current scenario info
  currentScenario?: {
    id: string;
    name: string;
    progress: number;
    eta: number; // estimated seconds remaining
  };
  
  // Real-time metrics
  metrics: {
    cpu: number; // 0-100
    memory: number; // 0-100
    disk: number; // 0-100
    network: number; // 0-100
    
    // Test-specific metrics
    problemsDetected: number;
    problemsExpected: number;
    fixesAttempted: number;
    fixesSuccessful: number;
    falsePositives: number;
    
    // Performance metrics
    avgResponseTime: number;
    maxResponseTime: number;
    errorRate: number; // 0-100
  };
  
  // Live logs (last N entries)
  recentLogs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    source: string;
  }>;
  
  // Warnings/Alerts for UI
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    dismissed?: boolean;
  }>;
}

export interface TestExecutionStatus {
  executionId: string;
  profileId: string;
  status: 'queued' | 'preparing' | 'running' | 'analyzing' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  progress: number; // 0-100
  
  // Current phase
  currentPhase: {
    name: string;
    description: string;
    startTime: Date;
    estimatedDuration: number;
  };
  
  // Completed phases
  completedPhases: Array<{
    name: string;
    duration: number;
    success: boolean;
    errors?: string[];
  }>;
  
  // Summary stats
  summary: {
    totalScenarios: number;
    completedScenarios: number;
    failedScenarios: number;
    skippedScenarios: number;
  };
  
  // Resource usage
  resourceUsage: {
    peakCpu: number;
    peakMemory: number;
    totalDataGenerated: number; // bytes
    totalExecutionTime: number; // milliseconds
  };
  
  // Results preview (available during execution)
  preliminaryResults?: {
    detectionRate: number;
    currentAccuracy: number;
    trendsPositive: boolean;
  };
}

export interface UITestResults {
  executionId: string;
  profileId: string;
  profileName: string;
  executedAt: Date;
  duration: number;
  status: 'passed' | 'failed' | 'partial';
  score: number; // 0-100
  
  // Key metrics for dashboard
  keyMetrics: {
    detectionRate: number;
    fixSuccessRate: number;
    falsePositiveRate: number;
    mlAccuracy: number;
    overallScore: number;
  };
  
  // Visual data for charts
  chartData: {
    timeSeriesMetrics: Array<{
      timestamp: Date;
      cpu: number;
      memory: number;
      errors: number;
      detections: number;
    }>;
    
    scenarioResults: Array<{
      scenarioId: string;
      name: string;
      status: 'passed' | 'failed' | 'warning';
      score: number;
      duration: number;
      problems: number;
      fixes: number;
    }>;
    
    problemDistribution: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  
  // Recommendations for UI
  recommendations: Array<{
    id: string;
    type: 'improvement' | 'warning' | 'success';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestedAction?: string;
  }>;
  
  // Export options
  exportOptions: {
    formats: string[]; // 'json', 'csv', 'pdf', 'html'
    downloadUrl?: string;
  };
}

// Source Directory Configuration
export interface SourceDirectoryConfig {
  path: string; // Absolute path to source directory
  languages?: string[]; // Override detected languages
  complexity?: 'simple' | 'medium' | 'complex'; // Override complexity
  excludePatterns?: string[]; // Additional exclude patterns
  includePatterns?: string[]; // Specific include patterns
  
  // Validation settings
  validateStructure?: boolean; // Check if directory structure matches profile requirements
  requireFiles?: string[]; // Files that must exist
  
  // Monitoring settings
  watchMode?: boolean; // Enable file watching during test
  depth?: number; // Maximum directory depth to scan
}

export interface SourceDirectoryValidation {
  valid: boolean;
  path: string;
  
  // Detected information
  detectedLanguages: string[];
  detectedComplexity: 'simple' | 'medium' | 'complex';
  fileCount: number;
  directoryCount: number;
  totalSize: number; // bytes
  
  // Validation results
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
    suggestion?: string;
  }>;
  
  // Compatibility with test profile
  profileCompatibility: {
    languageMatch: boolean;
    complexityMatch: boolean;
    structureMatch: boolean;
    recommendedActions: string[];
  };
}

export interface TestExecutionConfig {
  profileId: string;
  sourceDirectory: SourceDirectoryConfig;
  
  // Execution options
  options?: {
    timeout?: number;
    maxConcurrency?: number;
    skipValidation?: boolean;
    dryRun?: boolean;
    
    // Output settings
    outputDirectory?: string;
    generateReports?: boolean;
    exportFormats?: string[];
  };
  
  // Notification settings
  notifications?: {
    onProgress?: boolean;
    onCompletion?: boolean;
    onError?: boolean;
    webhookUrl?: string;
  };
}

// ========================================
// INTEGRATION TYPES
// ========================================

export interface IMFIntegrationConfig {
  endpoint: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  version?: string;
  headers?: Record<string, string>;
}

export interface GenerationConfig {
  outputDir: string;
  sampleCount?: number;
  timespan?: string;
  seedValue?: number;
}

// ========================================
// ERROR TYPES
// ========================================

export class TestManagerError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TestManagerError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GenerationError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class IntegrationError extends Error {
  constructor(message: string, public endpoint?: string, public statusCode?: number) {
    super(message);
    this.name = 'IntegrationError';
  }
}

// ========================================
// UTILITY TYPES
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export interface TestProfileSchema {
  id: string;
  name: string;
  version: string;
  description: string;
  sourceConfig: any;
  scenarios: any[];
  expectations: any;
  generationRules: any;
}

// Missing generator config types
export interface LogGenerationConfig {
  baseFrequency: number;
  timespan: number;
  pattern: LogPattern;
  errorRate: number;
  sources: string[];
  outputFormat: 'json' | 'text' | 'structured';
  includeStackTraces: boolean;
  seed?: number;
}

export interface MetricGenerationConfig {
  interval: number;
  duration: number;
  pattern: MetricPattern;
  baseValues: Record<string, number>;
  variance: number;
  seed?: number;
}

// Alias for backward compatibility
export type Scenario = TestScenario;

// ========================================
// COMMONJS EXPORTS
// ========================================

module.exports = {
  // Core error classes
  TestManagerError,
  ValidationError,
  GenerationError,
  IntegrationError,
  
  // Constants
  DEFAULT_ERROR_TYPES: ['null_pointer', 'memory_leak', 'api_timeout', 'logic_error'],
  DEFAULT_PATTERNS: ['stable', 'spike', 'leak', 'burst'],
  TIMESPAN_REGEX: /^(\d+)([smhdw])$/,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_SAMPLE_COUNT: 100000,
  DEFAULT_TIMEOUT: 30000
};

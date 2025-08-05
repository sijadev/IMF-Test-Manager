// ========================================
// IMF TEST MANAGER - LIBRARY EXPORTS
// ========================================

// Export main types and interfaces
export interface TestProfile {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  sourceConfig: {
    directories: string[];
    languages: string[];
    complexity: 'low' | 'medium' | 'high';
    excludePatterns: string[];
  };
  scenarios: TestScenario[];
  expectations: {
    detectionRate: number;
    fixSuccessRate: number;
    falsePositiveRate: number;
    mlAccuracy: number;
  };
  generationRules: {
    sampleCount: number;
    varianceLevel: string;
    timespan: string;
    errorDistribution: Record<string, number>;
  };
}

export interface TestScenario {
  id: string;
  name: string;
  type: string;
  duration: number;
  enabled: boolean;
  problemTypes: string[];
  codeInjection: {
    errorTypes: string[];
    frequency: number;
    complexity: string;
  };
  metrics: {
    cpuPattern: string;
    memoryPattern: string;
    logPattern: string;
  };
}

export interface TestDataGenerationResult {
  profileId: string;
  generatedAt: string;
  generationDuration: number;
  data: {
    logFiles: any[];
    metricStreams: any[];
    codeProblems: any[];
    scenarios: any[];
  };
  statistics: {
    totalLogEntries: number;
    totalMetricPoints: number;
    totalCodeProblems: number;
    dataSize: number;
  };
  metadata: {
    generatorVersion: string;
    profile: TestProfile;
    outputPath: string;
    totalSamples: number;
  };
}

// Main library class - simplified version
export class TestManagerLib {
  private workspacePath: string;
  
  constructor(workspacePath: string = './test-workspace') {
    this.workspacePath = workspacePath;
  }
  
  async initialize(): Promise<void> {
    // Basic initialization
    console.log('Test Manager Library initialized');
  }
  
  getWorkspacePath(): string {
    return this.workspacePath;
  }
}
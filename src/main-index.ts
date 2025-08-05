// ========================================
// IMF TEST MANAGER - MAIN ENTRY POINT
// ========================================

// Core working components
const { Logger, createLogger } = require('./generators/logger');

// Enterprise components
const { IMFIntegrationAdapter, createIMFAdapter } = require('./adapters/imf-integration-adapter');
const { ScenarioExecutor, createScenarioExecutor, createSimpleWorkflow } = require('./core/scenario-executor');
const { TestDataLoaderPlugin, createTestDataLoaderPlugin, DefaultIMFStorage, DefaultMLService } = require('./plugins/test-data-loader');
const { PerformanceMonitor, createPerformanceMonitor } = require('./utils/performance-monitoring');

// Type exports - basic types that work
const types = require('./types');

// Simplified test manager
class IMFTestManager {
  private logger: any;
  
  constructor(options: any = {}) {
    this.logger = new Logger('IMFTestManager');
    
    if (options.logLevel) {
      Logger.setLevel(options.logLevel);
    }
    
    if (options.enableFileLogging) {
      Logger.enableFileLogging();
    }
  }
  
  async createSimpleProfile(name: string, sourceDirectory: string, options: any = {}) {
    this.logger.info('Creating simple test profile', { name, sourceDirectory });
    
    return {
      id: `profile-${Date.now()}`,
      name,
      description: `Auto-generated profile for ${sourceDirectory}`,
      sourceConfig: {
        directories: [sourceDirectory],
        complexity: options.complexity || 'medium'
      },
      scenarios: [
        {
          id: 'main-scenario',
          name: 'Main Test Scenario',
          type: 'ml-training',
          duration: options.duration || 300,
          enabled: true,
          problemTypes: options.errorTypes || ['null_pointer', 'memory_leak', 'api_timeout']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async generateTestData(profileId: string, outputDir: string = './output') {
    this.logger.info('Generating test data', { profileId, outputDir });
    
    // Simulate test data generation
    return {
      profileId,
      generatedAt: new Date(),
      generationDuration: Math.floor(Math.random() * 5000) + 1000,
      data: {
        logFiles: [],
        metricStreams: [],
        codeProblems: [],
        scenarios: []
      },
      statistics: {
        totalLogEntries: Math.floor(Math.random() * 10000) + 1000,
        totalMetricPoints: Math.floor(Math.random() * 5000) + 500,
        totalCodeProblems: Math.floor(Math.random() * 100) + 10,
        dataSize: Math.floor(Math.random() * 1000000) + 100000
      }
    };
  }
}

// Factory function
function createTestManager(options: any = {}) {
  return new IMFTestManager(options);
}

// Exports
module.exports = {
  // Core classes
  IMFTestManager,
  Logger,
  
  // Enterprise classes
  IMFIntegrationAdapter,
  ScenarioExecutor,
  TestDataLoaderPlugin,
  PerformanceMonitor,
  DefaultIMFStorage,
  DefaultMLService,
  
  // Factory functions
  createTestManager,
  createLogger,
  createIMFAdapter,
  createScenarioExecutor,
  createSimpleWorkflow,
  createTestDataLoaderPlugin,
  createPerformanceMonitor,
  
  // Types
  ...types,
  
  // Version info
  VERSION: '2.0.0', // Updated for enterprise features
  BUILD_DATE: new Date().toISOString()
};
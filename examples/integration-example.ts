// ========================================
// COMPLETE INTEGRATION EXAMPLE
// ========================================

/**
 * This example demonstrates a complete end-to-end workflow:
 * 1. Creating test profiles for different scenarios
 * 2. Generating comprehensive test data
 * 3. Integrating with IMF for ML training and validation
 * 4. Analyzing results and optimizing based on feedback
 */

import { 
  createTestManager, 
  TestProfileManager, 
  IMFIntegrationAdapter,
  MetricScenarios,
  Logger 
} from 'imf-test-manager';

// ========================================
// CONFIGURATION
// ========================================

interface IntegrationConfig {
  // IMF Connection
  imfEndpoint: string;
  imfApiKey: string;
  
  // Source Directories
  sourceDirectories: string[];
  
  // Output Configuration
  outputDir: string;
  resultsDir: string;
  
  // Test Parameters
  complexity: 'simple' | 'medium' | 'complex';
  sampleCounts: {
    development: number;
    testing: number;
    production: number;
  };
}

const config: IntegrationConfig = {
  imfEndpoint: process.env.IMF_ENDPOINT || 'http://localhost:3000',
  imfApiKey: process.env.IMF_API_KEY || 'development-key',
  
  sourceDirectories: [
    '/app/api-gateway/src',
    '/app/user-service/src',
    '/app/order-service/src',
    '/app/payment-service/src'
  ],
  
  outputDir: './integration-test-data',
  resultsDir: './integration-results',
  
  complexity: 'complex',
  sampleCounts: {
    development: 1000,
    testing: 10000,
    production: 100000
  }
};

// ========================================
// MAIN INTEGRATION WORKFLOW
// ========================================

export class IMFIntegrationWorkflow {
  private testManager: any;
  private profileManager: TestProfileManager;
  private imfAdapter: IMFIntegrationAdapter;
  private logger: Logger;

  constructor(config: IntegrationConfig) {
    this.logger = new Logger('IntegrationWorkflow');
    
    // Initialize components
    this.testManager = createTestManager({
      logLevel: 'INFO',
      enableFileLogging: true
    });
    
    this.profileManager = new TestProfileManager('./profiles');
    
    this.imfAdapter = new IMFIntegrationAdapter({
      endpoint: config.imfEndpoint,
      apiKey: config.imfApiKey,
      timeout: 60000,
      retries: 3
    });
  }

  /**
   * Complete integration workflow
   */
  async executeCompleteWorkflow(): Promise<void> {
    this.logger.info('Starting complete IMF integration workflow');

    try {
      // Step 1: Verify IMF connectivity
      await this.verifyIMFConnectivity();
      
      // Step 2: Create comprehensive test profiles
      const profiles = await this.createTestProfiles();
      
      // Step 3: Generate test data for different environments
      const testDataSets = await this.generateTestDataSets(profiles);
      
      // Step 4: Execute tests against IMF
      const results = await this.executeIMFTests(profiles);
      
      // Step 5: Analyze and report results
      await this.analyzeResults(results);
      
      // Step 6: Generate recommendations
      await this.generateRecommendations(results);
      
      this.logger.info('Complete integration workflow finished successfully');
      
    } catch (error) {
      this.logger.error('Integration workflow failed', undefined, error);
      throw error;
    }
  }

  /**
   * Step 1: Verify IMF connectivity and capabilities
   */
  private async verifyIMFConnectivity(): Promise<void> {
    this.logger.info('Verifying IMF connectivity');
    
    const isConnected = await this.imfAdapter.testConnection();
    if (!isConnected) {
      throw new Error(`Cannot connect to IMF at ${config.imfEndpoint}`);
    }
    
    this.logger.info('✅ IMF connectivity verified');
  }

  /**
   * Step 2: Create comprehensive test profiles for different scenarios
   */
  private async createTestProfiles(): Promise<string[]> {
    this.logger.info('Creating comprehensive test profiles');
    
    const profiles: string[] = [];
    
    // ML Training Profile
    const mlTrainingProfile = await this.profileManager.createProfile({
      name: 'Production ML Training Dataset',
      description: 'Comprehensive training data for production ML models',
      sourceConfig: {
        directories: config.sourceDirectories,
        languages: ['typescript', 'javascript'],
        complexity: config.complexity
      },
      scenarios: [
        {
          id: 'syntax-errors',
          name: 'Syntax Error Training',
          type: 'ml-training',
          duration: 1800, // 30 minutes
          enabled: true,
          problemTypes: ['syntax_error', 'type_mismatch', 'missing_import'],
          codeInjection: {
            errorTypes: ['syntax_error', 'type_mismatch', 'missing_import'],
            frequency: 0.25,
            complexity: 'simple'
          },
          metrics: {
            cpuPattern: 'stable',
            memoryPattern: 'stable',
            logPattern: 'normal'
          }
        },
        {
          id: 'runtime-errors',
          name: 'Runtime Error Training',
          type: 'ml-training',
          duration: 2400, // 40 minutes
          enabled: true,
          problemTypes: ['null_pointer', 'undefined_variable', 'memory_leak'],
          codeInjection: {
            errorTypes: ['null_pointer', 'undefined_variable', 'memory_leak'],
            frequency: 0.20,
            complexity: 'medium'
          },
          metrics: {
            cpuPattern: 'spike',
            memoryPattern: 'leak',
            logPattern: 'error-heavy'
          }
        },
        {
          id: 'security-vulnerabilities',
          name: 'Security Vulnerability Training',
          type: 'ml-training',
          duration: 1200, // 20 minutes
          enabled: true,
          problemTypes: ['security_vulnerability', 'injection_attack'],
          codeInjection: {
            errorTypes: ['security_vulnerability', 'injection_attack'],
            frequency: 0.30,
            complexity: 'complex'
          },
          metrics: {
            cpuPattern: 'stable',
            memoryPattern: 'stable',
            logPattern: 'burst'
          }
        }
      ],
      expectations: {
        detectionRate: 92,
        fixSuccessRate: 78,
        falsePositiveRate: 8,
        mlAccuracy: 88
      },
      generationRules: {
        sampleCount: config.sampleCounts.production,
        varianceLevel: 'high',
        timespan: '2h',
        errorDistribution: {
          'syntax_error': 0.15,
          'null_pointer': 0.15,
          'type_mismatch': 0.12,
          'memory_leak': 0.12,
          'security_vulnerability': 0.15,
          'undefined_variable': 0.10,
          'injection_attack': 0.08,
          'missing_import': 0.08,
          'performance_issue': 0.05
        }
      }
    });
    
    profiles.push(mlTrainingProfile.id);
    
    // Performance Testing Profile
    const performanceProfile = await this.profileManager.createProfile({
      name: 'Production Performance Stress Test',
      description: 'High-load performance testing with realistic traffic patterns',
      sourceConfig: {
        directories: config.sourceDirectories,
        complexity: config.complexity
      },
      scenarios: [
        {
          id: 'high-load-scenario',
          name: 'High Load Performance Test',
          type: 'performance',
          duration: 900, // 15 minutes
          enabled: true,
          problemTypes: ['memory_leak', 'cpu_spike', 'database_lock'],
          codeInjection: {
            errorTypes: ['memory_leak', 'blocking_operation', 'database_lock'],
            frequency: 0.15,
            complexity: 'complex'
          },
          metrics: {
            cpuPattern: 'spike',
            memoryPattern: 'leak',
            logPattern: 'error-heavy'
          }
        }
      ],
      expectations: {
        detectionRate: 85,
        fixSuccessRate: 65,
        falsePositiveRate: 12,
        mlAccuracy: 82
      },
      generationRules: {
        sampleCount: config.sampleCounts.testing,
        varianceLevel: 'high',
        timespan: '15m',
        errorDistribution: {
          'memory_leak': 0.35,
          'cpu_spike': 0.25,
          'database_lock': 0.20,
          'blocking_operation': 0.20
        }
      }
    });
    
    profiles.push(performanceProfile.id);
    
    // Security Audit Profile
    const securityProfile = await this.profileManager.createProfile({
      name: 'Security Vulnerability Audit',
      description: 'Comprehensive security vulnerability testing',
      sourceConfig: {
        directories: config.sourceDirectories,
        complexity: 'complex'
      },
      scenarios: [
        {
          id: 'security-audit',
          name: 'Security Vulnerability Audit',
          type: 'security',
          duration: 600, // 10 minutes
          enabled: true,
          problemTypes: ['security_vulnerability', 'injection_attack', 'xss_vulnerability'],
          codeInjection: {
            errorTypes: ['security_vulnerability', 'injection_attack', 'xss_vulnerability'],
            frequency: 0.40,
            complexity: 'complex'
          },
          metrics: {
            cpuPattern: 'stable',
            memoryPattern: 'stable',
            logPattern: 'error-heavy'
          }
        }
      ],
      expectations: {
        detectionRate: 95,
        fixSuccessRate: 60,
        falsePositiveRate: 5,
        mlAccuracy: 90
      },
      generationRules: {
        sampleCount: config.sampleCounts.testing,
        varianceLevel: 'medium',
        timespan: '10m',
        errorDistribution: {
          'security_vulnerability': 0.40,
          'injection_attack': 0.35,
          'xss_vulnerability': 0.25
        }
      }
    });
    
    profiles.push(securityProfile.id);
    
    this.logger.info(`✅ Created ${profiles.length} test profiles`);
    return profiles;
  }

  /**
   * Step 3: Generate test data for different environments
   */
  private async generateTestDataSets(profileIds: string[]): Promise<Map<string, any>> {
    this.logger.info('Generating test data sets for all profiles');
    
    const testDataSets = new Map<string, any>();
    
    for (const profileId of profileIds) {
      this.logger.info(`Generating test data for profile: ${profileId}`);
      
      try {
        const testData = await this.testManager.generateTestData(
          profileId, 
          `${config.outputDir}/${profileId}`
        );
        
        testDataSets.set(profileId, testData);
        
        this.logger.info(`✅ Generated ${testData.metadata.totalSamples} samples for ${profileId}`);
        
      } catch (error) {
        this.logger.error(`Failed to generate test data for ${profileId}`, undefined, error);
        throw error;
      }
    }
    
    this.logger.info(`✅ Generated test data for ${profileIds.length} profiles`);
    return testDataSets;
  }

  /**
   * Step 4: Execute tests against IMF
   */
  private async executeIMFTests(profileIds: string[]): Promise<Map<string, any>> {
    this.logger.info('Executing tests against IMF');
    
    const results = new Map<string, any>();
    
    for (const profileId of profileIds) {
      this.logger.info(`Executing test for profile: ${profileId}`);
      
      try {
        const startTime = Date.now();
        
        const result = await this.imfAdapter.executeTestProfile(profileId);
        
        const duration = Date.now() - startTime;
        result.executionTime = duration;
        
        results.set(profileId, result);
        
        this.logger.info(`✅ Test completed for ${profileId} in ${duration}ms`);
        
        // Log key metrics
        if (result.imfResults) {
          this.logger.info(`   Detection Rate: ${result.imfResults.detectionRate.toFixed(1)}%`);
          this.logger.info(`   Fix Success Rate: ${result.imfResults.fixSuccessRate.toFixed(1)}%`);
          this.logger.info(`   ML Accuracy: ${result.imfResults.mlAccuracy.toFixed(1)}%`);
        }
        
      } catch (error) {
        this.logger.error(`Failed to execute test for ${profileId}`, undefined, error);
        
        // Store failed result
        results.set(profileId, {
          profileId,
          status: 'failed',
          error: error.message,
          executedAt: new Date()
        });
      }
    }
    
    this.logger.info(`✅ Executed tests for ${profileIds.length} profiles`);
    return results;
  }

  /**
   * Step 5: Analyze and report results
   */
  private async analyzeResults(results: Map<string, any>): Promise<void> {
    this.logger.info('Analyzing test results');
    
    const analysis = {
      totalTests: results.size,
      successfulTests: 0,
      failedTests: 0,
      averageMetrics: {
        detectionRate: 0,
        fixSuccessRate: 0,
        falsePositiveRate: 0,
        mlAccuracy: 0
      },
      profilePerformance: [] as any[]
    };
    
    const successfulResults = [];
    
    for (const [profileId, result] of results) {
      if (result.status === 'failed') {
        analysis.failedTests++;
        this.logger.error(`❌ Test failed for profile ${profileId}: ${result.error}`);
        continue;
      }
      
      analysis.successfulTests++;
      successfulResults.push(result);
      
      if (result.imfResults) {
        const metrics = result.imfResults;
        
        analysis.profilePerformance.push({
          profileId,
          detectionRate: metrics.detectionRate,
          fixSuccessRate: metrics.fixSuccessRate,
          falsePositiveRate: metrics.falsePositiveRate,
          mlAccuracy: metrics.mlAccuracy,
          executionTime: result.executionTime,
          passed: result.comparison?.overall.passed || false,
          score: result.comparison?.overall.score || 0
        });
      }
    }
    
    // Calculate averages
    if (successfulResults.length > 0) {
      const totals = successfulResults.reduce((acc, result) => {
        if (result.imfResults) {
          acc.detectionRate += result.imfResults.detectionRate;
          acc.fixSuccessRate += result.imfResults.fixSuccessRate;
          acc.falsePositiveRate += result.imfResults.falsePositiveRate;
          acc.mlAccuracy += result.imfResults.mlAccuracy;
        }
        return acc;
      }, { detectionRate: 0, fixSuccessRate: 0, falsePositiveRate: 0, mlAccuracy: 0 });
      
      const count = successfulResults.length;
      analysis.averageMetrics = {
        detectionRate: totals.detectionRate / count,
        fixSuccessRate: totals.fixSuccessRate / count,
        falsePositiveRate: totals.falsePositiveRate / count,
        mlAccuracy: totals.mlAccuracy / count
      };
    }
    
    // Generate detailed report
    await this.generateDetailedReport(analysis);
    
    this.logger.info('📊 Analysis Summary:');
    this.logger.info(`   Total Tests: ${analysis.totalTests}`);
    this.logger.info(`   Successful: ${analysis.successfulTests}`);
    this.logger.info(`   Failed: ${analysis.failedTests}`);
    this.logger.info(`   Average Detection Rate: ${analysis.averageMetrics.detectionRate.toFixed(1)}%`);
    this.logger.info(`   Average Fix Success Rate: ${analysis.averageMetrics.fixSuccessRate.toFixed(1)}%`);
    this.logger.info(`   Average ML Accuracy: ${analysis.averageMetrics.mlAccuracy.toFixed(1)}%`);
  }

  /**
   * Step 6: Generate recommendations based on results
   */
  private async generateRecommendations(results: Map<string, any>): Promise<void> {
    this.logger.info('Generating optimization recommendations');
    
    const recommendations = [];
    
    for (const [profileId, result] of results) {
      if (result.status === 'failed') {
        recommendations.push({
          type: 'error',
          profileId,
          message: `Fix test execution failure for ${profileId}`,
          priority: 'high',
          action: 'debug_test_execution'
        });
        continue;
      }
      
      if (result.comparison) {
        const comparison = result.comparison;
        
        // Detection Rate Recommendations
        if (!comparison.metrics.detectionRate.passed) {
          if (comparison.metrics.detectionRate.actual < comparison.metrics.detectionRate.expected) {
            recommendations.push({
              type: 'performance',
              profileId,
              message: `Improve detection algorithms - current: ${comparison.metrics.detectionRate.actual.toFixed(1)}%, expected: ${comparison.metrics.detectionRate.expected}%`,
              priority: 'medium',
              action: 'tune_detection_sensitivity'
            });
          }
        }
        
        // Fix Success Rate Recommendations
        if (!comparison.metrics.fixSuccessRate.passed) {
          if (comparison.metrics.fixSuccessRate.actual < comparison.metrics.fixSuccessRate.expected) {
            recommendations.push({
              type: 'performance',
              profileId,
              message: `Enhance fix algorithms - current: ${comparison.metrics.fixSuccessRate.actual.toFixed(1)}%, expected: ${comparison.metrics.fixSuccessRate.expected}%`,
              priority: 'medium',
              action: 'improve_fix_algorithms'
            });
          }
        }
        
        // False Positive Recommendations
        if (!comparison.metrics.falsePositiveRate.passed) {
          if (comparison.metrics.falsePositiveRate.actual > comparison.metrics.falsePositiveRate.expected) {
            recommendations.push({
              type: 'accuracy',
              profileId,
              message: `Reduce false positives - current: ${comparison.metrics.falsePositiveRate.actual.toFixed(1)}%, expected: ${comparison.metrics.falsePositiveRate.expected}%`,
              priority: 'high',
              action: 'tune_detection_precision'
            });
          }
        }
        
        // ML Accuracy Recommendations
        if (!comparison.metrics.mlAccuracy.passed) {
          if (comparison.metrics.mlAccuracy.actual < comparison.metrics.mlAccuracy.expected) {
            recommendations.push({
              type: 'ml_training',
              profileId,
              message: `Improve ML model accuracy - current: ${comparison.metrics.mlAccuracy.actual.toFixed(1)}%, expected: ${comparison.metrics.mlAccuracy.expected}%`,
              priority: 'high',
              action: 'retrain_ml_models'
            });
          }
        }
      }
    }
    
    // Generate actionable recommendations
    const actionPlan = this.createActionPlan(recommendations);
    await this.saveRecommendations(recommendations, actionPlan);
    
    this.logger.info(`💡 Generated ${recommendations.length} recommendations`);
    
    // Log top priority recommendations
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
      this.logger.info('🚨 High Priority Recommendations:');
      highPriorityRecs.forEach(rec => {
        this.logger.info(`   • ${rec.message}`);
      });
    }
  }

  /**
   * Generate detailed HTML report
   */
  private async generateDetailedReport(analysis: any): Promise<void> {
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>IMF Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #64748b; margin-top: 5px; }
        .profile-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .profile-table th, .profile-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .profile-table th { background: #f1f5f9; }
        .status-pass { color: #10b981; font-weight: bold; }
        .status-fail { color: #ef4444; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 IMF Integration Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${analysis.successfulTests}/${analysis.totalTests}</div>
            <div class="metric-label">Tests Passed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${analysis.averageMetrics.detectionRate.toFixed(1)}%</div>
            <div class="metric-label">Avg Detection Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${analysis.averageMetrics.fixSuccessRate.toFixed(1)}%</div>
            <div class="metric-label">Avg Fix Success Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${analysis.averageMetrics.mlAccuracy.toFixed(1)}%</div>
            <div class="metric-label">Avg ML Accuracy</div>
        </div>
    </div>
    
    <h2>📊 Profile Performance</h2>
    <table class="profile-table">
        <thead>
            <tr>
                <th>Profile ID</th>
                <th>Detection Rate</th>
                <th>Fix Success Rate</th>
                <th>ML Accuracy</th>
                <th>Execution Time</th>
                <th>Status</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            ${analysis.profilePerformance.map((profile: any) => `
                <tr>
                    <td>${profile.profileId}</td>
                    <td>${profile.detectionRate.toFixed(1)}%</td>
                    <td>${profile.fixSuccessRate.toFixed(1)}%</td>
                    <td>${profile.mlAccuracy.toFixed(1)}%</td>
                    <td>${(profile.executionTime / 1000).toFixed(1)}s</td>
                    <td class="${profile.passed ? 'status-pass' : 'status-fail'}">
                        ${profile.passed ? '✅ PASS' : '❌ FAIL'}
                    </td>
                    <td>${profile.score}/100</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
    `;
    
    const reportPath = `${config.resultsDir}/integration-report-${Date.now()}.html`;
    await this.writeFile(reportPath, reportHtml);
    
    this.logger.info(`📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Create actionable plan from recommendations
   */
  private createActionPlan(recommendations: any[]): any {
    const actionsByType = recommendations.reduce((acc, rec) => {
      if (!acc[rec.action]) {
        acc[rec.action] = [];
      }
      acc[rec.action].push(rec);
      return acc;
    }, {});
    
    return {
      immediateActions: recommendations.filter(r => r.priority === 'high'),
      mediumTermActions: recommendations.filter(r => r.priority === 'medium'),
      longTermActions: recommendations.filter(r => r.priority === 'low'),
      actionsByType
    };
  }

  /**
   * Save recommendations to file
   */
  private async saveRecommendations(recommendations: any[], actionPlan: any): Promise<void> {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
        lowPriority: recommendations.filter(r => r.priority === 'low').length
      },
      recommendations,
      actionPlan
    };
    
    const filePath = `${config.resultsDir}/recommendations-${Date.now()}.json`;
    await this.writeFile(filePath, JSON.stringify(report, null, 2));
    
    this.logger.info(`💾 Recommendations saved to: ${filePath}`);
  }

  /**
   * Utility method to write files
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    const fs = await import('fs-extra');
    await fs.ensureDir(require('path').dirname(filePath));
    await fs.writeFile(filePath, content);
  }
}

// ========================================
// USAGE EXAMPLE
// ========================================

async function runCompleteIntegrationExample(): Promise<void> {
  console.log('🚀 Starting Complete IMF Integration Example');
  
  try {
    const workflow = new IMFIntegrationWorkflow(config);
    await workflow.executeCompleteWorkflow();
    
    console.log('✅ Integration example completed successfully!');
    console.log(`📁 Results saved to: ${config.resultsDir}`);
    console.log(`📊 Test data saved to: ${config.outputDir}`);
    
  } catch (error) {
    console.error('❌ Integration example failed:', error);
    process.exit(1);
  }
}

// ========================================
// CLI EXECUTION
// ========================================

if (require.main === module) {
  runCompleteIntegrationExample().catch(console.error);
}

export { IMFIntegrationWorkflow, config };

// ========================================
// ADDITIONAL UTILITY FUNCTIONS
// ========================================

/**
 * Quick setup for development environment
 */
export async function quickDevelopmentSetup(): Promise<void> {
  console.log('🛠️ Setting up development environment...');
  
  const devConfig = {
    ...config,
    complexity: 'simple' as const,
    sampleCounts: {
      development: 100,
      testing: 500,
      production: 1000
    }
  };
  
  const workflow = new IMFIntegrationWorkflow(devConfig);
  await workflow.executeCompleteWorkflow();
  
  console.log('✅ Development environment ready!');
}

/**
 * Production validation workflow
 */
export async function productionValidation(): Promise<void> {
  console.log('🏭 Running production validation...');
  
  const prodConfig = {
    ...config,
    complexity: 'complex' as const,
    sampleCounts: {
      development: 10000,
      testing: 50000,
      production: 500000
    }
  };
  
  const workflow = new IMFIntegrationWorkflow(prodConfig);
  await workflow.executeCompleteWorkflow();
  
  console.log('✅ Production validation completed!');
}

/**
 * Continuous monitoring setup
 */
export async function setupContinuousMonitoring(): Promise<void> {
  console.log('📊 Setting up continuous monitoring...');
  
  // Set up recurring tests every 4 hours
  setInterval(async () => {
    try {
      const workflow = new IMFIntegrationWorkflow(config);
      await workflow.executeCompleteWorkflow();
    } catch (error) {
      console.error('Continuous monitoring error:', error);
    }
  }, 4 * 60 * 60 * 1000); // 4 hours
  
  console.log('✅ Continuous monitoring active!');
}
// ========================================
// COMPLEX SCENARIO EXECUTION ENGINE
// ========================================

const { Logger } = require('../generators/logger');
const fs = require('fs-extra');
const path = require('path');

export interface ExecutionStep {
  id: string;
  name: string;
  type: 'generation' | 'analysis' | 'validation' | 'integration' | 'cleanup';
  dependencies: string[]; // IDs of steps that must complete first
  timeout: number;
  retries: number;
  parameters: Record<string, any>;
  condition?: (context: ExecutionContext) => boolean;
}

export interface ExecutionContext {
  executionId: string;
  startTime: Date;
  currentStep: string;
  completedSteps: Set<string>;
  failedSteps: Set<string>;
  stepResults: Map<string, any>;
  globalState: Record<string, any>;
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    totalDuration: number;
    stepDurations: Map<string, number>;
  };
}

export interface WorkflowResult {
  executionId: string;
  success: boolean;
  duration: number;
  startTime: Date;
  endTime: Date;
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];
  results: Map<string, any>;
  summary: {
    totalSteps: number;
    successRate: number;
    averageStepDuration: number;
    bottleneckSteps: string[];
    recommendations: string[];
  };
  errors: string[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: ExecutionStep[];
  globalConfiguration: Record<string, any>;
  validation: {
    requiredResults: string[];
    successCriteria: (results: Map<string, any>) => boolean;
    rollbackOnFailure: boolean;
  };
}

export class ScenarioExecutor {
  private logger: any;
  private activeExecutions: Map<string, ExecutionContext>;
  private stepHandlers: Map<string, (step: ExecutionStep, context: ExecutionContext) => Promise<any>>;

  constructor() {
    this.logger = new Logger('ScenarioExecutor');
    this.activeExecutions = new Map();
    this.stepHandlers = new Map();
    
    this.registerDefaultStepHandlers();
    
    this.logger.info('Scenario Executor initialized');
  }

  // ========================================
  // MAIN EXECUTION METHODS
  // ========================================

  async executeComplexWorkflow(scenario: ScenarioDefinition): Promise<WorkflowResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    this.logger.info('Starting complex workflow execution', {
      executionId,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      totalSteps: scenario.steps.length
    });

    const context: ExecutionContext = {
      executionId,
      startTime,
      currentStep: '',
      completedSteps: new Set(),
      failedSteps: new Set(),
      stepResults: new Map(),
      globalState: { ...scenario.globalConfiguration },
      metrics: {
        totalSteps: scenario.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        totalDuration: 0,
        stepDurations: new Map()
      }
    };

    this.activeExecutions.set(executionId, context);

    try {
      // Execute steps in dependency order
      const executionOrder = this.calculateExecutionOrder(scenario.steps);
      const skippedSteps: string[] = [];

      for (const stepId of executionOrder) {
        const step = scenario.steps.find(s => s.id === stepId);
        if (!step) continue;

        // Check if step should be executed
        if (step.condition && !step.condition(context)) {
          skippedSteps.push(stepId);
          context.metrics.skippedSteps++;
          this.logger.debug('Step skipped due to condition', { stepId, step: step.name });
          continue;
        }

        // Check dependencies
        const dependenciesMet = step.dependencies.every(depId => 
          context.completedSteps.has(depId)
        );

        if (!dependenciesMet) {
          const missingDeps = step.dependencies.filter(depId => 
            !context.completedSteps.has(depId)
          );
          this.logger.error('Step dependencies not met', {
            stepId,
            step: step.name,
            missingDependencies: missingDeps
          });
          context.failedSteps.add(stepId);
          context.metrics.failedSteps++;
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, context);
        
        if (stepResult.success) {
          context.completedSteps.add(stepId);
          context.stepResults.set(stepId, stepResult.data);
          context.metrics.completedSteps++;
          
          this.logger.info('Step completed successfully', {
            stepId,
            step: step.name,
            duration: stepResult.duration
          });
        } else {
          context.failedSteps.add(stepId);
          context.metrics.failedSteps++;
          
          this.logger.error('Step execution failed', {
            stepId,
            step: step.name,
            error: stepResult.error
          });

          // Check if workflow should continue or fail
          if (scenario.validation.rollbackOnFailure) {
            this.logger.warn('Rolling back due to step failure');
            await this.rollbackWorkflow(context, scenario);
            break;
          }
        }
      }

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      // Validate results
      const validationResult = this.validateWorkflowResults(scenario, context);

      const result: WorkflowResult = {
        executionId,
        success: validationResult.success,
        duration: totalDuration,
        startTime,
        endTime,
        completedSteps: Array.from(context.completedSteps),
        failedSteps: Array.from(context.failedSteps),
        skippedSteps,
        results: context.stepResults,
        summary: {
          totalSteps: scenario.steps.length,
          successRate: context.metrics.completedSteps / scenario.steps.length,
          averageStepDuration: this.calculateAverageStepDuration(context),
          bottleneckSteps: this.identifyBottleneckSteps(context),
          recommendations: this.generateRecommendations(context, scenario)
        },
        errors: validationResult.errors
      };

      this.logger.info('Complex workflow execution completed', {
        executionId,
        success: result.success,
        duration: totalDuration,
        completedSteps: result.completedSteps.length,
        failedSteps: result.failedSteps.length
      });

      return result;

    } catch (error) {
      this.logger.error('Workflow execution failed with exception', {
        executionId,
        error: error.message
      }, error);

      const endTime = new Date();
      
      return {
        executionId,
        success: false,
        duration: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        completedSteps: Array.from(context.completedSteps),
        failedSteps: Array.from(context.failedSteps),
        skippedSteps: [],
        results: context.stepResults,
        summary: {
          totalSteps: scenario.steps.length,
          successRate: 0,
          averageStepDuration: 0,
          bottleneckSteps: [],
          recommendations: ['Fix critical errors before retry']
        },
        errors: [error.message]
      };
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  async executeMultiStepScenario(steps: ExecutionStep[], globalConfig: any = {}): Promise<WorkflowResult> {
    const scenario: ScenarioDefinition = {
      id: `multi-step-${Date.now()}`,
      name: 'Multi-Step Scenario',
      description: 'Dynamically created multi-step scenario',
      version: '1.0.0',
      steps,
      globalConfiguration: globalConfig,
      validation: {
        requiredResults: steps.map(s => s.id),
        successCriteria: (results) => results.size === steps.length,
        rollbackOnFailure: false
      }
    };

    return this.executeComplexWorkflow(scenario);
  }

  async executeBatchScenarios(scenarios: ScenarioDefinition[], concurrent: boolean = false): Promise<WorkflowResult[]> {
    this.logger.info('Executing batch scenarios', {
      count: scenarios.length,
      concurrent
    });

    if (concurrent) {
      const promises = scenarios.map(scenario => this.executeComplexWorkflow(scenario));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          this.logger.error(`Batch scenario failed: ${scenarios[index].name}`, {
            error: result.reason
          });
          return this.createFailedResult(scenarios[index].id, result.reason);
        }
      });
    } else {
      const results: WorkflowResult[] = [];
      for (const scenario of scenarios) {
        try {
          const result = await this.executeComplexWorkflow(scenario);
          results.push(result);
        } catch (error) {
          this.logger.error(`Sequential scenario failed: ${scenario.name}`, { error: error.message });
          results.push(this.createFailedResult(scenario.id, error));
        }
      }
      return results;
    }
  }

  // ========================================
  // STEP EXECUTION METHODS
  // ========================================

  private async executeStep(step: ExecutionStep, context: ExecutionContext): Promise<{success: boolean; data?: any; error?: string; duration: number}> {
    const stepStartTime = Date.now();
    context.currentStep = step.id;

    this.logger.debug('Executing step', {
      stepId: step.id,
      stepName: step.name,
      stepType: step.type
    });

    try {
      const handler = this.stepHandlers.get(step.type);
      if (!handler) {
        throw new Error(`No handler registered for step type: ${step.type}`);
      }

      // Execute with timeout and retries
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= step.retries + 1; attempt++) {
        try {
          const result = await this.executeWithTimeout(
            () => handler(step, context),
            step.timeout
          );

          const duration = Date.now() - stepStartTime;
          context.metrics.stepDurations.set(step.id, duration);

          return {
            success: true,
            data: result,
            duration
          };

        } catch (error) {
          lastError = error as Error;
          this.logger.warn(`Step attempt ${attempt} failed`, {
            stepId: step.id,
            attempt,
            maxAttempts: step.retries + 1,
            error: error.message
          });

          if (attempt <= step.retries) {
            // Wait before retry
            await this.delay(1000 * attempt);
          }
        }
      }

      const duration = Date.now() - stepStartTime;
      return {
        success: false,
        error: lastError?.message || 'Unknown error',
        duration
      };

    } catch (error) {
      const duration = Date.now() - stepStartTime;
      context.metrics.stepDurations.set(step.id, duration);

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // ========================================
  // STEP HANDLERS
  // ========================================

  private registerDefaultStepHandlers(): void {
    // Generation step handler
    this.stepHandlers.set('generation', async (step: ExecutionStep, context: ExecutionContext) => {
      this.logger.debug('Executing generation step', { stepId: step.id });
      
      // Simulate data generation
      await this.delay(500 + Math.random() * 1500);
      
      const generatedData = {
        profileId: step.parameters.profileId || `profile-${Date.now()}`,
        dataType: step.parameters.dataType || 'mixed',
        itemCount: Math.floor(Math.random() * 5000) + 1000,
        generatedAt: new Date(),
        metadata: {
          stepId: step.id,
          executionId: context.executionId
        }
      };

      return generatedData;
    });

    // Analysis step handler
    this.stepHandlers.set('analysis', async (step: ExecutionStep, context: ExecutionContext) => {
      this.logger.debug('Executing analysis step', { stepId: step.id });

      // Get data from previous steps
      const inputData = step.dependencies.map(depId => context.stepResults.get(depId)).filter(Boolean);
      
      await this.delay(800 + Math.random() * 2000);

      const analysisResult = {
        analyzedItems: inputData.reduce((sum, data) => sum + (data.itemCount || 0), 0),
        detectionRate: 75 + Math.random() * 20,
        accuracy: 80 + Math.random() * 15,
        falsePositiveRate: Math.random() * 8,
        processingTime: Date.now(),
        insights: [
          'Pattern detected in data distribution',
          'Anomalies found in 3.2% of samples',
          'Correlation coefficient: 0.78'
        ]
      };

      return analysisResult;
    });

    // Validation step handler
    this.stepHandlers.set('validation', async (step: ExecutionStep, context: ExecutionContext) => {
      this.logger.debug('Executing validation step', { stepId: step.id });

      await this.delay(300 + Math.random() * 700);

      const validationResult = {
        validationPassed: Math.random() > 0.1, // 90% success rate
        validatedItems: context.stepResults.size,
        validationRules: step.parameters.rules || ['schema_validation', 'business_rules', 'data_quality'],
        validationScore: 85 + Math.random() * 12,
        issues: Math.random() > 0.7 ? ['Minor schema inconsistency detected'] : []
      };

      return validationResult;
    });

    // Integration step handler
    this.stepHandlers.set('integration', async (step: ExecutionStep, context: ExecutionContext) => {
      this.logger.debug('Executing integration step', { stepId: step.id });

      await this.delay(1000 + Math.random() * 2000);

      const integrationResult = {
        integratedSystems: step.parameters.systems || ['IMF', 'DataWarehouse'],
        recordsIntegrated: Math.floor(Math.random() * 10000) + 5000,
        integrationSuccess: Math.random() > 0.05, // 95% success rate
        syncTimestamp: new Date(),
        performanceMetrics: {
          throughput: Math.floor(Math.random() * 1000) + 500,
          latency: Math.floor(Math.random() * 100) + 50
        }
      };

      return integrationResult;
    });

    // Cleanup step handler
    this.stepHandlers.set('cleanup', async (step: ExecutionStep, context: ExecutionContext) => {
      this.logger.debug('Executing cleanup step', { stepId: step.id });

      await this.delay(200 + Math.random() * 500);

      const cleanupResult = {
        resourcesReleased: ['temp_files', 'memory_buffers', 'database_connections'],
        cleanupSuccess: true,
        freedMemory: Math.floor(Math.random() * 100) + 50, // MB
        deletedFiles: Math.floor(Math.random() * 20) + 5
      };

      return cleanupResult;
    });
  }

  registerCustomStepHandler(stepType: string, handler: (step: ExecutionStep, context: ExecutionContext) => Promise<any>): void {
    this.stepHandlers.set(stepType, handler);
    this.logger.info('Custom step handler registered', { stepType });
  }

  // ========================================
  // WORKFLOW MANAGEMENT METHODS
  // ========================================

  private calculateExecutionOrder(steps: ExecutionStep[]): string[] {
    const stepMap = new Map(steps.map(s => [s.id, s]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (stepId: string) => {
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected involving step: ${stepId}`);
      }
      if (visited.has(stepId)) {
        return;
      }

      const step = stepMap.get(stepId);
      if (!step) {
        throw new Error(`Step not found: ${stepId}`);
      }

      visiting.add(stepId);

      // Visit dependencies first
      for (const depId of step.dependencies) {
        visit(depId);
      }

      visiting.delete(stepId);
      visited.add(stepId);
      result.push(stepId);
    };

    // Visit all steps
    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step.id);
      }
    }

    return result;
  }

  private validateWorkflowResults(scenario: ScenarioDefinition, context: ExecutionContext): {success: boolean; errors: string[]} {
    const errors: string[] = [];

    // Check required results
    for (const requiredResult of scenario.validation.requiredResults) {
      if (!context.stepResults.has(requiredResult)) {
        errors.push(`Missing required result: ${requiredResult}`);
      }
    }

    // Apply custom success criteria
    try {
      const customValidation = scenario.validation.successCriteria(context.stepResults);
      if (!customValidation) {
        errors.push('Custom success criteria not met');
      }
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      success: errors.length === 0 && context.failedSteps.size === 0,
      errors
    };
  }

  private async rollbackWorkflow(context: ExecutionContext, scenario: ScenarioDefinition): Promise<void> {
    this.logger.warn('Starting workflow rollback', {
      executionId: context.executionId,
      completedSteps: context.completedSteps.size
    });

    // Rollback completed steps in reverse order
    const completedStepsArray = Array.from(context.completedSteps).reverse();
    
    for (const stepId of completedStepsArray) {
      try {
        await this.rollbackStep(stepId, context);
        this.logger.debug('Step rolled back', { stepId });
      } catch (error) {
        this.logger.error('Step rollback failed', { stepId, error: error.message });
      }
    }
  }

  private async rollbackStep(stepId: string, context: ExecutionContext): Promise<void> {
    // Simulate rollback operation
    await this.delay(100 + Math.random() * 300);
    
    // Remove step result
    context.stepResults.delete(stepId);
    context.completedSteps.delete(stepId);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private calculateAverageStepDuration(context: ExecutionContext): number {
    if (context.metrics.stepDurations.size === 0) return 0;
    
    const totalDuration = Array.from(context.metrics.stepDurations.values()).reduce((sum, duration) => sum + duration, 0);
    return totalDuration / context.metrics.stepDurations.size;
  }

  private identifyBottleneckSteps(context: ExecutionContext): string[] {
    const durations = Array.from(context.metrics.stepDurations.entries());
    const averageDuration = this.calculateAverageStepDuration(context);
    
    return durations
      .filter(([_, duration]) => duration > averageDuration * 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([stepId, _]) => stepId);
  }

  private generateRecommendations(context: ExecutionContext, scenario: ScenarioDefinition): string[] {
    const recommendations: string[] = [];

    if (context.failedSteps.size > 0) {
      recommendations.push('Review failed steps and fix underlying issues');
    }

    if (context.metrics.failedSteps / context.metrics.totalSteps > 0.2) {
      recommendations.push('High failure rate detected - consider reviewing step dependencies');
    }

    const bottlenecks = this.identifyBottleneckSteps(context);
    if (bottlenecks.length > 0) {
      recommendations.push(`Optimize performance of bottleneck steps: ${bottlenecks.join(', ')}`);
    }

    if (context.metrics.skippedSteps > 0) {
      recommendations.push('Review step conditions to ensure necessary steps are executed');
    }

    return recommendations;
  }

  private createFailedResult(scenarioId: string, error: any): WorkflowResult {
    return {
      executionId: `failed-${Date.now()}`,
      success: false,
      duration: 0,
      startTime: new Date(),
      endTime: new Date(),
      completedSteps: [],
      failedSteps: [scenarioId],
      skippedSteps: [],
      results: new Map(),
      summary: {
        totalSteps: 1,
        successRate: 0,
        averageStepDuration: 0,
        bottleneckSteps: [],
        recommendations: ['Fix critical errors before retry']
      },
      errors: [error.message || 'Unknown error']
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // PUBLIC UTILITY METHODS
  // ========================================

  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }

  getExecutionStatus(executionId: string): ExecutionContext | null {
    return this.activeExecutions.get(executionId) || null;
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      return false;
    }

    this.logger.warn('Cancelling execution', { executionId });
    this.activeExecutions.delete(executionId);
    return true;
  }
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

export function createScenarioExecutor(): ScenarioExecutor {
  return new ScenarioExecutor();
}

export function createSimpleWorkflow(steps: Omit<ExecutionStep, 'dependencies' | 'retries' | 'timeout'>[]): ScenarioDefinition {
  const workflowSteps: ExecutionStep[] = steps.map((step, index) => ({
    ...step,
    dependencies: index > 0 ? [steps[index - 1].id] : [],
    retries: 2,
    timeout: 30000
  }));

  return {
    id: `simple-workflow-${Date.now()}`,
    name: 'Simple Sequential Workflow',
    description: 'Auto-generated sequential workflow',
    version: '1.0.0',
    steps: workflowSteps,
    globalConfiguration: {},
    validation: {
      requiredResults: workflowSteps.map(s => s.id),
      successCriteria: (results) => results.size === workflowSteps.length,
      rollbackOnFailure: false
    }
  };
}

// CommonJS exports
module.exports = {
  ScenarioExecutor,
  createScenarioExecutor,
  createSimpleWorkflow
};
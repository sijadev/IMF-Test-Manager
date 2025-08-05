// ========================================
// PERFORMANCE MONITORING UTILITIES
// ========================================

const { Logger } = require('../generators/logger');
const fs = require('fs-extra');
const path = require('path');

// ========================================
// INTERFACES
// ========================================

export interface PerformanceMetrics {
  operationName: string;
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  customMetrics: Record<string, number>;
  metadata: Record<string, any>;
}

export interface PerformanceReport {
  reportId: string;
  generatedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    operationTypes: Record<string, number>;
    successRate: number;
  };
  topBottlenecks: Array<{
    operationName: string;
    averageDuration: number;
    occurrences: number;
    impactScore: number;
  }>;
  memoryAnalysis: {
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    memoryLeakIndicators: string[];
  };
  recommendations: string[];
  detailedMetrics: PerformanceMetrics[];
}

export interface MonitoringConfig {
  enableCpuTracking: boolean;
  enableMemoryTracking: boolean;
  enableCustomMetrics: boolean;
  samplingInterval: number;
  retentionPeriod: number; // in milliseconds
  reportGenerationInterval: number;
  thresholds: {
    slowOperationMs: number;
    highMemoryUsageMB: number;
    cpuUsagePercent: number;
  };
}

// ========================================
// PERFORMANCE MONITOR CLASS
// ========================================

export class PerformanceMonitor {
  private logger: any;
  private config: MonitoringConfig;
  private metrics: Map<string, PerformanceMetrics>;
  private activeOperations: Map<string, {
    operationName: string;
    startTime: Date;
    startMemory: NodeJS.MemoryUsage;
    startCpu: NodeJS.CpuUsage;
    customMetrics: Record<string, number>;
    metadata: Record<string, any>;
  }>;
  private performanceTimers: Map<string, NodeJS.Timer>;
  private reports: PerformanceReport[];

  constructor(config?: Partial<MonitoringConfig>) {
    this.logger = new Logger('PerformanceMonitor');
    this.config = {
      enableCpuTracking: true,
      enableMemoryTracking: true,
      enableCustomMetrics: true,
      samplingInterval: 1000, // 1 second
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      reportGenerationInterval: 60 * 60 * 1000, // 1 hour
      thresholds: {
        slowOperationMs: 5000,
        highMemoryUsageMB: 512,
        cpuUsagePercent: 80
      },
      ...config
    };

    this.metrics = new Map();
    this.activeOperations = new Map();
    this.performanceTimers = new Map();
    this.reports = [];

    this.startPeriodicTasks();
    
    this.logger.info('Performance Monitor initialized', {
      samplingInterval: this.config.samplingInterval,
      retentionPeriod: this.config.retentionPeriod
    });
  }

  // ========================================
  // OPERATION TRACKING
  // ========================================

  startTracking(operationName: string, metadata: Record<string, any> = {}): string {
    const executionId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const startMemory = this.config.enableMemoryTracking ? process.memoryUsage() : {
      rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0
    };
    
    const startCpu = this.config.enableCpuTracking ? process.cpuUsage() : { user: 0, system: 0 };

    this.activeOperations.set(executionId, {
      operationName,
      startTime,
      startMemory,
      startCpu,
      customMetrics: {},
      metadata
    });

    this.logger.debug('Started tracking operation', {
      operationName,
      executionId,
      metadata
    });

    return executionId;
  }

  stopTracking(executionId: string): PerformanceMetrics | null {
    const operation = this.activeOperations.get(executionId);
    if (!operation) {
      this.logger.warn('Attempted to stop tracking non-existent operation', { executionId });
      return null;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - operation.startTime.getTime();

    const endMemory = this.config.enableMemoryTracking ? process.memoryUsage() : operation.startMemory;
    const endCpu = this.config.enableCpuTracking ? process.cpuUsage(operation.startCpu) : { user: 0, system: 0 };

    const metrics: PerformanceMetrics = {
      operationName: operation.operationName,
      executionId,
      startTime: operation.startTime,
      endTime,
      duration,
      memoryUsage: {
        rss: endMemory.rss - operation.startMemory.rss,
        heapUsed: endMemory.heapUsed - operation.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - operation.startMemory.heapTotal,
        external: endMemory.external - operation.startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - operation.startMemory.arrayBuffers
      },
      cpuUsage: endCpu,
      customMetrics: { ...operation.customMetrics },
      metadata: operation.metadata
    };

    // Store metrics
    this.metrics.set(executionId, metrics);
    this.activeOperations.delete(executionId);

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);

    this.logger.debug('Stopped tracking operation', {
      operationName: operation.operationName,
      executionId,
      duration,
      memoryDelta: metrics.memoryUsage.heapUsed
    });

    return metrics;
  }

  async trackExecution<T>(operationName: string, operation: () => Promise<T>, metadata: Record<string, any> = {}): Promise<T> {
    const executionId = this.startTracking(operationName, metadata);
    
    try {
      const result = await operation();
      this.stopTracking(executionId);
      return result;
    } catch (error) {
      this.addCustomMetric(executionId, 'error', 1);
      this.stopTracking(executionId);
      throw error;
    }
  }

  trackSync<T>(operationName: string, operation: () => T, metadata: Record<string, any> = {}): T {
    const executionId = this.startTracking(operationName, metadata);
    
    try {
      const result = operation();
      this.stopTracking(executionId);
      return result;
    } catch (error) {
      this.addCustomMetric(executionId, 'error', 1);
      this.stopTracking(executionId);
      throw error;
    }
  }

  // ========================================
  // CUSTOM METRICS
  // ========================================

  addCustomMetric(executionId: string, metricName: string, value: number): void {
    const operation = this.activeOperations.get(executionId);
    if (operation && this.config.enableCustomMetrics) {
      operation.customMetrics[metricName] = value;
      
      this.logger.debug('Added custom metric', {
        executionId,
        metricName,
        value
      });
    }
  }

  incrementCustomMetric(executionId: string, metricName: string, increment: number = 1): void {
    const operation = this.activeOperations.get(executionId);
    if (operation && this.config.enableCustomMetrics) {
      operation.customMetrics[metricName] = (operation.customMetrics[metricName] || 0) + increment;
    }
  }

  // ========================================
  // REPORTING
  // ========================================

  async generatePerformanceReport(timeRange?: { start: Date; end: Date }): Promise<PerformanceReport> {
    const reportId = `report-${Date.now()}`;
    const now = new Date();
    const defaultTimeRange = {
      start: new Date(now.getTime() - this.config.retentionPeriod),
      end: now
    };
    
    const actualTimeRange = timeRange || defaultTimeRange;
    
    this.logger.info('Generating performance report', {
      reportId,
      timeRange: actualTimeRange
    });

    // Filter metrics by time range
    const relevantMetrics = Array.from(this.metrics.values()).filter(metric =>
      metric.startTime >= actualTimeRange.start && metric.startTime <= actualTimeRange.end
    );

    if (relevantMetrics.length === 0) {
      this.logger.warn('No metrics found for time range', { timeRange: actualTimeRange });
    }

    const report: PerformanceReport = {
      reportId,
      generatedAt: now,
      timeRange: actualTimeRange,
      summary: this.calculateSummary(relevantMetrics),
      topBottlenecks: this.identifyBottlenecks(relevantMetrics),
      memoryAnalysis: this.analyzeMemoryUsage(relevantMetrics),
      recommendations: this.generateRecommendations(relevantMetrics),
      detailedMetrics: relevantMetrics
    };

    // Store report
    this.reports.push(report);
    
    // Cleanup old reports
    this.cleanupOldReports();

    this.logger.info('Performance report generated', {
      reportId,
      totalOperations: report.summary.totalOperations,
      averageDuration: report.summary.averageDuration
    });

    return report;
  }

  getRecentReports(count: number = 10): PerformanceReport[] {
    return this.reports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, count);
  }

  async exportReport(report: PerformanceReport, format: 'json' | 'csv' = 'json', outputPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = outputPath || `performance-report-${timestamp}.${format}`;
    
    let content: string;
    
    if (format === 'json') {
      content = JSON.stringify(report, null, 2);
    } else {
      content = this.convertReportToCSV(report);
    }

    await fs.writeFile(filename, content, 'utf8');
    
    this.logger.info('Performance report exported', {
      reportId: report.reportId,
      format,
      filename,
      size: content.length
    });

    return filename;
  }

  // ========================================
  // ANALYSIS METHODS
  // ========================================

  private calculateSummary(metrics: PerformanceMetrics[]): PerformanceReport['summary'] {
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        operationTypes: {},
        successRate: 100
      };
    }

    const durations = metrics.map(m => m.duration);
    const operationTypes: Record<string, number> = {};
    let errorCount = 0;

    metrics.forEach(metric => {
      operationTypes[metric.operationName] = (operationTypes[metric.operationName] || 0) + 1;
      if (metric.customMetrics.error) {
        errorCount++;
      }
    });

    return {
      totalOperations: metrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      operationTypes,
      successRate: ((metrics.length - errorCount) / metrics.length) * 100
    };
  }

  private identifyBottlenecks(metrics: PerformanceMetrics[]): PerformanceReport['topBottlenecks'] {
    const operationStats = new Map<string, { totalDuration: number; count: number; durations: number[] }>();

    metrics.forEach(metric => {
      const existing = operationStats.get(metric.operationName) || { totalDuration: 0, count: 0, durations: [] };
      existing.totalDuration += metric.duration;
      existing.count++;
      existing.durations.push(metric.duration);
      operationStats.set(metric.operationName, existing);
    });

    const bottlenecks = Array.from(operationStats.entries())
      .map(([operationName, stats]) => ({
        operationName,
        averageDuration: stats.totalDuration / stats.count,
        occurrences: stats.count,
        impactScore: (stats.totalDuration / stats.count) * stats.count // Average duration * frequency
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 10);

    return bottlenecks;
  }

  private analyzeMemoryUsage(metrics: PerformanceMetrics[]): PerformanceReport['memoryAnalysis'] {
    if (metrics.length === 0) {
      return {
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        memoryLeakIndicators: []
      };
    }

    const memoryUsages = metrics.map(m => m.memoryUsage.heapUsed);
    const leakIndicators: string[] = [];

    // Check for potential memory leaks
    const sustainedHighUsage = memoryUsages.filter(usage => usage > this.config.thresholds.highMemoryUsageMB * 1024 * 1024);
    if (sustainedHighUsage.length > metrics.length * 0.3) {
      leakIndicators.push('Sustained high memory usage detected');
    }

    // Check for growing memory trend
    const recentMetrics = metrics.slice(-10);
    if (recentMetrics.length > 5) {
      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.5) {
        leakIndicators.push('Memory usage trending upward');
      }
    }

    return {
      averageMemoryUsage: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      memoryLeakIndicators: leakIndicators
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.length === 0) {
      return recommendations;
    }

    const summary = this.calculateSummary(metrics);
    const bottlenecks = this.identifyBottlenecks(metrics);
    const memoryAnalysis = this.analyzeMemoryUsage(metrics);

    // Performance recommendations
    if (summary.averageDuration > this.config.thresholds.slowOperationMs) {
      recommendations.push('Average operation duration exceeds threshold - consider optimization');
    }

    // Bottleneck recommendations
    if (bottlenecks.length > 0) {
      recommendations.push(`Focus optimization efforts on: ${bottlenecks.slice(0, 3).map(b => b.operationName).join(', ')}`);
    }

    // Memory recommendations
    if (memoryAnalysis.memoryLeakIndicators.length > 0) {
      recommendations.push('Potential memory leaks detected - review memory management');
    }

    if (memoryAnalysis.averageMemoryUsage > this.config.thresholds.highMemoryUsageMB * 1024 * 1024) {
      recommendations.push('High memory usage detected - consider memory optimization');
    }

    // Success rate recommendations
    if (summary.successRate < 95) {
      recommendations.push('Low success rate detected - investigate error patterns');
    }

    return recommendations;
  }

  private convertReportToCSV(report: PerformanceReport): string {
    const headers = [
      'ExecutionId', 'OperationName', 'StartTime', 'EndTime', 'Duration',
      'MemoryRSS', 'MemoryHeapUsed', 'CPUUser', 'CPUSystem'
    ];
    
    const rows = report.detailedMetrics.map(metric => [
      metric.executionId,
      metric.operationName,
      metric.startTime.toISOString(),
      metric.endTime.toISOString(),
      metric.duration.toString(),
      metric.memoryUsage.rss.toString(),
      metric.memoryUsage.heapUsed.toString(),
      metric.cpuUsage.user.toString(),
      metric.cpuUsage.system.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // ========================================
  // THRESHOLD MONITORING
  // ========================================

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const issues: string[] = [];

    if (metrics.duration > this.config.thresholds.slowOperationMs) {
      issues.push(`Slow operation: ${metrics.duration}ms exceeds ${this.config.thresholds.slowOperationMs}ms threshold`);
    }

    const memoryUsageMB = metrics.memoryUsage.heapUsed / (1024 * 1024);
    if (memoryUsageMB > this.config.thresholds.highMemoryUsageMB) {
      issues.push(`High memory usage: ${memoryUsageMB.toFixed(2)}MB exceeds ${this.config.thresholds.highMemoryUsageMB}MB threshold`);
    }

    if (issues.length > 0) {
      this.logger.warn('Performance threshold violations detected', {
        operationName: metrics.operationName,
        executionId: metrics.executionId,
        issues
      });
    }
  }

  // ========================================
  // LIFECYCLE MANAGEMENT
  // ========================================

  private startPeriodicTasks(): void {
    // Cleanup old metrics
    const cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.samplingInterval * 10);

    // Generate periodic reports
    const reportTimer = setInterval(() => {
      this.generatePerformanceReport().catch(error => {
        this.logger.error('Failed to generate periodic report', { error: error.message });
      });
    }, this.config.reportGenerationInterval);

    this.performanceTimers.set('cleanup', cleanupTimer);
    this.performanceTimers.set('reporting', reportTimer);
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    let removedCount = 0;

    for (const [executionId, metrics] of this.metrics.entries()) {
      if (metrics.startTime < cutoffTime) {
        this.metrics.delete(executionId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug('Cleaned up old metrics', { removedCount });
    }
  }

  private cleanupOldReports(): void {
    const maxReports = 50;
    if (this.reports.length > maxReports) {
      this.reports = this.reports
        .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
        .slice(0, maxReports);
    }
  }

  // ========================================
  // PUBLIC UTILITY METHODS
  // ========================================

  getMetricsCount(): number {
    return this.metrics.size;
  }

  getActiveOperationsCount(): number {
    return this.activeOperations.size;
  }

  getCurrentSystemMetrics(): any {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  shutdown(): void {
    this.logger.info('Shutting down Performance Monitor');
    
    // Clear all timers
    for (const timer of this.performanceTimers.values()) {
      clearInterval(timer);
    }
    this.performanceTimers.clear();

    // Generate final report
    this.generatePerformanceReport().catch(error => {
      this.logger.error('Failed to generate final report', { error: error.message });
    });
  }
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

export function createPerformanceMonitor(config?: Partial<MonitoringConfig>): PerformanceMonitor {
  return new PerformanceMonitor(config);
}

// CommonJS exports
module.exports = {
  PerformanceMonitor,
  createPerformanceMonitor
};
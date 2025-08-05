// ========================================
// METRIC DATA GENERATOR
// ========================================

import { 
  MetricPoint, 
  MetricStream, 
  MetricGenerationConfig, 
  PatternType,
  GenerationError 
} from '@/types';
import { Logger } from '@/utils/logger';

export class MetricDataGenerator {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('MetricGenerator');
  }
  
  // ========================================
  // PUBLIC API
  // ========================================
  
  async generate(config: MetricGenerationConfig): Promise<MetricStream> {
    this.logger.info('Generating metric stream', {
      type: config.type,
      pattern: config.pattern,
      duration: config.duration
    });
    
    try {
      const points = await this.generateMetricPoints(config);
      const metadata = this.calculateMetadata(points, config.pattern);
      
      const stream: MetricStream = {
        name: `${config.type}_${config.pattern}`,
        type: config.type,
        unit: this.getUnitForMetricType(config.type),
        points,
        metadata
      };
      
      this.logger.info('Metric generation completed', {
        type: config.type,
        totalPoints: points.length,
        avgValue: metadata.avgValue,
        pattern: config.pattern
      });
      
      return stream;
      
    } catch (error) {
      this.logger.error('Metric generation failed', { error });
      throw new GenerationError(`Metric generation failed: ${error.message}`);
    }
  }
  
  async generateMultipleStreams(configs: MetricGenerationConfig[]): Promise<MetricStream[]> {
    this.logger.info('Generating multiple metric streams', { count: configs.length });
    
    const streams: MetricStream[] = [];
    
    for (const config of configs) {
      try {
        const stream = await this.generate(config);
        streams.push(stream);
      } catch (error) {
        this.logger.warn('Failed to generate metric stream', { 
          type: config.type, 
          error: error.message 
        });
      }
    }
    
    return streams;
  }
  
  // ========================================
  // METRIC POINT GENERATION
  // ========================================
  
  private async generateMetricPoints(config: MetricGenerationConfig): Promise<MetricPoint[]> {
    const points: MetricPoint[] = [];
    const startTime = new Date();
    const totalDuration = config.duration * 1000; // Convert to ms
    const interval = this.calculateInterval(config.type);
    
    let currentTime = startTime.getTime();
    const endTime = currentTime + totalDuration;
    let pointIndex = 0;
    
    // Initialize pattern-specific variables
    const patternState = this.initializePatternState(config);
    
    while (currentTime < endTime) {
      const timestamp = new Date(currentTime);
      const value = this.generateValue(config, patternState, pointIndex);
      
      const point: MetricPoint = {
        timestamp,
        value,
        tags: this.generateTags(config, pointIndex),
        generated: true
      };
      
      points.push(point);
      
      // Update pattern state
      this.updatePatternState(patternState, config, pointIndex);
      
      currentTime += interval;
      pointIndex++;
    }
    
    // Apply pattern-specific post-processing
    this.applyPatternPostProcessing(points, config.pattern);
    
    return points;
  }
  
  private generateValue(
    config: MetricGenerationConfig, 
    state: any, 
    index: number
  ): number {
    const baseValue = config.baseValue;
    const variance = config.variance;
    
    switch (config.pattern) {
      case 'stable':
        return this.generateStableValue(baseValue, variance);
        
      case 'spike':
        return this.generateSpikeValue(baseValue, variance, state, index);
        
      case 'degradation':
        return this.generateDegradationValue(baseValue, variance, state, index);
        
      case 'leak':
        return this.generateLeakValue(baseValue, variance, state, index);
        
      case 'fragmentation':
        return this.generateFragmentationValue(baseValue, variance, state, index);
        
      case 'congestion':
        return this.generateCongestionValue(baseValue, variance, state, index);
        
      default:
        return this.generateStableValue(baseValue, variance);
    }
  }
  
  // ========================================
  // PATTERN IMPLEMENTATIONS
  // ========================================
  
  private generateStableValue(baseValue: number, variance: number): number {
    // Small random fluctuations around base value
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const fluctuation = baseValue * variance * randomFactor * 0.1; // 10% of variance
    
    return Math.max(0, baseValue + fluctuation);
  }
  
  private generateSpikeValue(
    baseValue: number, 
    variance: number, 
    state: any, 
    index: number
  ): number {
    // Create periodic spikes
    const spikeFrequency = state.spikeFrequency || 50; // Every 50 points
    const spikeIntensity = state.spikeIntensity || 3; // 3x base value
    
    if (index % spikeFrequency === 0) {
      // Spike point
      state.inSpike = true;
      state.spikeCountdown = 5; // Spike lasts 5 points
      return baseValue * spikeIntensity;
    } else if (state.inSpike && state.spikeCountdown > 0) {
      // Gradual return to normal
      state.spikeCountdown--;
      if (state.spikeCountdown === 0) {
        state.inSpike = false;
      }
      const factor = 1 + (spikeIntensity - 1) * (state.spikeCountdown / 5);
      return baseValue * factor;
    } else {
      // Normal value with small variance
      return this.generateStableValue(baseValue, variance * 0.2);
    }
  }
  
  private generateDegradationValue(
    baseValue: number, 
    variance: number, 
    state: any, 
    index: number
  ): number {
    // Gradual degradation over time
    const degradationRate = state.degradationRate || 0.001; // 0.1% per point
    const currentBase = baseValue * (1 - degradationRate * index);
    
    return Math.max(baseValue * 0.1, this.generateStableValue(currentBase, variance));
  }
  
  private generateLeakValue(
    baseValue: number, 
    variance: number, 
    state: any, 
    index: number
  ): number {
    // Memory leak pattern - gradual increase
    const leakRate = state.leakRate || 0.002; // 0.2% per point
    const currentBase = baseValue * (1 + leakRate * index);
    
    // Add occasional drops (garbage collection)
    if (index > 0 && index % 100 === 0) {
      state.lastGC = currentBase * 0.7; // Drop to 70%
      return state.lastGC;
    }
    
    const minValue = state.lastGC || baseValue;
    return Math.max(minValue, this.generateStableValue(currentBase, variance));
  }
  
  private generateFragmentationValue(
    baseValue: number, 
    variance: number, 
    state: any, 
    index: number
  ): number {
    // Memory fragmentation - irregular spikes and drops
    const fragmentationCycle = state.fragmentationCycle || 30;
    
    if (index % fragmentationCycle === 0) {
      // Start new fragmentation cycle
      state.fragmentationPhase = Math.floor(Math.random() * 3); // 0, 1, or 2
    }
    
    const phaseProgress = (index % fragmentationCycle) / fragmentationCycle;
    
    switch (state.fragmentationPhase) {
      case 0: // Gradual increase
        return baseValue * (1 + phaseProgress * 0.5);
      case 1: // Sharp spike then drop
        return phaseProgress < 0.2 
          ? baseValue * (1 + phaseProgress * 2)
          : baseValue * (1.4 - phaseProgress);
      case 2: // Oscillation
        return baseValue * (1 + Math.sin(phaseProgress * Math.PI * 4) * 0.3);
      default:
        return this.generateStableValue(baseValue, variance);
    }
  }
  
  private generateCongestionValue(
    baseValue: number, 
    variance: number, 
    state: any, 
    index: number
  ): number {
    // Network congestion pattern
    const congestionCycle = state.congestionCycle || 60;
    const cycleProgress = (index % congestionCycle) / congestionCycle;
    
    // Create traffic patterns (morning/evening rush)
    const trafficFactor = 1 + Math.sin(cycleProgress * Math.PI * 2) * 0.6;
    
    // Add random congestion events
    if (Math.random() < 0.05) { // 5% chance
      state.congestionEvent = 10; // Lasts 10 points
    }
    
    let congestionMultiplier = 1;
    if (state.congestionEvent > 0) {
      congestionMultiplier = 2 + Math.random(); // 2-3x normal
      state.congestionEvent--;
    }
    
    return baseValue * trafficFactor * congestionMultiplier;
  }
  
  // ========================================
  // PATTERN STATE MANAGEMENT
  // ========================================
  
  private initializePatternState(config: MetricGenerationConfig): any {
    const state: any = {};
    
    switch (config.pattern) {
      case 'spike':
        state.spikeFrequency = config.spikeIntensity ? 30 : 50;
        state.spikeIntensity = config.spikeIntensity || 3;
        state.inSpike = false;
        state.spikeCountdown = 0;
        break;
        
      case 'degradation':
        state.degradationRate = config.degradationRate || 0.001;
        break;
        
      case 'leak':
        state.leakRate = config.degradationRate || 0.002;
        state.lastGC = config.baseValue;
        break;
        
      case 'fragmentation':
        state.fragmentationCycle = 30;
        state.fragmentationPhase = 0;
        break;
        
      case 'congestion':
        state.congestionCycle = 60;
        state.congestionEvent = 0;
        break;
    }
    
    return state;
  }
  
  private updatePatternState(state: any, config: MetricGenerationConfig, index: number): void {
    // Pattern-specific state updates happen in generateValue methods
    // This method can be used for cross-pattern state management
  }
  
  private applyPatternPostProcessing(points: MetricPoint[], pattern: PatternType): void {
    switch (pattern) {
      case 'spike':
        this.smoothSpikeTail(points);
        break;
        
      case 'degradation':
        this.ensureMinimumValues(points);
        break;
        
      case 'leak':
        this.validateLeakPattern(points);
        break;
    }
  }
  
  private smoothSpikeTail(points: MetricPoint[]): void {
    // Smooth out abrupt transitions after spikes
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1].value;
      const curr = points[i].value;
      const next = points[i + 1].value;
      
      // If current point is significantly different from neighbors
      if (Math.abs(curr - prev) > prev * 0.5 && Math.abs(curr - next) > next * 0.5) {
        // Smooth it out
        points[i].value = (prev + next) / 2;
      }
    }
  }
  
  private ensureMinimumValues(points: MetricPoint[]): void {
    // Ensure degradation doesn't go below reasonable minimums
    const firstValue = points[0]?.value || 0;
    const minimumValue = firstValue * 0.05; // 5% of original
    
    points.forEach(point => {
      if (point.value < minimumValue) {
        point.value = minimumValue;
      }
    });
  }
  
  private validateLeakPattern(points: MetricPoint[]): void {
    // Ensure leak pattern shows overall upward trend
    let lastGCIndex = 0;
    
    for (let i = 1; i < points.length; i++) {
      if (points[i].value < points[i - 1].value * 0.8) {
        // Detected GC event
        lastGCIndex = i;
      } else if (i - lastGCIndex > 100) {
        // Too long without GC, force one
        points[i].value = points[lastGCIndex].value * 0.7;
        lastGCIndex = i;
      }
    }
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  private calculateInterval(metricType: string): number {
    // Return interval in milliseconds based on metric type
    switch (metricType) {
      case 'cpu':
      case 'memory':
        return 1000; // 1 second
      case 'disk':
        return 5000; // 5 seconds
      case 'network':
        return 500; // 500ms
      default:
        return 1000;
    }
  }
  
  private getUnitForMetricType(metricType: string): string {
    switch (metricType) {
      case 'cpu':
        return 'percent';
      case 'memory':
        return 'MB';
      case 'disk':
        return 'percent';
      case 'network':
        return 'bytes/sec';
      default:
        return 'count';
    }
  }
  
  private generateTags(config: MetricGenerationConfig, index: number): Record<string, string> {
    const tags: Record<string, string> = {
      source: 'test-generator',
      type: config.type,
      pattern: config.pattern
    };
    
    // Add metric-specific tags
    switch (config.type) {
      case 'cpu':
        tags.core = `core-${Math.floor(Math.random() * 8)}`;
        break;
      case 'memory':
        tags.pool = Math.random() < 0.5 ? 'heap' : 'non-heap';
        break;
      case 'disk':
        tags.mount = Math.random() < 0.7 ? '/' : '/var';
        break;
      case 'network':
        tags.interface = Math.random() < 0.8 ? 'eth0' : 'eth1';
        tags.direction = Math.random() < 0.5 ? 'in' : 'out';
        break;
    }
    
    return tags;
  }
  
  private calculateMetadata(points: MetricPoint[], pattern: PatternType): any {
    if (points.length === 0) {
      return {
        totalPoints: 0,
        avgValue: 0,
        maxValue: 0,
        minValue: 0,
        pattern
      };
    }
    
    const values = points.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      totalPoints: points.length,
      avgValue: sum / points.length,
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      pattern
    };
  }
}

// ========================================
// METRIC CONFIGURATION HELPERS
// ========================================

export class MetricConfigBuilder {
  private config: Partial<MetricGenerationConfig> = {};
  
  static create(): MetricConfigBuilder {
    return new MetricConfigBuilder();
  }
  
  type(metricType: 'cpu' | 'memory' | 'disk' | 'network'): MetricConfigBuilder {
    this.config.type = metricType;
    return this;
  }
  
  pattern(pattern: PatternType): MetricConfigBuilder {
    this.config.pattern = pattern;
    return this;
  }
  
  duration(seconds: number): MetricConfigBuilder {
    this.config.duration = seconds;
    return this;
  }
  
  baseValue(value: number): MetricConfigBuilder {
    this.config.baseValue = value;
    return this;
  }
  
  variance(variance: number): MetricConfigBuilder {
    this.config.variance = variance;
    return this;
  }
  
  spikeIntensity(intensity: number): MetricConfigBuilder {
    this.config.spikeIntensity = intensity;
    return this;
  }
  
  degradationRate(rate: number): MetricConfigBuilder {
    this.config.degradationRate = rate;
    return this;
  }
  
  build(): MetricGenerationConfig {
    // Validate required fields
    if (!this.config.type || !this.config.pattern || !this.config.duration) {
      throw new Error('Missing required configuration: type, pattern, and duration');
    }
    
    // Set defaults
    const config: MetricGenerationConfig = {
      type: this.config.type!,
      pattern: this.config.pattern!,
      duration: this.config.duration!,
      baseValue: this.config.baseValue || this.getDefaultBaseValue(this.config.type!),
      variance: this.config.variance || 0.1, // 10% variance
      spikeIntensity: this.config.spikeIntensity,
      degradationRate: this.config.degradationRate
    };
    
    return config;
  }
  
  private getDefaultBaseValue(type: string): number {
    switch (type) {
      case 'cpu':
        return 50; // 50% CPU usage
      case 'memory':
        return 1024; // 1GB memory usage
      case 'disk':
        return 70; // 70% disk usage
      case 'network':
        return 1000000; // 1MB/s network throughput
      default:
        return 100;
    }
  }
}

// ========================================
// PREDEFINED METRIC SCENARIOS
// ========================================

export class MetricScenarios {
  static createPerformanceDegradation(duration: number = 300): MetricGenerationConfig[] {
    return [
      MetricConfigBuilder.create()
        .type('cpu')
        .pattern('spike')
        .duration(duration)
        .baseValue(30)
        .variance(0.2)
        .spikeIntensity(3)
        .build(),
        
      MetricConfigBuilder.create()
        .type('memory')
        .pattern('leak')
        .duration(duration)
        .baseValue(512)
        .variance(0.1)
        .degradationRate(0.003)
        .build(),
        
      MetricConfigBuilder.create()
        .type('disk')
        .pattern('degradation')
        .duration(duration)
        .baseValue(20)
        .variance(0.15)
        .degradationRate(0.001)
        .build()
    ];
  }
  
  static createStableBaseline(duration: number = 300): MetricGenerationConfig[] {
    return [
      MetricConfigBuilder.create()
        .type('cpu')
        .pattern('stable')
        .duration(duration)
        .baseValue(25)
        .variance(0.1)
        .build(),
        
      MetricConfigBuilder.create()
        .type('memory')
        .pattern('stable')
        .duration(duration)
        .baseValue(256)
        .variance(0.05)
        .build(),
        
      MetricConfigBuilder.create()
        .type('network')
        .pattern('stable')
        .duration(duration)
        .baseValue(500000)
        .variance(0.2)
        .build()
    ];
  }
  
  static createStressTest(duration: number = 180): MetricGenerationConfig[] {
    return [
      MetricConfigBuilder.create()
        .type('cpu')
        .pattern('spike')
        .duration(duration)
        .baseValue(80)
        .variance(0.15)
        .spikeIntensity(1.2)
        .build(),
        
      MetricConfigBuilder.create()
        .type('memory')
        .pattern('fragmentation')
        .duration(duration)
        .baseValue(2048)
        .variance(0.3)
        .build(),
        
      MetricConfigBuilder.create()
        .type('network')
        .pattern('congestion')
        .duration(duration)
        .baseValue(2000000)
        .variance(0.4)
        .build()
    ];
  }
}
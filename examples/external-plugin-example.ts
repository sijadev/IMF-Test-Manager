// ========================================
// EXTERNAL TEST DATA LOADER PLUGIN - BEISPIEL
// ========================================

import { 
  TestDataLoaderPlugin,
  ExternalTestManager,
  DefaultIMFStorage,
  DefaultMLService,
  createTestDataLoaderPlugin,
  createCustomTestDataLoaderPlugin
} from '../src/plugins/test-data-loader';

async function basicPluginUsage() {
  console.log('🚀 Basic Plugin Usage\n');
  
  // Standard Plugin erstellen
  const plugin = createTestDataLoaderPlugin();
  
  try {
    // Externe Testdaten laden
    await plugin.loadExternalTestData('external-profile-001');
    console.log('✅ External test data loaded successfully');
    
    // Model Status abrufen
    const modelStatus = await plugin.getModelStatus();
    console.log('📊 Model Status:', {
      modelId: modelStatus.modelId,
      accuracy: `${(modelStatus.accuracy * 100).toFixed(1)}%`,
      trainingDataSize: modelStatus.trainingDataSize,
      lastTraining: modelStatus.lastTrainingDate.toISOString()
    });
    
    // Vorhersagen durchführen
    const predictions = await plugin.runPredictions({
      codeSnippet: 'function test() { return null; }',
      metrics: { cpu: 80, memory: 65 }
    });
    
    console.log('🔮 Predictions:', {
      count: predictions.predictions.length,
      executionTime: `${predictions.executionTime}ms`,
      avgConfidence: `${(predictions.predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.predictions.length * 100).toFixed(1)}%`
    });
    
  } catch (error) {
    console.error('❌ Basic usage failed:', error.message);
  }
}

async function advancedPluginUsage() {
  console.log('\n🔧 Advanced Plugin Usage\n');
  
  // Custom Storage und ML Service
  const customStorage = new DefaultIMFStorage();
  const customMLService = new DefaultMLService();
  
  // Plugin mit Custom Services
  const plugin = createCustomTestDataLoaderPlugin(customStorage, customMLService);
  
  try {
    // Mehrere Profile parallel laden
    const profiles = [
      'external-performance-001',
      'external-security-001', 
      'external-ml-training-001'
    ];
    
    console.log(`📦 Loading ${profiles.length} profiles in parallel...`);
    
    const startTime = Date.now();
    await plugin.loadMultipleProfiles(profiles);
    const duration = Date.now() - startTime;
    
    console.log(`✅ All profiles loaded in ${duration}ms`);
    
    // Model-Metriken nach Training
    const finalMetrics = await plugin.getModelStatus();
    console.log('📈 Final Model Metrics:', {
      accuracy: `${(finalMetrics.accuracy * 100).toFixed(1)}%`,
      dataSize: finalMetrics.trainingDataSize,
      version: finalMetrics.version
    });
    
  } catch (error) {
    console.error('❌ Advanced usage failed:', error.message);
  }
}

async function workflowDemo() {
  console.log('\n🔄 Complete Workflow Demo\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  try {
    // 1. Externe Daten laden
    console.log('1️⃣ Loading external test data...');
    await plugin.loadExternalTestData('workflow-demo-profile');
    
    // 2. Model Status überprüfen
    console.log('2️⃣ Checking model status...');
    const status = await plugin.getModelStatus();
    console.log(`   Model accuracy: ${(status.accuracy * 100).toFixed(1)}%`);
    
    // 3. Testvorhersagen
    console.log('3️⃣ Running test predictions...');
    const testCases = [
      { code: 'let x = null; x.value;', type: 'null_pointer' },
      { code: 'while(true) { allocate(); }', type: 'memory_leak' },
      { code: 'setTimeout(() => {}, 0);', type: 'normal' }
    ];
    
    for (const testCase of testCases) {
      const prediction = await plugin.runPredictions({
        codeSnippet: testCase.code,
        expectedType: testCase.type
      });
      
      const avgConfidence = prediction.predictions.reduce((sum, p) => sum + p.confidence, 0) / prediction.predictions.length;
      console.log(`   ${testCase.type}: ${(avgConfidence * 100).toFixed(1)}% confidence`);
    }
    
    // 4. Cleanup
    console.log('4️⃣ Cleaning up...');
    await plugin.clearStoredData('workflow-demo-profile');
    
    console.log('✅ Workflow completed successfully');
    
  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
  }
}

async function customExternalManagerDemo() {
  console.log('\n🏗 Custom External Manager Demo\n');
  
  // Custom External Test Manager Implementation
  class CustomExternalTestManager extends ExternalTestManager {
    constructor(profilePath: string) {
      super(profilePath);
    }
    
    async generate() {
      console.log(`🔄 Custom generation logic for: ${this.profilePath}`);
      
      // Custom logic hier - z.B. API calls, Datenbankabfragen, etc.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use parent implementation for actual generation
      return await super.generate();
    }
  }
  
  try {
    const customManager = new CustomExternalTestManager('custom-profile-001');
    const testData = await customManager.generate();
    
    console.log('✅ Custom external manager generated data:', {
      profileId: testData.profileId,
      scenarios: testData.data.scenarios.length,
      totalSamples: testData.metadata.totalSamples
    });
    
  } catch (error) {
    console.error('❌ Custom manager demo failed:', error.message);
  }
}

async function performanceDemo() {
  console.log('\n⚡ Performance Demo\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  try {
    // Measure loading time
    const profiles = Array.from({ length: 5 }, (_, i) => `perf-profile-${i + 1}`);
    
    console.log(`📊 Performance test with ${profiles.length} profiles...`);
    
    const startTime = Date.now();
    
    // Parallel loading
    await plugin.loadMultipleProfiles(profiles);
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / profiles.length;
    
    console.log(`⚡ Performance Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average per profile: ${avgTime.toFixed(1)}ms`);
    console.log(`   Throughput: ${(profiles.length / (totalTime / 1000)).toFixed(1)} profiles/sec`);
    
    // Memory usage simulation
    const modelMetrics = await plugin.getModelStatus();
    console.log(`💾 Final model size: ${modelMetrics.trainingDataSize} samples`);
    
  } catch (error) {
    console.error('❌ Performance demo failed:', error.message);
  }
}

// Demo ausführen
if (require.main === module) {
  async function runAllDemos() {
    console.log('🎯 IMF Test Data Loader Plugin - Demo Suite\n');
    console.log('=' .repeat(50));
    
    await basicPluginUsage();
    await advancedPluginUsage();
    await workflowDemo();
    await customExternalManagerDemo();
    await performanceDemo();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All demos completed!');
  }
  
  runAllDemos().catch(console.error);
}

export { 
  basicPluginUsage, 
  advancedPluginUsage, 
  workflowDemo, 
  customExternalManagerDemo,
  performanceDemo 
};
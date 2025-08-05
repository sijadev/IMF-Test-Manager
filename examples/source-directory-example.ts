// ========================================
// SOURCE DIRECTORY INTEGRATION - BEISPIEL
// ========================================

import { 
  TestDataLoaderPlugin,
  createTestDataLoaderPlugin 
} from '../src/plugins/test-data-loader';
import { 
  SourceDirectoryConfig,
  TestExecutionConfig 
} from '../src/types';
import * as path from 'path';

// ========================================
// IMF UI SOURCE DIRECTORY WORKFLOW
// ========================================

async function demonstrateSourceDirectoryWorkflow() {
  console.log('📁 IMF UI: Source Directory Integration\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  try {
    // 1. User wählt Testprofil in IMF UI aus
    console.log('1️⃣ Verfügbare Testprofile laden...');
    const profiles = await plugin.getAvailableTestProfiles();
    
    const selectedProfile = profiles.find(p => p.type === 'performance');
    if (!selectedProfile) {
      throw new Error('No performance profile found');
    }
    
    console.log(`   ✅ Testprofil gewählt: ${selectedProfile.name}`);
    console.log(`   📋 Unterstützte Sprachen: ${selectedProfile.sourceTemplate.supportedLanguages.join(', ')}`);
    console.log(`   🎯 Empfohlene Komplexität: ${selectedProfile.sourceTemplate.defaultComplexity}`);
    console.log(`   📝 Struktur-Empfehlung: ${selectedProfile.sourceTemplate.recommendedStructure}`);
    
    // 2. User gibt Source Directory in IMF UI ein
    console.log('\n2️⃣ Source Directory konfigurieren...');
    
    // Beispiel-Verzeichnisse (in echter IMF UI würde User das eingeben)
    const exampleSourceDirectories = [
      '/Users/user/projects/my-api-server',
      '/Users/user/projects/react-app', 
      '/Users/user/projects/microservice'
    ];
    
    const userSourceDirectory = exampleSourceDirectories[0]; // User-Auswahl simulieren
    
    const sourceConfig: SourceDirectoryConfig = {
      path: userSourceDirectory,
      validateStructure: true,
      depth: 8,
      excludePatterns: ['node_modules/**', 'dist/**', '.git/**']
    };
    
    console.log(`   📂 Gewähltes Verzeichnis: ${sourceConfig.path}`);
    
    // 3. IMF validiert Source Directory
    console.log('\n3️⃣ Source Directory validieren...');
    
    try {
      const validation = await plugin.validateSourceDirectory(selectedProfile.id, sourceConfig);
      
      console.log(`   📊 Validierung: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   🔍 Erkannte Sprachen: ${validation.detectedLanguages.join(', ')}`);
      console.log(`   📈 Erkannte Komplexität: ${validation.detectedComplexity}`);
      console.log(`   📁 Dateien: ${validation.fileCount}, Ordner: ${validation.directoryCount}`);
      console.log(`   💾 Größe: ${Math.round(validation.totalSize / 1024)}KB`);
      
      // Kompatibilitätsprüfung
      console.log('\n   🔗 Profil-Kompatibilität:');
      console.log(`      Sprachen: ${validation.profileCompatibility.languageMatch ? '✅' : '❌'}`);
      console.log(`      Komplexität: ${validation.profileCompatibility.complexityMatch ? '✅' : '❌'}`);
      console.log(`      Struktur: ${validation.profileCompatibility.structureMatch ? '✅' : '❌'}`);
      
      if (validation.issues.length > 0) {
        console.log('\n   ⚠️  Erkannte Probleme:');
        validation.issues.forEach(issue => {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`      ${icon} ${issue.message}`);
          if (issue.suggestion) {
            console.log(`         💡 ${issue.suggestion}`);
          }
        });
      }
      
      if (validation.profileCompatibility.recommendedActions.length > 0) {
        console.log('\n   💡 Empfehlungen:');
        validation.profileCompatibility.recommendedActions.forEach(action => {
          console.log(`      🔧 ${action}`);
        });
      }
      
      // 4. IMF startet Test mit Source Directory
      if (validation.valid || validation.issues.every(i => i.type !== 'error')) {
        console.log('\n4️⃣ Test mit Source Directory starten...');
        
        const testConfig: TestExecutionConfig = {
          profileId: selectedProfile.id,
          sourceDirectory: sourceConfig,
          options: {
            timeout: 300000, // 5 minutes
            generateReports: true,
            exportFormats: ['json', 'html']
          }
        };
        
        const executionId = await plugin.executeTestWithSourceDirectory(testConfig);
        console.log(`   🚀 Test gestartet: ${executionId}`);
        console.log(`   📊 Live-Monitoring verfügbar unter: /api/test/${executionId}/metrics`);
        
        // Simuliere UI-Updates für 30 Sekunden
        await simulateLiveMonitoring(plugin, executionId, 30);
        
      } else {
        console.log('\n❌ Test kann nicht gestartet werden - Validation Errors müssen behoben werden');
      }
      
    } catch (validationError) {
      console.log(`   ❌ Validation fehlgeschlagen: ${validationError.message}`);
      console.log(`   💡 Tipp: Überprüfen Sie den Pfad und die Berechtigung`);
    }
    
  } catch (error) {
    console.error('❌ Source Directory Workflow Fehler:', error.message);
  }
}

// ========================================
// SOURCE DIRECTORY EMPFEHLUNGEN
// ========================================

async function demonstrateSourceDirectoryRecommendations() {
  console.log('\n💡 Source Directory Empfehlungen\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  try {
    const profiles = await plugin.getAvailableTestProfiles();
    
    for (const profile of profiles.slice(0, 3)) { // Erste 3 Profile
      console.log(`📋 ${profile.name} (${profile.type})`);
      console.log('=' .repeat(50));
      
      const recommendations = await plugin.getSourceDirectoryRecommendations(profile.id);
      
      console.log(`🔤 Unterstützte Sprachen: ${recommendations.supportedLanguages.join(', ')}`);
      console.log(`📈 Empfohlene Komplexität: ${recommendations.recommendedComplexity}`);
      console.log(`📄 Benötigte Dateien: ${recommendations.requiredFiles.join(', ')}`);
      console.log(`🚫 Ausschluss-Pattern: ${recommendations.excludePatterns.slice(0, 3).join(', ')}...`);
      console.log(`🏗️  Struktur: ${recommendations.recommendedStructure}`);
      
      console.log('\n📁 Beispiel-Projektstrukturen:');
      recommendations.examples.forEach((example, index) => {
        console.log(`   ${index + 1}. ${example.name}`);
        console.log(`      📝 ${example.description}`);
        console.log(`      📂 ${example.structure.slice(0, 3).join(', ')}${example.structure.length > 3 ? '...' : ''}`);
      });
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Empfehlungen Fehler:', error.message);
  }
}

// ========================================
// MULTIPLE SOURCE DIRECTORIES
// ========================================

async function demonstrateMultipleSourceDirectories() {
  console.log('\n🔄 Multiple Source Directories Test\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  try {
    const profile = (await plugin.getAvailableTestProfiles())[0];
    
    // Simuliere Tests mit verschiedenen Source Directories
    const sourceDirectories = [
      { name: 'Frontend App', path: '/Users/user/frontend-app', type: 'React' },
      { name: 'Backend API', path: '/Users/user/backend-api', type: 'Node.js' },
      { name: 'Microservice', path: '/Users/user/microservice', type: 'TypeScript' }
    ];
    
    console.log(`📊 Teste Profil "${profile.name}" mit ${sourceDirectories.length} verschiedenen Projekten:\n`);
    
    const executions = [];
    
    for (const sourceDir of sourceDirectories) {
      console.log(`🚀 Starte Test für ${sourceDir.name} (${sourceDir.type})...`);
      
      const config: TestExecutionConfig = {
        profileId: profile.id,
        sourceDirectory: {
          path: sourceDir.path,
          validateStructure: false, // Skip validation for demo
          excludePatterns: ['node_modules/**', 'dist/**']
        },
        options: {
          skipValidation: true, // Skip für Demo
          timeout: 60000
        }
      };
      
      try {
        const executionId = await plugin.executeTestWithSourceDirectory(config);
        executions.push({ id: executionId, name: sourceDir.name, type: sourceDir.type });
        console.log(`   ✅ ${sourceDir.name}: ${executionId}`);
      } catch (error) {
        console.log(`   ❌ ${sourceDir.name}: ${error.message}`);
      }
    }
    
    // Monitor alle Tests gleichzeitig
    if (executions.length > 0) {
      console.log(`\n📊 Monitoring ${executions.length} parallele Tests für 20 Sekunden...\n`);
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.clear();
        console.log('📊 MULTIPLE SOURCE DIRECTORIES - LIVE MONITORING');
        console.log('=' .repeat(70));
        
        for (const execution of executions) {
          const metrics = await plugin.getLiveTestMetrics(execution.id);
          const status = await plugin.getTestExecutionStatus(execution.id);
          
          if (metrics && status) {
            console.log(`🆔 ${execution.name} (${execution.type})`);
            console.log(`   📈 Progress: ${metrics.progress.toFixed(1)}% | Status: ${metrics.status.toUpperCase()}`);
            console.log(`   💻 CPU: ${metrics.metrics.cpu.toFixed(1)}% | RAM: ${metrics.metrics.memory.toFixed(1)}%`);
            console.log(`   🎯 Probleme: ${metrics.metrics.problemsDetected} | Fixes: ${metrics.metrics.fixesSuccessful}`);
            console.log(`   📋 Phase: ${status.currentPhase.name}`);
            console.log('');
          }
        }
        
        console.log('=' .repeat(70));
        console.log(`📊 Update ${i + 1}/10`);
        
        // Check if all completed
        const allCompleted = await Promise.all(
          executions.map(async exec => {
            const status = await plugin.getTestExecutionStatus(exec.id);
            return status?.status === 'completed' || status?.status === 'failed';
          })
        );
        
        if (allCompleted.every(Boolean)) {
          console.log('\n🎉 Alle Tests abgeschlossen!');
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Multiple Source Directories Fehler:', error.message);
  }
}

// ========================================
// UI INTEGRATION SIMULATION
// ========================================

async function simulateIMFUIIntegration() {
  console.log('\n🖥️  IMF UI Integration Simulation\n');
  
  const plugin = createTestDataLoaderPlugin();
  
  console.log('🌐 Simuliere IMF Web Interface...');
  console.log('=' .repeat(60));
  
  // Simuliere UI API Calls
  const uiWorkflow = [
    {
      step: 'Load Test Profiles',
      api: 'GET /api/test-profiles',
      action: async () => {
        const profiles = await plugin.getAvailableTestProfiles();
        return `${profiles.length} profiles loaded`;
      }
    },
    {
      step: 'Get Profile Details',
      api: 'GET /api/test-profiles/:id',
      action: async () => {
        const profiles = await plugin.getAvailableTestProfiles();
        const profile = await plugin.getProfileDetails(profiles[0].id);
        return `Profile "${profile.name}" details loaded`;
      }
    },
    {
      step: 'Get Source Recommendations',
      api: 'GET /api/test-profiles/:id/source-recommendations',
      action: async () => {
        const profiles = await plugin.getAvailableTestProfiles();
        const recommendations = await plugin.getSourceDirectoryRecommendations(profiles[0].id);
        return `${recommendations.supportedLanguages.length} languages supported`;
      }
    },
    {
      step: 'Validate Source Directory',
      api: 'POST /api/source-directory/validate',
      action: async () => {
        const profiles = await plugin.getAvailableTestProfiles();
        try {
          const validation = await plugin.validateSourceDirectory(profiles[0].id, {
            path: '/example/project',
            validateStructure: true
          });
          return validation.valid ? 'Valid source directory' : `${validation.issues.length} issues found`;
        } catch {
          return 'Validation skipped (example path)';
        }
      }
    },
    {
      step: 'Start Test Execution',
      api: 'POST /api/test-executions',
      action: async () => {
        const profiles = await plugin.getAvailableTestProfiles();
        const config: TestExecutionConfig = {
          profileId: profiles[0].id,
          sourceDirectory: {
            path: '/example/project',
            validateStructure: false
          },
          options: { skipValidation: true }
        };
        const executionId = await plugin.executeTestWithSourceDirectory(config);
        return `Execution started: ${executionId}`;
      }
    }
  ];
  
  for (const workflow of uiWorkflow) {
    try {
      console.log(`📡 ${workflow.step}`);
      console.log(`   API: ${workflow.api}`);
      
      const startTime = Date.now();
      const result = await workflow.action();
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ ${result} (${duration}ms)`);
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎉 IMF UI Integration Simulation completed!');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function simulateLiveMonitoring(plugin: TestDataLoaderPlugin, executionId: string, seconds: number) {
  console.log(`\n📊 Live-Monitoring für ${seconds} Sekunden...`);
  
  const updates = Math.floor(seconds / 3); // Update alle 3 Sekunden
  
  for (let i = 0; i < updates; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const metrics = await plugin.getLiveTestMetrics(executionId);
    const status = await plugin.getTestExecutionStatus(executionId);
    
    if (metrics && status) {
      console.log(`   📊 ${metrics.progress.toFixed(1)}% | ${metrics.status.toUpperCase()} | Phase: ${status.currentPhase.name}`);
      console.log(`   💻 CPU: ${metrics.metrics.cpu.toFixed(1)}% | Probleme: ${metrics.metrics.problemsDetected}`);
      
      if (metrics.status === 'completed' || metrics.status === 'failed') {
        console.log(`   🎉 Test ${metrics.status}!`);
        break;
      }
    }
  }
}

// ========================================
// MAIN DEMO RUNNER
// ========================================

if (require.main === module) {
  async function runSourceDirectoryDemo() {
    console.log('📁 IMF Test Manager - Source Directory Integration Demo');
    console.log('=' .repeat(70));
    
    await demonstrateSourceDirectoryWorkflow();
    await demonstrateSourceDirectoryRecommendations();
    await demonstrateMultipleSourceDirectories();
    await simulateIMFUIIntegration();
    
    console.log('\n🎉 Source Directory Integration Demo abgeschlossen!');
  }
  
  runSourceDirectoryDemo().catch(console.error);
}

export { 
  demonstrateSourceDirectoryWorkflow,
  demonstrateSourceDirectoryRecommendations,
  demonstrateMultipleSourceDirectories,
  simulateIMFUIIntegration
};
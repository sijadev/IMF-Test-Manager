// ========================================
// IMF TEST DATA LOADER PLUGIN - BEISPIEL
// ========================================

import { TestDataLoaderPlugin } from '../src/adapters/test-data-loader-plugin';
import { TestProfileManager } from '../src/core/profile-manager';

async function demonstratePlugin() {
  console.log('🚀 IMF Test Data Loader Plugin Demo\n');

  // Plugin initialisieren
  const plugin = new TestDataLoaderPlugin({
    outputDirectory: './output',
    enableCaching: true,
    timeout: 30000
  });

  try {
    // ========================================
    // 1. TESTPROFIL LADEN UND DATEN GENERIEREN
    // ========================================
    console.log('📋 1. Lade Testprofil und generiere Daten...');
    
    const testData = await plugin.loadTestProfile('performance-test-001');
    
    console.log(`✅ Testdaten generiert:`);
    console.log(`   - Profile ID: ${testData.profileId}`);
    console.log(`   - Szenarien: ${testData.data.scenarios.length}`);
    console.log(`   - Log-Einträge: ${testData.statistics.totalLogEntries}`);
    console.log(`   - Metriken: ${testData.statistics.totalMetricPoints}`);
    console.log(`   - Code-Probleme: ${testData.statistics.totalCodeProblems}`);
    console.log(`   - Datengröße: ${Math.round(testData.statistics.dataSize / 1024)}KB\n`);

    // ========================================
    // 2. EINZELNES SZENARIO AUSFÜHREN
    // ========================================
    console.log('🎯 2. Führe einzelnes Testszenario aus...');
    
    const scenarioResult = await plugin.executeTestScenario('memory-leak-scenario');
    
    console.log(`✅ Szenario ausgeführt:`);
    console.log(`   - Execution ID: ${scenarioResult.executionId}`);
    console.log(`   - Erfolgreich: ${scenarioResult.success}`);
    console.log(`   - Dauer: ${scenarioResult.duration}ms`);
    console.log(`   - Erkennungsrate: ${scenarioResult.results.detectionRate.toFixed(1)}%`);
    console.log(`   - Fix-Erfolgsrate: ${scenarioResult.results.fixSuccessRate.toFixed(1)}%\n`);

    // ========================================
    // 3. KOMPLETTES PROFIL AUSFÜHREN
    // ========================================
    console.log('📊 3. Führe komplettes Testprofil aus...');
    
    const profileResults = await plugin.executeFullProfile('performance-test-001');
    
    console.log(`✅ Profil ausgeführt:`);
    console.log(`   - Szenarien gesamt: ${profileResults.length}`);
    console.log(`   - Erfolgreich: ${profileResults.filter(r => r.success).length}`);
    console.log(`   - Fehlgeschlagen: ${profileResults.filter(r => !r.success).length}`);
    
    // Detaillierte Ergebnisse
    profileResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.success ? '✅' : '❌'} ${result.duration}ms - ${result.results.detectionRate.toFixed(1)}% Erkennung`);
    });

    // ========================================
    // 4. TESTDATEN AUS DATEI LADEN
    // ========================================
    console.log('\n📁 4. Lade Testdaten aus Datei...');
    
    try {
      const fileData = await plugin.loadTestDataFromFile('./output/test-data-performance-001.json');
      console.log(`✅ Daten aus Datei geladen:`);
      console.log(`   - Profile ID: ${fileData.profileId}`);
      console.log(`   - Erstellt am: ${fileData.generatedAt}`);
    } catch (error) {
      console.log(`ℹ️  Datei nicht gefunden (das ist normal für das Demo)`);
    }

  } catch (error) {
    console.error('❌ Fehler beim Plugin-Demo:', error.message);
  }
}

// ========================================
// ERWEITERTE NUTZUNG MIT CUSTOM CONFIG
// ========================================
async function advancedPluginUsage() {
  console.log('\n🔧 Erweiterte Plugin-Nutzung\n');

  // Custom Profile Manager
  const profileManager = new TestProfileManager();
  
  // Plugin mit erweiterten Einstellungen
  const plugin = new TestDataLoaderPlugin({
    profileManager,
    outputDirectory: './custom-output',
    enableCaching: false,
    timeout: 60000 // 1 Minute
  });

  try {
    // Mehrere Profile parallel verarbeiten
    const profileIds = ['perf-001', 'security-001', 'ml-training-001'];
    
    console.log('🔄 Verarbeite mehrere Profile parallel...');
    
    const promises = profileIds.map(async (profileId) => {
      try {
        const results = await plugin.executeFullProfile(profileId);
        return { profileId, success: true, scenarios: results.length };
      } catch (error) {
        return { profileId, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    
    console.log('📈 Parallel-Verarbeitung abgeschlossen:');
    results.forEach(result => {
      if (result.success) {
        console.log(`   ✅ ${result.profileId}: ${result.scenarios} Szenarien`);
      } else {
        console.log(`   ❌ ${result.profileId}: ${result.error}`);
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei erweiterter Nutzung:', error.message);
  }
}

// ========================================
// INTEGRATION MIT IMF ADAPTER
// ========================================
async function integrateWithIMFAdapter() {
  console.log('\n🔗 Integration mit IMF Adapter\n');

  const plugin = new TestDataLoaderPlugin();

  try {
    // Testdaten generieren
    const testData = await plugin.loadTestProfile('integration-test-001');
    
    // Hier würde normalerweise der IMF Adapter verwendet werden:
    // const imfAdapter = new IMFIntegrationAdapter({
    //   endpoint: 'http://localhost:3000',
    //   apiKey: 'your-api-key'
    // });
    // 
    // const executionResult = await imfAdapter.executeTestProfile(testData.profileId);
    
    console.log('🔄 Simuliere IMF Integration...');
    console.log(`   - Testdaten vorbereitet für Profile: ${testData.profileId}`);
    console.log(`   - ${testData.data.scenarios.length} Szenarien bereit für IMF`);
    console.log(`   - Datenvolumen: ${Math.round(testData.statistics.dataSize / 1024)}KB`);
    
  } catch (error) {
    console.error('❌ IMF Integration Fehler:', error.message);
  }
}

// Demo ausführen
if (require.main === module) {
  async function runDemo() {
    await demonstratePlugin();
    await advancedPluginUsage();
    await integrateWithIMFAdapter();
    
    console.log('\n🎉 Plugin-Demo abgeschlossen!');
  }

  runDemo().catch(console.error);
}

export { demonstratePlugin, advancedPluginUsage, integrateWithIMFAdapter };
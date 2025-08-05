// ========================================
// IMF TEST MANAGER - API DEMO
// ========================================

// Lade die IMF Test Manager Bibliothek
const { IMFTestManager, createTestManager, Logger } = require('../src/main-index');

async function runApiDemo() {
  console.log('🚀 IMF Test Manager API Demo\n');
  
  try {
    // ========================================
    // 1. TEST MANAGER ERSTELLEN
    // ========================================
    console.log('📋 1. Test Manager initialisieren...');
    
    const testManager = createTestManager({
      logLevel: 'info',
      enableFileLogging: false
    });
    
    console.log('✅ Test Manager erstellt\n');
    
    // ========================================
    // 2. EINFACHES PROFIL ERSTELLEN
    // ========================================
    console.log('🔧 2. Einfaches Testprofil erstellen...');
    
    const profile = await testManager.createSimpleProfile(
      'API Demo Profil',
      './src',
      {
        complexity: 'medium',
        duration: 180,
        errorTypes: ['null_pointer', 'memory_leak', 'api_timeout']
      }
    );
    
    console.log('✅ Profil erstellt:');
    console.log(`   📝 Name: ${profile.name}`);
    console.log(`   🆔 ID: ${profile.id}`);
    console.log(`   📁 Source: ${profile.sourceConfig.directories.join(', ')}`);
    console.log(`   🔧 Komplexität: ${profile.sourceConfig.complexity}`);
    console.log(`   📊 Szenarien: ${profile.scenarios.length}\n`);
    
    // ========================================
    // 3. TESTDATEN GENERIEREN
    // ========================================
    console.log('🔄 3. Testdaten generieren...');
    
    const testData = await testManager.generateTestData(profile.id, './examples/api-demo-output');
    
    console.log('✅ Testdaten generiert:');
    console.log(`   🆔 Profil ID: ${testData.profileId}`);
    console.log(`   🕐 Generiert: ${new Date(testData.generatedAt).toLocaleString()}`);
    console.log(`   ⏱️  Generierungszeit: ${testData.generationDuration}ms`);
    console.log(`   📊 Log-Einträge: ${testData.statistics.totalLogEntries.toLocaleString()}`);
    console.log(`   📈 Metriken: ${testData.statistics.totalMetricPoints.toLocaleString()}`);
    console.log(`   🐛 Code-Probleme: ${testData.statistics.totalCodeProblems.toLocaleString()}\n`);
    
    // ========================================
    // 4. VERSCHIEDENE PROFILTYPEN TESTEN
    // ========================================
    console.log('🎯 4. Verschiedene Profiltypen erstellen...');
    
    const profileTypes = [
      { name: 'Performance Stress Test', complexity: 'complex', duration: 300 },
      { name: 'Security Vulnerability Test', complexity: 'medium', duration: 120 },
      { name: 'Integration Test', complexity: 'simple', duration: 60 }
    ];
    
    const generatedProfiles = [];
    
    for (const config of profileTypes) {
      const testProfile = await testManager.createSimpleProfile(
        config.name,
        './examples',
        {
          complexity: config.complexity,
          duration: config.duration,
          errorTypes: ['logic_error', 'type_mismatch', 'performance_issue']
        }
      );
      
      generatedProfiles.push(testProfile);
      console.log(`   ✅ ${config.name} (${config.complexity}, ${config.duration}s)`);
    }
    
    console.log(`\n📊 ${generatedProfiles.length} Profile erstellt\n`);
    
    // ========================================
    // 5. LOGGER DEMO
    // ========================================
    console.log('📝 5. Logger-Funktionalität demonstrieren...');
    
    const logger = new Logger('API-Demo');
    
    logger.info('Demo-Informationsmeldung', { demo: true, step: 5 });
    logger.warn('Demo-Warnungsmeldung', { warning: 'test' });
    logger.debug('Demo-Debug-Meldung (normalerweise nicht sichtbar)');
    
    // Logger-Level ändern
    Logger.setLevel('debug');
    logger.debug('Jetzt sichtbare Debug-Meldung', { level: 'debug' });
    
    console.log('✅ Logger-Demo abgeschlossen\n');
    
    // ========================================
    // ZUSAMMENFASSUNG
    // ========================================
    console.log('🎉 API Demo erfolgreich abgeschlossen!');
    console.log('\n📋 Zusammenfassung:');
    console.log(`   ✅ Test Manager initialisiert`);
    console.log(`   ✅ ${generatedProfiles.length + 1} Profile erstellt`);
    console.log(`   ✅ 1 Testdaten-Set generiert`);
    console.log(`   ✅ Logger-Funktionalität getestet`);
    console.log(`   ✅ Verschiedene Komplexitätsstufen demonstriert`);
    
  } catch (error) {
    console.error('❌ API Demo Fehler:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Demo automatisch ausführen
if (require.main === module) {
  runApiDemo().catch(console.error);
}

module.exports = { runApiDemo };
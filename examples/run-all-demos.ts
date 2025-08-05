// ========================================
// IMF TEST MANAGER - ALLE DEMOS AUSFÜHREN
// ========================================

const { runCliDemo } = require('./working-cli-demo');
const { runApiDemo } = require('./api-demo');
const { runMLTrainingDemo } = require('./ml-training-demo');

async function runAllDemos() {
  console.log('🎭 IMF Test Manager - Alle Demos ausführen\n');
  console.log('=' .repeat(80));
  
  const startTime = Date.now();
  let successCount = 0;
  let totalDemos = 3;
  
  try {
    // ========================================
    // DEMO 1: CLI WORKFLOW
    // ========================================
    console.log('\n🚀 DEMO 1: CLI Workflow Demo');
    console.log('=' .repeat(40));
    await runCliDemo();
    successCount++;
    console.log('✅ CLI Workflow Demo ERFOLGREICH\n');
    
    // Kurze Pause zwischen Demos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ========================================
    // DEMO 2: API USAGE
    // ========================================
    console.log('\n🔧 DEMO 2: API Usage Demo');  
    console.log('=' .repeat(40));
    await runApiDemo();
    successCount++;
    console.log('✅ API Usage Demo ERFOLGREICH\n');
    
    // Kurze Pause zwischen Demos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ========================================
    // DEMO 3: ML TRAINING
    // ========================================
    console.log('\n🤖 DEMO 3: ML Training Demo');
    console.log('=' .repeat(40));
    await runMLTrainingDemo();
    successCount++;
    console.log('✅ ML Training Demo ERFOLGREICH\n');
    
    // ========================================
    // FINAL RESULTS
    // ========================================
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log('🎉 ALLE DEMOS ERFOLGREICH ABGESCHLOSSEN!');
    console.log('=' .repeat(80));
    console.log(`✅ Erfolgreich: ${successCount}/${totalDemos} Demos`);
    console.log(`⏱️  Gesamtzeit: ${totalTime} Sekunden`);
    console.log(`📊 Erfolgsrate: ${Math.round((successCount / totalDemos) * 100)}%`);
    
    console.log('\n📋 Demo-Zusammenfassung:');
    console.log('   ✅ CLI Workflow - Vollständiger End-to-End Test');
    console.log('   ✅ API Usage - Programmatische Nutzung');
    console.log('   ✅ ML Training - Spezielle ML-Workflows');
    
    console.log('\n📁 Erstellte Workspaces:');
    console.log('   📂 examples/demo-workspace/ - CLI Demo Daten');
    console.log('   📂 examples/ml-training-workspace/ - ML Training Daten');
    console.log('   📄 examples/api-demo-output/ - API Demo Output');
    
    console.log('\n🚀 System Status: PRODUKTIONSBEREIT');
    
  } catch (error) {
    console.error(`\n❌ Demo ${successCount + 1} fehlgeschlagen:`, error.message);
    console.error('\n📊 Demo-Ergebnisse:');
    console.error(`   ✅ Erfolgreich: ${successCount}/${totalDemos}`);
    console.error(`   ❌ Fehlgeschlagen: ${totalDemos - successCount}/${totalDemos}`);
    
    throw error;
  }
}

// Alle Demos ausführen wenn direkt aufgerufen
if (require.main === module) {
  runAllDemos().catch(error => {
    console.error('❌ Kritischer Demo-Fehler:', error.message);
    process.exit(1);
  });
}

module.exports = { runAllDemos };
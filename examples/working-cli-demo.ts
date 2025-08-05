// ========================================
// IMF TEST MANAGER - FUNKTIONIERENDE CLI DEMO
// ========================================

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function runCliDemo() {
  console.log('🚀 IMF Test Manager CLI Demo\n');
  
  const demoDir = path.join(__dirname, 'demo-workspace');
  
  try {
    // Cleanup vorheriger Runs
    if (await fs.pathExists(demoDir)) {
      await fs.remove(demoDir);
    }
    
    console.log('📁 Schritt 1: Workspace initialisieren...');
    const initResult = execSync(`npx tsx src/cli/simple-cli.ts init --dir ${demoDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(initResult);
    
    console.log('🔧 Schritt 2: Performance-Testprofil erstellen...');
    const createResult1 = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Performance Test Demo" --dir ./src --type performance --output ${demoDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(createResult1);
    
    console.log('🔒 Schritt 3: Security-Testprofil erstellen...');
    const createResult2 = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Security Test Demo" --dir ./examples --type security --output ${demoDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(createResult2);
    
    console.log('📋 Schritt 4: Alle Profile auflisten...');
    const listResult = execSync(`npx tsx src/cli/simple-cli.ts list-profiles --dir ${demoDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(listResult);
    
    // Profile IDs extrahieren
    const profileFiles = await fs.readdir(path.join(demoDir, 'profiles'));
    const profileIds = profileFiles.map(f => path.basename(f, '.json'));
    
    console.log('🔄 Schritt 5: Testdaten für alle Profile generieren...');
    for (const profileId of profileIds) {
      console.log(`\n   Generiere Daten für ${profileId}...`);
      const generateResult = execSync(`npx tsx src/cli/simple-cli.ts generate ${profileId} --profiles ${demoDir}/profiles --output ${demoDir}/output`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      console.log(generateResult);
    }
    
    console.log('\n📊 Schritt 6: Generierte Daten analysieren...');
    const outputFiles = await fs.readdir(path.join(demoDir, 'output'));
    
    for (const outputFile of outputFiles) {
      const testData = await fs.readJson(path.join(demoDir, 'output', outputFile));
      console.log(`\n📄 Datei: ${outputFile}`);
      console.log(`   📝 Profil: ${testData.metadata.profile.name}`);
      console.log(`   🕐 Generiert: ${new Date(testData.generatedAt).toLocaleString()}`);
      console.log(`   ⏱️  Dauer: ${testData.generationDuration}ms`);
      console.log(`   📊 Log-Einträge: ${testData.statistics.totalLogEntries.toLocaleString()}`);
      console.log(`   📈 Metriken: ${testData.statistics.totalMetricPoints.toLocaleString()}`);
      console.log(`   🐛 Code-Probleme: ${testData.statistics.totalCodeProblems.toLocaleString()}`);
      console.log(`   💾 Dateigröße: ${Math.round(testData.statistics.dataSize / 1024)} KB`);
    }
    
    console.log('\n✅ Demo erfolgreich abgeschlossen!');
    console.log(`📁 Demo-Workspace: ${demoDir}`);
    console.log(`📊 Profile erstellt: ${profileIds.length}`);
    console.log(`📄 Testdaten-Dateien: ${outputFiles.length}`);
    
  } catch (error) {
    console.error('❌ Demo-Fehler:', error.message);
    throw error;
  }
}

// Demo ausführen wenn direkt aufgerufen
if (require.main === module) {
  runCliDemo().catch(console.error);
}

module.exports = { runCliDemo };
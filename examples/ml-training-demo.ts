// ========================================
// IMF TEST MANAGER - ML TRAINING DEMO
// ========================================

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function runMLTrainingDemo() {
  console.log('🤖 IMF Test Manager - ML Training Demo\n');
  
  const mlDir = path.join(__dirname, 'ml-training-workspace');
  
  try {
    // Cleanup
    if (await fs.pathExists(mlDir)) {
      await fs.remove(mlDir);
    }
    
    console.log('🚀 ML Training Workflow starten...\n');
    
    // ========================================
    // 1. WORKSPACE FÜR ML TRAINING SETUP
    // ========================================
    console.log('📁 1. ML Training Workspace initialisieren...');
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${mlDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log('✅ ML Workspace erstellt\n');
    
    // ========================================
    // 2. VERSCHIEDENE ML TRAINING PROFILE ERSTELLEN
    // ========================================
    console.log('🎯 2. ML Training Profile erstellen...');
    
    const mlProfiles = [
      {
        name: 'ML Training - Performance Issues',
        type: 'performance',
        description: 'Training data for performance bottleneck detection'
      },
      {
        name: 'ML Training - Security Vulnerabilities', 
        type: 'security',
        description: 'Training data for security vulnerability detection'
      },
      {
        name: 'ML Training - Logic Errors',
        type: 'integration',
        description: 'Training data for logic error detection'
      },
      {
        name: 'ML Training - Memory Management',
        type: 'performance', 
        description: 'Training data for memory leak detection'
      }
    ];
    
    const createdProfiles = [];
    
    for (const profile of mlProfiles) {
      console.log(`   🔧 Erstelle: ${profile.name}...`);
      
      const result = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "${profile.name}" --dir ./src --type ${profile.type} --output ${mlDir}/profiles`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      // Profile ID extrahieren
      const profileIdMatch = result.match(/profile-(\d+)\.json/);
      if (profileIdMatch) {
        createdProfiles.push({
          id: `profile-${profileIdMatch[1]}`,
          name: profile.name,
          type: profile.type
        });
      }
      
      console.log(`   ✅ ${profile.name} erstellt`);
    }
    
    console.log(`\n📊 ${createdProfiles.length} ML Training Profile erstellt\n`);
    
    // ========================================
    // 3. TRAINING DATEN FÜR ALLE PROFILE GENERIEREN
    // ========================================
    console.log('🔄 3. ML Training Daten generieren...');
    
    const trainingDataSets = [];
    
    for (const profile of createdProfiles) {
      console.log(`   📊 Generiere Training Data für: ${profile.name}...`);
      
      const result = execSync(`npx tsx src/cli/simple-cli.ts generate ${profile.id} --profiles ${mlDir}/profiles --output ${mlDir}/training-data`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      // Extrahiere Statistiken aus dem Output
      const logEntriesMatch = result.match(/Log entries: (\d+)/);
      const metricPointsMatch = result.match(/Metric points: (\d+)/);
      const codeProblemsMatch = result.match(/Code problems: (\d+)/);
      
      trainingDataSets.push({
        profileId: profile.id,
        profileName: profile.name,
        profileType: profile.type,
        logEntries: logEntriesMatch ? parseInt(logEntriesMatch[1]) : 0,
        metricPoints: metricPointsMatch ? parseInt(metricPointsMatch[1]) : 0,
        codeProblems: codeProblemsMatch ? parseInt(codeProblemsMatch[1]) : 0
      });
      
      console.log(`   ✅ Training Data für ${profile.name} generiert`);
    }
    
    console.log(`\n📈 ${trainingDataSets.length} Training Datasets erstellt\n`);
    
    // ========================================
    // 4. TRAINING DATEN ANALYSE
    // ========================================
    console.log('📊 4. ML Training Daten analysieren...');
    
    let totalLogEntries = 0;
    let totalMetricPoints = 0;
    let totalCodeProblems = 0;
    
    console.log('\n📋 Training Dataset Übersicht:');
    console.log('='.repeat(80));
    
    for (const dataset of trainingDataSets) {
      console.log(`📊 ${dataset.profileName}`);
      console.log(`   Typ: ${dataset.profileType}`);
      console.log(`   Log-Einträge: ${dataset.logEntries.toLocaleString()}`);
      console.log(`   Metriken: ${dataset.metricPoints.toLocaleString()}`);
      console.log(`   Code-Probleme: ${dataset.codeProblems.toLocaleString()}`);
      console.log(`   Profile ID: ${dataset.profileId}`);
      console.log('');
      
      totalLogEntries += dataset.logEntries;
      totalMetricPoints += dataset.metricPoints;
      totalCodeProblems += dataset.codeProblems;
    }
    
    // ========================================
    // 5. ZUSAMMENFASSUNG DER ML TRAINING DATEN
    // ========================================
    console.log('🎯 5. ML Training Zusammenfassung:');
    console.log('=' .repeat(80));
    console.log(`📊 Gesamt Log-Einträge: ${totalLogEntries.toLocaleString()}`);
    console.log(`📈 Gesamt Metrik-Punkte: ${totalMetricPoints.toLocaleString()}`);
    console.log(`🐛 Gesamt Code-Probleme: ${totalCodeProblems.toLocaleString()}`);
    console.log(`📄 Profile: ${createdProfiles.length}`);
    console.log(`💾 Training Datasets: ${trainingDataSets.length}`);
    
    // Dateisystem-Analyse
    const trainingDataFiles = await fs.readdir(path.join(mlDir, 'training-data'));
    let totalFileSize = 0;
    
    for (const file of trainingDataFiles) {
      const stats = await fs.stat(path.join(mlDir, 'training-data', file));
      totalFileSize += stats.size;
    }
    
    console.log(`💾 Gesamt Dateigröße: ${Math.round(totalFileSize / (1024 * 1024))} MB`);
    console.log(`📁 Training Workspace: ${mlDir}`);
    
    // ========================================
    // 6. ML TRAINING EMPFEHLUNGEN
    // ========================================
    console.log('\n🤖 ML Training Empfehlungen:');
    console.log('=' .repeat(80));
    console.log('🎯 Diese Daten eignen sich für:');
    console.log('   • Supervised Learning für Code-Problem-Erkennung');
    console.log('   • Pattern Recognition in Log-Daten');
    console.log('   • Anomalie-Erkennung in Metriken');
    console.log('   • Multi-Class-Classification von Error-Types');
    console.log('   • Time-Series-Analysis von Performance-Daten');
    
    console.log('\n📊 Recommended ML Models:');
    console.log('   • Random Forest für Error-Classification');
    console.log('   • LSTM Networks für Time-Series-Prediction');
    console.log('   • Gradient Boosting für Performance-Anomalies');
    console.log('   • Neural Networks für Pattern Recognition');
    
    console.log('\n✅ ML Training Demo erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('❌ ML Demo Fehler:', error.message);
    throw error;
  }
}

// Demo ausführen
if (require.main === module) {
  runMLTrainingDemo().catch(console.error);
}

module.exports = { runMLTrainingDemo };
# IMF Test Manager

Ein spezialisiertes Tool zur Generierung von Testdaten für das Intelligent Monitoring Framework (IMF).

## 🎯 Zweck

Der IMF Test Manager erstellt strukturierte Testprofile und generiert realistische Testdaten für:
- **ML-Model Training**: Verschiedene Code-Problem-Szenarien
- **Performance Testing**: CPU/Memory/Network-Belastungsszenarien  
- **Log-Analyse**: Fehlerhafte und normale Log-Patterns
- **Integration Testing**: Multi-System-Szenarien

## 🚀 Installation

```bash
npm install
npm run build
npm link  # Für globale CLI-Nutzung
```

## 💻 CLI-Nutzung

```bash
# Neues Testprofil erstellen
imf-test-manager create-profile "API Performance" /app/api-server medium

# Testdaten generieren
imf-test-manager generate-data profile-123

# Vollständigen Test mit IMF ausführen
imf-test-manager execute-test profile-123 http://localhost:3000

# Profile auflisten
imf-test-manager list-profiles
```

## 📊 Testprofil-Struktur

```json
{
  "id": "profile-performance-001",
  "name": "API Performance Test",
  "sourceConfig": {
    "directories": ["/app/api-server"],
    "languages": ["typescript", "javascript"],
    "complexity": "medium"
  },
  "scenarios": [
    {
      "name": "Memory Leak Detection",
      "type": "performance",
      "duration": 300,
      "problemTypes": ["memory_leak", "cpu_spike"]
    }
  ],
  "expectations": {
    "detectionRate": 85,
    "fixSuccessRate": 70,
    "mlAccuracy": 80
  }
}
```

## 🔧 Programmierung-Interface

```typescript
import { TestProfileManager, IMFAdapter } from 'imf-test-manager';

const manager = new TestProfileManager();
const profile = await manager.createProfile({
  name: 'Custom Test',
  sourceConfig: { directories: ['/my/source'] }
});

const testData = await manager.generateTestData(profile);
const imfAdapter = new IMFAdapter('http://localhost:3000');
const results = await imfAdapter.executeTest(profile.id);
```

## 📁 Projekt-Struktur

```
src/
├── core/           # Kern-Funktionalitäten
├── generators/     # Daten-Generatoren
├── adapters/       # IMF-Integration
├── cli/           # Command-Line Interface
└── types/         # TypeScript-Definitionen

profiles/          # Gespeicherte Testprofile
output/           # Generierte Testdaten
tests/            # Unit Tests
```

## 🧪 Entwicklung

```bash
npm run dev        # Development Server
npm test          # Unit Tests
npm run build     # Production Build
npm run lint      # Code-Linting
```

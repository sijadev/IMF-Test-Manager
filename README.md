# MCP.Guard-Testmanager

Ein spezialisiertes Tool zur Generierung von Testdaten für das System MCP.Guard.

## 🎯 Zweck

Der MCP.Guard-Testmanager erstellt strukturierte Testprofile und generiert realistische Testdaten für:
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
MCP.Guard-Testmanager create-profile "API Performance" /app/api-server medium

# Testdaten generieren
MCP.Guard-Testmanager generate-data profile-123

# Vollständigen Test mit MCP.Guard ausführen
MCP.Guard-Testmanager execute-test profile-123 http://localhost:3000

# Profile auflisten
MCP.Guard-Testmanager list-profiles
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
import { TestProfileManager, MCP.GuardAdapter } from 'MCP.Guard-Testmanager';

const manager = new TestProfileManager();
const profile = await manager.createProfile({
  name: 'Custom Test',
  sourceConfig: { directories: ['/my/source'] }
});

const testData = await manager.generateTestData(profile);
const MCP.GuardAdapter = new MCP.GuardAdapter('http://localhost:3000');
const results = await MCP.GuardAdapter.executeTest(profile.id);
```

## 📁 Projekt-Struktur

```
src/
├── core/           # Kern-Funktionalitäten
├── generators/     # Daten-Generatoren
├── adapters/       # MCP.Guard-Integration
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

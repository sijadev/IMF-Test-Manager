# IMF Test Manager - Working CLI

## Overview
The IMF Test Manager CLI is now functional and can be used to generate test data for ML training.

## Installation & Setup

```bash
# Install dependencies
npm install

# Run CLI commands
npm run cli -- <command>
```

## Available Commands

### 1. Initialize Workspace
```bash
npm run cli -- init [--dir <directory>]
```
Creates a new workspace with the required directory structure.

Example:
```bash
npm run cli -- init --dir my-workspace
```

### 2. Create Test Profile
```bash
npm run cli -- create-profile [options]
```

Options:
- `--name <name>` - Profile name
- `--dir <directory>` - Source directory to test
- `--type <type>` - Profile type (default: performance)
- `--output <directory>` - Profiles directory (default: ./profiles)

Example:
```bash
npm run cli -- create-profile --name "My Test" --dir ./src --output ./my-workspace/profiles
```

### 3. List Profiles
```bash
npm run cli -- list-profiles [--dir <directory>]
```

Example:
```bash
npm run cli -- list-profiles --dir ./my-workspace/profiles
```

### 4. Generate Test Data
```bash
npm run cli -- generate <profile-id> [options]
```

Options:
- `--output <directory>` - Output directory (default: ./output)
- `--profiles <directory>` - Profiles directory (default: ./profiles)

Example:
```bash
npm run cli -- generate profile-123456789 --profiles ./my-workspace/profiles --output ./my-workspace/output
```

### 5. Help
```bash
npm run cli -- help
```

## Example Workflow

1. **Initialize workspace:**
   ```bash
   npm run cli -- init --dir test-workspace
   ```

2. **Create a test profile:**
   ```bash
   npm run cli -- create-profile --name "Performance Test" --dir ./src --output ./test-workspace/profiles
   ```

3. **List profiles to get the ID:**
   ```bash
   npm run cli -- list-profiles --dir ./test-workspace/profiles
   ```

4. **Generate test data:**
   ```bash
   npm run cli -- generate <profile-id> --profiles ./test-workspace/profiles --output ./test-workspace/output
   ```

## Generated Files

### Profile Structure
Each profile contains:
- Source configuration (directories, languages, complexity)
- Test scenarios with problem types and injection settings
- Expected outcomes (detection rates, accuracy metrics)
- Generation rules (sample counts, error distribution)

### Test Data Structure
Generated test data includes:
- Simulated log entries
- Metric data points
- Code problems for ML training
- Execution statistics and metadata

## Features

✅ **Working Components:**
- Full CLI interface with Commander.js
- Workspace initialization
- Profile creation and management
- Test data generation simulation
- JSON-based configuration
- Colored console output

✅ **Test Results:**
- All CLI commands execute successfully
- Proper error handling and validation
- File I/O operations work correctly
- Generated profiles and test data are valid JSON

## Technical Notes

- Built with TypeScript and CommonJS modules
- Uses tsx for direct TypeScript execution
- Dependencies: commander, chalk, fs-extra
- No complex generators needed - focuses on core functionality
- Clean separation between CLI and library code

The CLI is fully functional and ready for use in generating test data for IMF ML training scenarios.
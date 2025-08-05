#!/usr/bin/env node

// ========================================
// IMF TEST MANAGER - SIMPLIFIED CLI
// ========================================

const { Command } = require('commander');
const chalk = require('chalk').default || require('chalk');
const fs = require('fs-extra');
const path = require('path');

const program = new Command();

// ========================================
// BASIC COMMAND STRUCTURE
// ========================================

program
  .name('imf-test-manager')
  .description('IMF Test Manager - Generate test data for ML training')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize a new workspace')
  .option('-d, --dir <directory>', 'workspace directory', './imf-workspace')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Initializing IMF Test Manager workspace...'));
    
    try {
      const workspaceDir = path.resolve(options.dir);
      
      // Create directory structure
      await fs.ensureDir(path.join(workspaceDir, 'profiles'));
      await fs.ensureDir(path.join(workspaceDir, 'output'));
      await fs.ensureDir(path.join(workspaceDir, 'logs'));
      
      // Create config file
      const config = {
        version: '1.0.0',
        created: new Date().toISOString(),
        profilesDir: './profiles',
        outputDir: './output',
        logsDir: './logs'
      };
      
      await fs.writeJson(path.join(workspaceDir, 'imf-config.json'), config, { spaces: 2 });
      
      console.log(chalk.green('✅ Workspace initialized successfully!'));
      console.log(chalk.cyan(`📁 Workspace: ${workspaceDir}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize workspace:'), error.message);
      process.exit(1);
    }
  });

// List profiles command
program
  .command('list-profiles')
  .description('List all test profiles')
  .option('-d, --dir <directory>', 'profiles directory', './profiles')
  .action(async (options) => {
    console.log(chalk.blue('📋 Listing test profiles...'));
    
    try {
      const profilesDir = path.resolve(options.dir);
      
      if (!await fs.pathExists(profilesDir)) {
        console.log(chalk.yellow('⚠️  No profiles directory found. Run "init" first.'));
        return;
      }
      
      const files = await fs.readdir(profilesDir);
      const profileFiles = files.filter(f => f.endsWith('.json'));
      
      if (profileFiles.length === 0) {
        console.log(chalk.yellow('📭 No profiles found.'));
        return;
      }
      
      console.log(chalk.green(`\n📊 Found ${profileFiles.length} profile(s):`));
      
      for (const file of profileFiles) {
        const profilePath = path.join(profilesDir, file);
        try {
          const profile = await fs.readJson(profilePath);
          console.log(chalk.cyan(`  • ${profile.name || file} (${profile.id || 'no-id'})`));
          console.log(chalk.gray(`    Created: ${profile.createdAt || 'unknown'}`));
          console.log(chalk.gray(`    Scenarios: ${profile.scenarios?.length || 0}`));
        } catch (err) {
          console.log(chalk.red(`  • ${file} (invalid JSON)`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list profiles:'), error.message);
      process.exit(1);
    }
  });

// Create profile command
program
  .command('create-profile')
  .description('Create a new test profile')
  .option('-n, --name <name>', 'profile name')
  .option('-d, --dir <directory>', 'source directory to test')
  .option('-t, --type <type>', 'profile type', 'performance')
  .option('--output <directory>', 'profiles directory', './profiles')
  .action(async (options) => {
    console.log(chalk.blue('🔧 Creating new test profile...'));
    
    const profileName = options.name || `test-profile-${Date.now()}`;
    const sourceDir = options.dir || './src';
    const profileType = options.type || 'performance';
    
    const profile = {
      id: `profile-${Date.now()}`,
      name: profileName,
      version: '1.0.0',
      description: `Generated test profile for ${sourceDir}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      sourceConfig: {
        directories: [sourceDir],
        languages: ['typescript', 'javascript'],
        complexity: 'medium',
        excludePatterns: ['node_modules', 'dist', '*.log']
      },
      
      scenarios: [
        {
          id: 'main-scenario',
          name: 'Main Test Scenario',
          type: profileType,
          duration: 300,
          enabled: true,
          problemTypes: ['null_pointer', 'memory_leak', 'api_timeout'],
          codeInjection: {
            errorTypes: ['null_pointer', 'memory_leak', 'api_timeout'],
            frequency: 0.1,
            complexity: 'medium'
          },
          metrics: {
            cpuPattern: 'stable',
            memoryPattern: 'stable',
            logPattern: 'normal'
          }
        }
      ],
      
      expectations: {
        detectionRate: 85,
        fixSuccessRate: 70,
        falsePositiveRate: 15,
        mlAccuracy: 80
      },
      
      generationRules: {
        sampleCount: 1000,
        varianceLevel: 'medium',
        timespan: '1h',
        errorDistribution: {
          'null_pointer': 0.25,
          'memory_leak': 0.2,
          'api_timeout': 0.15,
          'logic_error': 0.4
        }
      }
    };
    
    try {
      const profilesDir = path.resolve(options.output);
      await fs.ensureDir(profilesDir);
      
      const profilePath = path.join(profilesDir, `${profile.id}.json`);
      await fs.writeJson(profilePath, profile, { spaces: 2 });
      
      console.log(chalk.green('✅ Profile created successfully!'));
      console.log(chalk.cyan(`📄 Profile: ${profile.name}`));
      console.log(chalk.cyan(`📁 File: ${profilePath}`));
      console.log(chalk.cyan(`🎯 Source: ${sourceDir}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to create profile:'), error.message);
      process.exit(1);
    }
  });

// Generate test data command
program
  .command('generate')
  .description('Generate test data from a profile')
  .argument('<profile-id>', 'profile ID to use')
  .option('-o, --output <directory>', 'output directory', './output')
  .option('--profiles <directory>', 'profiles directory', './profiles')
  .action(async (profileId, options) => {
    console.log(chalk.blue(`🔄 Generating test data from profile: ${profileId}...`));
    
    try {
      const profilesDir = path.resolve(options.profiles);
      const profilePath = path.join(profilesDir, `${profileId}.json`);
      
      if (!await fs.pathExists(profilePath)) {
        console.error(chalk.red(`❌ Profile not found: ${profileId}`));
        process.exit(1);
      }
      
      const profile = await fs.readJson(profilePath);
      console.log(chalk.cyan(`📊 Loaded profile: ${profile.name}`));
      
      // Simulate test data generation
      const testData = {
        profileId: profile.id,
        generatedAt: new Date().toISOString(),
        generationDuration: Math.floor(Math.random() * 5000) + 1000,
        
        data: {
          logFiles: [],
          metricStreams: [],
          codeProblems: [],
          scenarios: profile.scenarios.map(scenario => ({
            scenarioId: scenario.id,
            name: scenario.name,
            executedAt: new Date().toISOString(),
            duration: scenario.duration * 1000,
            statistics: {
              problemsInjected: Math.floor(Math.random() * 50) + 10,
              metricsGenerated: Math.floor(Math.random() * 1000) + 100,
              logsGenerated: Math.floor(Math.random() * 5000) + 500,
              successRate: Math.random() * 0.3 + 0.7
            }
          }))
        },
        
        statistics: {
          totalLogEntries: Math.floor(Math.random() * 10000) + 1000,
          totalMetricPoints: Math.floor(Math.random() * 5000) + 500,
          totalCodeProblems: Math.floor(Math.random() * 100) + 10,
          dataSize: Math.floor(Math.random() * 1000000) + 100000
        },
        
        metadata: {
          generatorVersion: '1.0.0',
          profile: profile,
          outputPath: options.output,
          totalSamples: profile.generationRules.sampleCount
        }
      };
      
      const outputDir = path.resolve(options.output);
      await fs.ensureDir(outputDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = path.join(outputDir, `testdata-${profileId}-${timestamp}.json`);
      
      await fs.writeJson(outputFile, testData, { spaces: 2 });
      
      console.log(chalk.green('✅ Test data generated successfully!'));
      console.log(chalk.cyan(`📄 Output: ${outputFile}`));
      console.log(chalk.cyan(`📊 Log entries: ${testData.statistics.totalLogEntries}`));
      console.log(chalk.cyan(`📈 Metric points: ${testData.statistics.totalMetricPoints}`));
      console.log(chalk.cyan(`🐛 Code problems: ${testData.statistics.totalCodeProblems}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate test data:'), error.message);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(chalk.blue('\n🚀 IMF Test Manager - Help\n'));
    console.log(chalk.cyan('Available commands:'));
    console.log(chalk.white('  init              Initialize a new workspace'));
    console.log(chalk.white('  create-profile    Create a new test profile'));
    console.log(chalk.white('  list-profiles     List all test profiles'));
    console.log(chalk.white('  generate          Generate test data from a profile'));
    console.log(chalk.white('  help              Show this help'));
    
    console.log(chalk.cyan('\nExamples:'));
    console.log(chalk.gray('  imf-test-manager init'));
    console.log(chalk.gray('  imf-test-manager create-profile --name "My Test" --dir ./src'));
    console.log(chalk.gray('  imf-test-manager list-profiles'));
    console.log(chalk.gray('  imf-test-manager generate profile-123456789'));
  });

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('❌ CLI Error:'), error.message);
    process.exit(1);
  }
}

// Execute if run directly  
if (require.main === module) {
  main();
}

module.exports = { program, main };
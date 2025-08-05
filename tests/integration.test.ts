// ========================================
// INTEGRATION TESTS FOR WORKING COMPONENTS
// ========================================

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

describe('IMF Test Manager Integration', () => {
  const testDir = path.join(__dirname, 'integration-test-workspace');
  
  beforeEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  test('Complete workflow: init -> create -> list -> generate', async () => {
    // Step 1: Initialize workspace
    const initResult = execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(initResult).toContain('Workspace initialized successfully');
    expect(await fs.pathExists(testDir)).toBe(true);
    
    // Step 2: Create a test profile
    const createResult = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Integration Test Profile" --dir ./src --type performance --output ${testDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(createResult).toContain('Profile created successfully');
    
    // Extract profile ID
    const profileIdMatch = createResult.match(/profile-(\d+)\.json/);
    expect(profileIdMatch).toBeTruthy();
    const profileId = `profile-${profileIdMatch[1]}`;
    
    // Step 3: List profiles to verify
    const listResult = execSync(`npx tsx src/cli/simple-cli.ts list-profiles --dir ${testDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(listResult).toContain('Found 1 profile(s)');
    expect(listResult).toContain('Integration Test Profile');
    
    // Step 4: Generate test data
    const generateResult = execSync(`npx tsx src/cli/simple-cli.ts generate ${profileId} --profiles ${testDir}/profiles --output ${testDir}/output`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(generateResult).toContain('Test data generated successfully');
    expect(generateResult).toContain('Log entries:');
    expect(generateResult).toContain('Metric points:');
    expect(generateResult).toContain('Code problems:');
    
    // Step 5: Verify generated files
    const outputFiles = await fs.readdir(path.join(testDir, 'output'));
    expect(outputFiles.length).toBe(1);
    
    const outputFile = outputFiles[0];
    const testData = await fs.readJson(path.join(testDir, 'output', outputFile));
    
    // Verify test data structure
    expect(testData.profileId).toBe(profileId);
    expect(testData.generatedAt).toBeDefined();
    expect(testData.generationDuration).toBeGreaterThan(0);
    expect(testData.data.scenarios).toHaveLength(1);
    expect(testData.statistics.totalLogEntries).toBeGreaterThan(0);
    expect(testData.statistics.totalMetricPoints).toBeGreaterThan(0);
    expect(testData.statistics.totalCodeProblems).toBeGreaterThan(0);
    expect(testData.metadata.profile.name).toBe('Integration Test Profile');
  });

  test('Error handling: generate with non-existent profile', () => {
    expect(() => {
      execSync(`npx tsx src/cli/simple-cli.ts generate non-existent-profile --profiles ${testDir}/profiles --output ${testDir}/output`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
    }).toThrow();
  });

  test('Error handling: list profiles from non-existent directory', async () => {
    const result = execSync(`npx tsx src/cli/simple-cli.ts list-profiles --dir ${testDir}/non-existent`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(result).toContain('No profiles directory found');
  });

  test('Multiple profiles workflow', async () => {
    // Initialize workspace
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // Create multiple profiles
    const profiles = [
      { name: 'Performance Test', type: 'performance' },
      { name: 'Security Test', type: 'security' },
      { name: 'Integration Test', type: 'integration' }
    ];
    
    const profileIds = [];
    
    for (const profile of profiles) {
      const result = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "${profile.name}" --dir ./src --type ${profile.type} --output ${testDir}/profiles`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      const profileIdMatch = result.match(/profile-(\d+)\.json/);
      profileIds.push(`profile-${profileIdMatch[1]}`);
    }
    
    // List all profiles
    const listResult = execSync(`npx tsx src/cli/simple-cli.ts list-profiles --dir ${testDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(listResult).toContain('Found 3 profile(s)');
    expect(listResult).toContain('Performance Test');
    expect(listResult).toContain('Security Test');
    expect(listResult).toContain('Integration Test');
    
    // Generate data for each profile
    for (const profileId of profileIds) {
      const generateResult = execSync(`npx tsx src/cli/simple-cli.ts generate ${profileId} --profiles ${testDir}/profiles --output ${testDir}/output`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      expect(generateResult).toContain('Test data generated successfully');
    }
    
    // Verify all output files were created
    const outputFiles = await fs.readdir(path.join(testDir, 'output'));
    expect(outputFiles.length).toBe(3);
  });
});
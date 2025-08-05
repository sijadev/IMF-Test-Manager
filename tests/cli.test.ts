// ========================================
// CLI FUNCTIONALITY TESTS
// ========================================

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

describe('CLI Functionality', () => {
  const testWorkspaceDir = path.join(__dirname, '..', 'test-cli-workspace');
  
  beforeEach(async () => {
    // Clean up any existing test workspace
    if (await fs.pathExists(testWorkspaceDir)) {
      await fs.remove(testWorkspaceDir);
    }
  });

  afterEach(async () => {
    // Clean up test workspace
    if (await fs.pathExists(testWorkspaceDir)) {
      await fs.remove(testWorkspaceDir);
    }
  });

  test('CLI help command should work', () => {
    const result = execSync('npx tsx src/cli/simple-cli.ts --help', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(result).toContain('IMF Test Manager');
    expect(result).toContain('init');
    expect(result).toContain('create-profile');
    expect(result).toContain('list-profiles');
    expect(result).toContain('generate');
  });

  test('CLI init command should create workspace', async () => {
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testWorkspaceDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // Check if workspace structure was created
    expect(await fs.pathExists(testWorkspaceDir)).toBe(true);
    expect(await fs.pathExists(path.join(testWorkspaceDir, 'profiles'))).toBe(true);
    expect(await fs.pathExists(path.join(testWorkspaceDir, 'output'))).toBe(true);
    expect(await fs.pathExists(path.join(testWorkspaceDir, 'logs'))).toBe(true);
    expect(await fs.pathExists(path.join(testWorkspaceDir, 'imf-config.json'))).toBe(true);
    
    // Check config file content
    const config = await fs.readJson(path.join(testWorkspaceDir, 'imf-config.json'));
    expect(config.version).toBe('1.0.0');
    expect(config.profilesDir).toBe('./profiles');
  });

  test('CLI create-profile command should create valid profile', async () => {
    // First init workspace
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testWorkspaceDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // Create profile
    const result = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Test Profile" --dir ./src --output ${testWorkspaceDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(result).toContain('Profile created successfully');
    
    // Check if profile file was created
    const profileFiles = await fs.readdir(path.join(testWorkspaceDir, 'profiles'));
    expect(profileFiles.length).toBe(1);
    
    const profileFile = profileFiles[0];
    expect(profileFile).toMatch(/^profile-\d+\.json$/);
    
    // Check profile content
    const profile = await fs.readJson(path.join(testWorkspaceDir, 'profiles', profileFile));
    expect(profile.name).toBe('Test Profile');
    expect(profile.sourceConfig.directories).toContain('./src');
    expect(profile.scenarios).toHaveLength(1);
    expect(profile.expectations.detectionRate).toBe(85);
  });

  test('CLI list-profiles command should list profiles', async () => {
    // First init workspace and create a profile
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testWorkspaceDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Test Profile" --dir ./src --output ${testWorkspaceDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // List profiles
    const result = execSync(`npx tsx src/cli/simple-cli.ts list-profiles --dir ${testWorkspaceDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(result).toContain('Found 1 profile(s)');
    expect(result).toContain('Test Profile');
    expect(result).toContain('Scenarios: 1');
  });

  test('CLI generate command should create test data', async () => {
    // Setup workspace and profile
    execSync(`npx tsx src/cli/simple-cli.ts init --dir ${testWorkspaceDir}`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const createResult = execSync(`npx tsx src/cli/simple-cli.ts create-profile --name "Test Profile" --dir ./src --output ${testWorkspaceDir}/profiles`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // Extract profile ID from create result
    const profileIdMatch = createResult.match(/profile-(\d+)\.json/);
    expect(profileIdMatch).toBeTruthy();
    const profileId = `profile-${profileIdMatch[1]}`;
    
    // Generate test data
    const generateResult = execSync(`npx tsx src/cli/simple-cli.ts generate ${profileId} --profiles ${testWorkspaceDir}/profiles --output ${testWorkspaceDir}/output`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    expect(generateResult).toContain('Test data generated successfully');
    expect(generateResult).toContain('Log entries:');
    expect(generateResult).toContain('Metric points:');
    expect(generateResult).toContain('Code problems:');
    
    // Check if output file was created
    const outputFiles = await fs.readdir(path.join(testWorkspaceDir, 'output'));
    expect(outputFiles.length).toBe(1);
    
    const outputFile = outputFiles[0];
    expect(outputFile).toMatch(/^testdata-profile-\d+-.*\.json$/);
    
    // Check output content
    const testData = await fs.readJson(path.join(testWorkspaceDir, 'output', outputFile));
    expect(testData.profileId).toBe(profileId);
    expect(testData.statistics.totalLogEntries).toBeGreaterThan(0);
    expect(testData.statistics.totalMetricPoints).toBeGreaterThan(0);
    expect(testData.statistics.totalCodeProblems).toBeGreaterThan(0);
  });
});
// ========================================
// CODE PROBLEM GENERATOR
// ========================================

import * as fs from 'fs-extra';
import * as path from 'path';
import { 
  CodeProblem, 
  CodeGenerationConfig, 
  ComplexityLevel,
  GenerationError 
} from '@/types';
import { Logger } from '@/utils/logger';

interface ProblemTemplate {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  problemCode: string;
  fixedCode?: string;
  complexity: ComplexityLevel;
  languages: string[];
  fixable: boolean;
}

export class CodeProblemGenerator {
  private logger: Logger;
  private problemTemplates: Map<string, ProblemTemplate[]>;
  private fileTemplates: Map<string, string[]>;
  
  constructor() {
    this.logger = new Logger('CodeGenerator');
    this.initializeTemplates();
  }
  
  // ========================================
  // PUBLIC API
  // ========================================
  
  async generate(config: CodeGenerationConfig): Promise<CodeProblem[]> {
    this.logger.info('Generating code problems', {
      errorTypes: config.errorTypes,
      complexity: config.complexity,
      count: config.count
    });
    
    try {
      const problems: CodeProblem[] = [];
      
      for (let i = 0; i < config.count; i++) {
        const errorType = this.selectRandomErrorType(config.errorTypes);
        const problem = await this.generateProblem(errorType, config, i);
        
        if (problem) {
          problems.push(problem);
        }
      }
      
      this.logger.info('Code problem generation completed', {
        generated: problems.length,
        requested: config.count,
        errorTypes: [...new Set(problems.map(p => p.type))]
      });
      
      return problems;
      
    } catch (error) {
      this.logger.error('Code problem generation failed', { error });
      throw new GenerationError(`Code problem generation failed: ${error.message}`);
    }
  }
  
  async generateForFiles(
    targetFiles: string[], 
    errorTypes: string[], 
    complexity: ComplexityLevel = 'medium'
  ): Promise<CodeProblem[]> {
    this.logger.info('Generating problems for specific files', {
      files: targetFiles.length,
      errorTypes
    });
    
    const problems: CodeProblem[] = [];
    
    for (const file of targetFiles) {
      try {
        if (await fs.pathExists(file)) {
          const fileContent = await fs.readFile(file, 'utf8');
          const language = this.detectLanguage(file);
          
          const fileProblems = await this.generateProblemsForFile(
            file,
            fileContent,
            language,
            errorTypes,
            complexity
          );
          
          problems.push(...fileProblems);
        }
      } catch (error) {
        this.logger.warn('Failed to process file', { file, error: error.message });
      }
    }
    
    return problems;
  }
  
  // ========================================
  // PROBLEM GENERATION
  // ========================================
  
  private async generateProblem(
    errorType: string, 
    config: CodeGenerationConfig, 
    index: number
  ): Promise<CodeProblem | null> {
    const templates = this.problemTemplates.get(errorType);
    if (!templates || templates.length === 0) {
      this.logger.warn('No templates found for error type', { errorType });
      return null;
    }
    
    // Filter templates by complexity
    const appropriateTemplates = templates.filter(t => 
      t.complexity === config.complexity || config.complexity === 'medium'
    );
    
    if (appropriateTemplates.length === 0) {
      this.logger.warn('No templates for complexity level', { 
        errorType, 
        complexity: config.complexity 
      });
      return null;
    }
    
    const template = appropriateTemplates[Math.floor(Math.random() * appropriateTemplates.length)];
    const targetFile = this.selectTargetFile(config.targetFiles, template.languages);
    
    const problem: CodeProblem = {
      id: `problem-${Date.now()}-${index}`,
      type: errorType,
      severity: template.severity,
      file: targetFile,
      line: Math.floor(Math.random() * 200) + 1,
      column: Math.floor(Math.random() * 80) + 1,
      message: this.fillTemplate(template.description, {
        file: path.basename(targetFile),
        line: Math.floor(Math.random() * 200) + 1,
        function: this.generateFunctionName(),
        variable: this.generateVariableName(),
        type: this.generateTypeName()
      }),
      
      problematicCode: this.fillCodeTemplate(template.problemCode),
      suggestedFix: template.fixedCode ? this.fillCodeTemplate(template.fixedCode) : undefined,
      
      metadata: {
        generated: true,
        scenarioId: 'code-generation',
        complexity: config.complexity,
        fixable: template.fixable && config.fixable
      }
    };
    
    return problem;
  }
  
  private async generateProblemsForFile(
    filePath: string,
    content: string,
    language: string,
    errorTypes: string[],
    complexity: ComplexityLevel
  ): Promise<CodeProblem[]> {
    const problems: CodeProblem[] = [];
    const lines = content.split('\n');
    
    // Analyze file for potential problem locations
    const problematicLines = this.findProblematicLines(lines, language);
    
    for (const errorType of errorTypes) {
      const templates = this.problemTemplates.get(errorType)?.filter(t => 
        t.languages.includes(language) && 
        (t.complexity === complexity || complexity === 'medium')
      );
      
      if (!templates || templates.length === 0) continue;
      
      const template = templates[Math.floor(Math.random() * templates.length)];
      const lineIndex = problematicLines.length > 0 
        ? problematicLines[Math.floor(Math.random() * problematicLines.length)]
        : Math.floor(Math.random() * lines.length);
      
      const problem: CodeProblem = {
        id: `file-problem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: errorType,
        severity: template.severity,
        file: filePath,
        line: lineIndex + 1,
        column: Math.floor(Math.random() * 80) + 1,
        message: template.description,
        
        originalCode: lines[lineIndex]?.trim() || '',
        problematicCode: this.adaptCodeToContext(template.problemCode, lines[lineIndex], language),
        suggestedFix: template.fixedCode ? this.adaptCodeToContext(template.fixedCode, lines[lineIndex], language) : undefined,
        
        metadata: {
          generated: true,
          scenarioId: 'file-analysis',
          complexity,
          fixable: template.fixable
        }
      };
      
      problems.push(problem);
    }
    
    return problems;
  }
  
  // ========================================
  // TEMPLATE HELPERS
  // ========================================
  
  private fillTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value.toString());
    });
    
    return result;
  }
  
  private fillCodeTemplate(template: string): string {
    const variables = {
      variable: this.generateVariableName(),
      function: this.generateFunctionName(),
      class: this.generateClassName(),
      property: this.generatePropertyName(),
      type: this.generateTypeName(),
      value: this.generateValue(),
      url: this.generateUrl(),
      timeout: Math.floor(Math.random() * 5000) + 1000,
      port: Math.floor(Math.random() * 65535) + 1024
    };
    
    return this.fillTemplate(template, variables);
  }
  
  private adaptCodeToContext(code: string, contextLine: string, language: string): string {
    // Try to adapt the generated code to match the context of the original line
    if (!contextLine) return code;
    
    // Extract variables/functions from context
    const contextVars = this.extractVariablesFromLine(contextLine, language);
    if (contextVars.length > 0) {
      const contextVar = contextVars[Math.floor(Math.random() * contextVars.length)];
      code = code.replace(/\{variable\}/g, contextVar);
    }
    
    return code;
  }
  
  // ========================================
  // ANALYSIS HELPERS
  // ========================================
  
  private findProblematicLines(lines: string[], language: string): number[] {
    const problematicLines: number[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Look for patterns that commonly have issues
      if (this.isProblematicLine(trimmed, language)) {
        problematicLines.push(index);
      }
    });
    
    return problematicLines;
  }
  
  private isProblematicLine(line: string, language: string): boolean {
    // Common patterns that often have issues
    const patterns = {
      typescript: [
        /\.\w+\s*\(/,  // Method calls
        /\[\w+\]/,     // Array access
        /\w+\s*=\s*/,  // Assignments
        /if\s*\(/,     // Conditionals
        /for\s*\(/,    // Loops
        /await\s+/,    // Async calls
        /new\s+\w+/    // Object instantiation
      ],
      javascript: [
        /\.\w+\s*\(/,
        /\[\w+\]/,
        /\w+\s*=\s*/,
        /if\s*\(/,
        /for\s*\(/,
        /new\s+\w+/
      ],
      python: [
        /\.\w+\s*\(/,
        /\[\w+\]/,
        /\w+\s*=\s*/,
        /if\s+\w+/,
        /for\s+\w+/,
        /def\s+\w+/
      ]
    };
    
    const langPatterns = patterns[language as keyof typeof patterns] || patterns.typescript;
    return langPatterns.some(pattern => pattern.test(line));
  }
  
  private extractVariablesFromLine(line: string, language: string): string[] {
    const variables: string[] = [];
    
    // Simple variable extraction
    const varMatches = line.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
    if (varMatches) {
      variables.push(...varMatches.filter(v => 
        !this.isReservedWord(v, language) && v.length > 1
      ));
    }
    
    return [...new Set(variables)]; // Remove duplicates
  }
  
  private isReservedWord(word: string, language: string): boolean {
    const reserved = {
      typescript: ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export'],
      javascript: ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return'],
      python: ['def', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'from']
    };
    
    return reserved[language as keyof typeof reserved]?.includes(word.toLowerCase()) || false;
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  private selectRandomErrorType(errorTypes: string[]): string {
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }
  
  private selectTargetFile(targetFiles: string[], supportedLanguages: string[]): string {
    // Filter files by supported languages
    const compatibleFiles = targetFiles.filter(file => {
      const language = this.detectLanguage(file);
      return supportedLanguages.includes(language);
    });
    
    if (compatibleFiles.length > 0) {
      return compatibleFiles[Math.floor(Math.random() * compatibleFiles.length)];
    }
    
    // Fallback to any file
    return targetFiles[Math.floor(Math.random() * targetFiles.length)] || 'unknown.ts';
  }
  
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.py':
        return 'python';
      case '.java':
        return 'java';
      case '.go':
        return 'go';
      default:
        return 'typescript'; // Default
    }
  }
  
  private generateFunctionName(): string {
    const functions = [
      'processData', 'validateInput', 'executeQuery', 'handleRequest',
      'authenticateUser', 'processPayment', 'sendEmail', 'cacheResult',
      'parseResponse', 'formatData', 'calculateTotal', 'updateRecord'
    ];
    return functions[Math.floor(Math.random() * functions.length)];
  }
  
  private generateVariableName(): string {
    const variables = [
      'userData', 'requestBody', 'response', 'config', 'result',
      'payload', 'params', 'headers', 'session', 'connection',
      'data', 'item', 'value', 'index', 'count', 'status'
    ];
    return variables[Math.floor(Math.random() * variables.length)];
  }
  
  private generateClassName(): string {
    const classes = [
      'UserService', 'DataProcessor', 'ApiHandler', 'AuthManager',
      'PaymentGateway', 'EmailClient', 'CacheProvider', 'DatabaseConnection'
    ];
    return classes[Math.floor(Math.random() * classes.length)];
  }
  
  private generatePropertyName(): string {
    const properties = [
      'id', 'name', 'email', 'status', 'timestamp', 'data',
      'value', 'type', 'length', 'count', 'total', 'result'
    ];
    return properties[Math.floor(Math.random() * properties.length)];
  }
  
  private generateTypeName(): string {
    const types = [
      'string', 'number', 'boolean', 'object', 'array',
      'User', 'Order', 'Product', 'Response', 'Config'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  private generateValue(): string {
    const values = [
      'null', 'undefined', '""', '0', 'false',
      '"test"', '42', 'true', '[]', '{}'
    ];
    return values[Math.floor(Math.random() * values.length)];
  }
  
  private generateUrl(): string {
    const endpoints = [
      '/api/users', '/api/orders', '/api/payments', '/api/products',
      '/auth/login', '/data/export', '/admin/settings'
    ];
    return `"https://api.example.com${endpoints[Math.floor(Math.random() * endpoints.length)]}"`;
  }
  
  // ========================================
  // TEMPLATE INITIALIZATION
  // ========================================
  
  private initializeTemplates(): void {
    this.problemTemplates = new Map();
    
    // Null Pointer / Undefined Reference
    this.problemTemplates.set('null_pointer', [
      {
        type: 'null_pointer',
        severity: 'high',
        description: 'Cannot read property \'{property}\' of null',
        problemCode: '{variable}.{property}',
        fixedCode: '{variable} && {variable}.{property}',
        complexity: 'simple',
        languages: ['typescript', 'javascript'],
        fixable: true
      },
      {
        type: 'null_pointer',
        severity: 'critical',
        description: 'Null pointer dereference in {function}()',
        problemCode: 'const result = {variable}.data.{property};',
        fixedCode: 'const result = {variable}?.data?.{property};',
        complexity: 'medium',
        languages: ['typescript', 'javascript'],
        fixable: true
      }
    ]);
    
    // Type Mismatches
    this.problemTemplates.set('type_mismatch', [
      {
        type: 'type_mismatch',
        severity: 'medium',
        description: 'Type \'{type}\' is not assignable to type \'string\'',
        problemCode: 'const {variable}: string = {value};',
        fixedCode: 'const {variable}: string = String({value});',
        complexity: 'simple',
        languages: ['typescript'],
        fixable: true
      },
      {
        type: 'type_mismatch',
        severity: 'high',
        description: 'Expected {type} but got {type}',
        problemCode: '{function}({variable})',
        fixedCode: '{function}({variable} as {type})',
        complexity: 'medium',
        languages: ['typescript'],
        fixable: true
      }
    ]);
    
    // Memory Leaks
    this.problemTemplates.set('memory_leak', [
      {
        type: 'memory_leak',
        severity: 'critical',
        description: 'Potential memory leak: event listener not removed',
        problemCode: 'element.addEventListener("click", {function});',
        fixedCode: 'element.addEventListener("click", {function});\n// Remember to: element.removeEventListener("click", {function});',
        complexity: 'medium',
        languages: ['javascript', 'typescript'],
        fixable: true
      },
      {
        type: 'memory_leak',
        severity: 'high',
        description: 'Circular reference detected',
        problemCode: '{variable}.parent = this;\nthis.child = {variable};',
        fixedCode: '{variable}.parent = new WeakRef(this);\nthis.child = {variable};',
        complexity: 'complex',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    // API Timeouts
    this.problemTemplates.set('api_timeout', [
      {
        type: 'api_timeout',
        severity: 'medium',
        description: 'API request without timeout',
        problemCode: 'await fetch({url})',
        fixedCode: 'await fetch({url}, { signal: AbortSignal.timeout({timeout}) })',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      },
      {
        type: 'api_timeout',
        severity: 'high',
        description: 'Long-running request without timeout handling',
        problemCode: 'const response = await axios.get({url});',
        fixedCode: 'const response = await axios.get({url}, { timeout: {timeout} });',
        complexity: 'medium',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    // Database Issues
    this.problemTemplates.set('database_lock', [
      {
        type: 'database_lock',
        severity: 'high',
        description: 'Database query without transaction timeout',
        problemCode: 'await db.query("SELECT * FROM users WHERE id = ?", [userId]);',
        fixedCode: 'await db.query("SELECT * FROM users WHERE id = ? FOR UPDATE NOWAIT", [userId]);',
        complexity: 'medium',
        languages: ['javascript', 'typescript', 'python'],
        fixable: true
      }
    ]);
    
    // Performance Issues
    this.problemTemplates.set('performance_issue', [
      {
        type: 'performance_issue',
        severity: 'medium',
        description: 'Inefficient loop operation',
        problemCode: 'for (let i = 0; i < items.length; i++) {\n  if (items[i].{property} === {value}) return items[i];\n}',
        fixedCode: 'return items.find(item => item.{property} === {value});',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      },
      {
        type: 'performance_issue',
        severity: 'high',
        description: 'Blocking synchronous operation',
        problemCode: 'const data = fs.readFileSync("large-file.json");',
        fixedCode: 'const data = await fs.readFile("large-file.json");',
        complexity: 'medium',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    // Security Vulnerabilities
    this.problemTemplates.set('security_vulnerability', [
      {
        type: 'security_vulnerability',
        severity: 'critical',
        description: 'SQL injection vulnerability',
        problemCode: 'const query = `SELECT * FROM users WHERE name = \'${userName}\';`;',
        fixedCode: 'const query = "SELECT * FROM users WHERE name = ?"; // Use parameterized queries',
        complexity: 'medium',
        languages: ['javascript', 'typescript', 'python'],
        fixable: true
      },
      {
        type: 'security_vulnerability',
        severity: 'critical',
        description: 'Cross-site scripting (XSS) vulnerability',
        problemCode: 'element.innerHTML = userInput;',
        fixedCode: 'element.textContent = userInput; // or use DOMPurify.sanitize(userInput)',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    // Logic Errors
    this.problemTemplates.set('logic_error', [
      {
        type: 'logic_error',
        severity: 'medium',
        description: 'Off-by-one error in loop condition',
        problemCode: 'for (let i = 0; i <= array.length; i++) {',
        fixedCode: 'for (let i = 0; i < array.length; i++) {',
        complexity: 'simple',
        languages: ['javascript', 'typescript', 'python'],
        fixable: true
      },
      {
        type: 'logic_error',
        severity: 'high',
        description: 'Incorrect comparison operator',
        problemCode: 'if ({variable} = {value}) {',
        fixedCode: 'if ({variable} === {value}) {',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    // Syntax Errors
    this.problemTemplates.set('syntax_error', [
      {
        type: 'syntax_error',
        severity: 'high',
        description: 'Missing semicolon',
        problemCode: 'const {variable} = {value}',
        fixedCode: 'const {variable} = {value};',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      },
      {
        type: 'syntax_error',
        severity: 'medium',
        description: 'Mismatched brackets',
        problemCode: 'if ({variable}) {\n  return {value}\n',
        fixedCode: 'if ({variable}) {\n  return {value};\n}',
        complexity: 'simple',
        languages: ['javascript', 'typescript'],
        fixable: true
      }
    ]);
    
    this.fileTemplates = new Map([
      ['typescript', [
        'UserService.ts', 'DataProcessor.ts', 'ApiHandler.ts', 'AuthManager.ts',
        'PaymentService.ts', 'EmailService.ts', 'CacheService.ts', 'DatabaseService.ts'
      ]],
      ['javascript', [
        'user-service.js', 'data-processor.js', 'api-handler.js', 'auth-manager.js',
        'payment-service.js', 'email-service.js', 'cache-service.js', 'database-service.js'
      ]],
      ['python', [
        'user_service.py', 'data_processor.py', 'api_handler.py', 'auth_manager.py',
        'payment_service.py', 'email_service.py', 'cache_service.py', 'database_service.py'
      ]]
    ]);
  }
}
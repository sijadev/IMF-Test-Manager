/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    typecheck: {
      enabled: false // Disable strict type checking for test files
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts'
      ]
    }
  }
});
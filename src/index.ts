#!/usr/bin/env node

// ========================================
// IMF TEST MANAGER - MAIN ENTRY POINT
// ========================================

// Re-export everything from main-index for library usage
module.exports = require('./main-index');

// If this file is run directly, start the CLI
if (require.main === module) {
  require('./cli/index');
}
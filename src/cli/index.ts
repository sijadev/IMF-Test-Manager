#!/usr/bin/env node

// ========================================
// IMF TEST MANAGER - CLI INTERFACE
// ========================================

// Use the simplified CLI implementation for now
const { main } = require('./simple-cli');

// Execute the CLI
main().catch(console.error);
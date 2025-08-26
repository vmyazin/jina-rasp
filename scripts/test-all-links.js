#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔗 Starting comprehensive link validation...\n');

try {
  // Run the comprehensive link check
  console.log('Running comprehensive link validation test...');
  execSync('npx playwright test tests/comprehensive-link-check.spec.js --reporter=line', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All links validated successfully!');
  console.log('\n📊 To view detailed HTML report, run: npm run test:report');
  
} catch (error) {
  console.error('\n❌ Link validation failed!');
  console.error('Some links are broken. Check the output above for details.');
  console.error('\n📊 To view detailed HTML report, run: npm run test:report');
  process.exit(1);
}
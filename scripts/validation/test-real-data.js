/**
 * Test phone validator with real broker data
 */

const PhoneValidator = require('./phone-validator');
const fs = require('fs');

// Load real broker data
const brokerData = JSON.parse(fs.readFileSync('scripts/data/consolidated_brokers.json', 'utf8'));
const brokers = brokerData.brokers.slice(0, 10); // Test with first 10 brokers

console.log('Testing Phone Validator with Real Broker Data\n');
console.log(`Testing ${brokers.length} real broker records...\n`);

const validator = new PhoneValidator();

// Test individual records
console.log('=== Individual Phone Validation Results ===');
brokers.forEach((broker, index) => {
    const result = validator.validatePhone(broker.phone);
    console.log(`${index + 1}. ${broker.name}:`);
    console.log(`   Original: "${broker.phone}"`);
    console.log(`   Valid: ${result.isValid}`);
    console.log(`   Severity: ${result.severity}`);
    if (result.standardizedPhone && result.originalPhone !== result.standardizedPhone) {
        console.log(`   Standardized: "${result.standardizedPhone}"`);
    }
    if (result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.join(', ')}`);
    }
    console.log('');
});

// Test batch validation
console.log('=== Batch Validation Summary ===');
const batchResults = validator.validateBatch(brokers);
console.log(`Total Records: ${batchResults.totalRecords}`);
console.log(`Valid Phones: ${batchResults.validPhones} (${((batchResults.validPhones / batchResults.totalRecords) * 100).toFixed(1)}%)`);
console.log(`Invalid Phones: ${batchResults.invalidPhones}`);
console.log(`Cleaned/Standardized: ${batchResults.cleanedPhones}`);
console.log(`Critical Issues: ${batchResults.summary.critical}`);
console.log(`Warnings: ${batchResults.summary.warning}`);
console.log(`Info: ${batchResults.summary.info}`);
console.log('');

// Generate report
console.log('=== Validation Report ===');
const report = validator.generateReport(batchResults);
console.log(report);

// Show standardized records
console.log('=== Standardized Records for Database Update ===');
const standardizedRecords = validator.getStandardizedRecords(brokers);
standardizedRecords.forEach(record => {
    if (record.phoneValidation.wasStandardized) {
        console.log(`${record.name}: "${record.phone}" (was standardized)`);
    }
});
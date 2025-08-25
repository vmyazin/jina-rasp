/**
 * Test script for Phone Number Cleanup Validator
 */

const PhoneValidator = require('./phone-validator');

// Test data with various phone number scenarios
const testRecords = [
    // Valid, already standardized
    {
        id: 'test_1',
        name: 'Silva Seguros',
        phone: '(85) 97100-5622'
    },
    // Valid but needs standardization - no parentheses
    {
        id: 'test_2',
        name: 'Costa Seguros',
        phone: '85 97100-5622'
    },
    // Valid but needs standardization - no formatting
    {
        id: 'test_3',
        name: 'Santos Seguros',
        phone: '85971005622'
    },
    // Valid with country code
    {
        id: 'test_4',
        name: 'Lima Seguros',
        phone: '+5585971005622'
    },
    // Landline format (8 digits after area code)
    {
        id: 'test_5',
        name: 'Oliveira Seguros',
        phone: '(85) 3456-7890'
    },
    // Has invalid characters (letters)
    {
        id: 'test_6',
        name: 'Pereira Seguros',
        phone: '(85) 9abc7-1def00'
    },
    // Too short
    {
        id: 'test_7',
        name: 'Almeida Seguros',
        phone: '85 9710'
    },
    // Too long
    {
        id: 'test_8',
        name: 'Ferreira Seguros',
        phone: '85971005622123456'
    },
    // All zeros
    {
        id: 'test_9',
        name: 'Rodrigues Seguros',
        phone: '(85) 00000-0000'
    },
    // All same digit
    {
        id: 'test_10',
        name: 'Martins Seguros',
        phone: '(85) 11111-1111'
    },
    // Sequential numbers
    {
        id: 'test_11',
        name: 'Sousa Seguros',
        phone: '(85) 12345-6789'
    },
    // Missing phone
    {
        id: 'test_12',
        name: 'Silva Seguros',
        phone: null
    },
    // Empty phone
    {
        id: 'test_13',
        name: 'Costa Seguros',
        phone: ''
    },
    // Phone with special characters
    {
        id: 'test_14',
        name: 'Santos Seguros',
        phone: '(85) 9.7100*5622#'
    },
    // Valid mobile with 9 in front
    {
        id: 'test_15',
        name: 'Lima Seguros',
        phone: '85987654321'
    },
    // Invalid area code
    {
        id: 'test_16',
        name: 'Oliveira Seguros',
        phone: '(05) 97100-5622'
    }
];

function runTests() {
    console.log('Testing Phone Number Cleanup Validator\n');
    
    const validator = new PhoneValidator();
    
    // Test individual phone validation
    console.log('=== Individual Phone Tests ===');
    testRecords.forEach((record, index) => {
        const result = validator.validatePhone(record.phone);
        console.log(`Test ${index + 1} (${record.id}):`);
        console.log(`  Original: "${record.phone}"`);
        console.log(`  Valid: ${result.isValid}`);
        console.log(`  Severity: ${result.severity}`);
        if (result.cleanedPhone) {
            console.log(`  Cleaned: "${result.cleanedPhone}"`);
        }
        if (result.standardizedPhone) {
            console.log(`  Standardized: "${result.standardizedPhone}"`);
        }
        if (result.issues.length > 0) {
            console.log(`  Issues: ${result.issues.join(', ')}`);
        }
        console.log('');
    });
    
    // Test batch validation
    console.log('=== Batch Validation Test ===');
    const batchResults = validator.validateBatch(testRecords);
    console.log('Batch Results:');
    console.log(`  Total: ${batchResults.totalRecords}`);
    console.log(`  Valid: ${batchResults.validPhones}`);
    console.log(`  Invalid: ${batchResults.invalidPhones}`);
    console.log(`  Cleaned: ${batchResults.cleanedPhones}`);
    console.log(`  Critical Issues: ${batchResults.summary.critical}`);
    console.log(`  Warnings: ${batchResults.summary.warning}`);
    console.log(`  Info: ${batchResults.summary.info}`);
    console.log(`  Standardized: ${batchResults.summary.standardized}`);
    console.log('');
    
    // Test report generation
    console.log('=== Generated Report ===');
    const report = validator.generateReport(batchResults);
    console.log(report);
    
    // Test standardized records
    console.log('=== Standardized Records Sample ===');
    const standardizedRecords = validator.getStandardizedRecords(testRecords.slice(0, 5));
    standardizedRecords.forEach(record => {
        console.log(`${record.name}: ${record.phone} (Valid: ${record.phoneValidation.isValid}, Standardized: ${record.phoneValidation.wasStandardized})`);
    });
}

// Run the tests
runTests();
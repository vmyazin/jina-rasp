/**
 * Test script for Required Field Validator
 */

const RequiredFieldValidator = require('./required-field-validator');

// Test data with various scenarios
const testRecords = [
    // Valid record
    {
        id: 'test_1',
        name: 'Silva Seguros',
        phone: '(85) 97100-5622',
        email: 'silva@example.com',
        address: 'Rua Test, 123'
    },
    // Missing phone
    {
        id: 'test_2',
        name: 'Costa Seguros',
        email: 'costa@example.com',
        address: 'Rua Test, 456'
    },
    // Missing email
    {
        id: 'test_3',
        name: 'Santos Seguros',
        phone: '(85) 98765-4321',
        address: 'Rua Test, 789'
    },
    // Missing name (empty string)
    {
        id: 'test_4',
        name: '',
        phone: '(85) 91234-5678',
        email: 'empty@example.com'
    },
    // Missing multiple fields
    {
        id: 'test_5',
        address: 'Rua Test, 999'
    },
    // Whitespace-only name
    {
        id: 'test_6',
        name: '   ',
        phone: '(85) 95555-5555',
        email: 'whitespace@example.com'
    }
];

function runTests() {
    console.log('Testing Required Field Validator\n');
    
    const validator = new RequiredFieldValidator();
    
    // Test individual record validation
    console.log('=== Individual Record Tests ===');
    testRecords.forEach((record, index) => {
        const result = validator.validateRecord(record);
        console.log(`Test ${index + 1} (${record.id}):`);
        console.log(`  Valid: ${result.isValid}`);
        if (!result.isValid) {
            console.log(`  Missing: ${result.missingFields.join(', ')}`);
        }
        console.log('');
    });
    
    // Test batch validation
    console.log('=== Batch Validation Test ===');
    const batchResults = validator.validateBatch(testRecords);
    console.log('Batch Results:');
    console.log(`  Total: ${batchResults.totalRecords}`);
    console.log(`  Valid: ${batchResults.validRecords}`);
    console.log(`  Invalid: ${batchResults.invalidRecords}`);
    console.log(`  Missing Name: ${batchResults.summary.missingName}`);
    console.log(`  Missing Phone: ${batchResults.summary.missingPhone}`);
    console.log(`  Missing Email: ${batchResults.summary.missingEmail}`);
    console.log('');
    
    // Test report generation
    console.log('=== Generated Report ===');
    const report = validator.generateReport(batchResults);
    console.log(report);
}

// Run the tests
runTests();
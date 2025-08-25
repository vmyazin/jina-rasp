/**
 * Test file for Simple Duplicate Detection
 * Tests the duplicate detector with various scenarios
 */

const DuplicateDetector = require('./duplicate-detector');

// Test data with various duplicate scenarios
const testBrokers = [
    {
        id: 'broker_1',
        name: 'Silva Seguros',
        phone: '(85) 97100-5622',
        email: 'silva@gmail.com',
        company: 'Silva Seguros Ltda'
    },
    {
        id: 'broker_2', 
        name: 'Silva Seguros',
        phone: '85971005622', // Same phone, different format
        email: 'silva@gmail.com',
        company: 'Silva Seguros Ltda'
    },
    {
        id: 'broker_3',
        name: 'Costa Seguros',
        phone: '(85) 98765-4321',
        email: 'costa@uol.com.br'
    },
    {
        id: 'broker_4',
        name: 'Santos Seguros',
        phone: '(85) 99999-8888',
        email: 'costa@uol.com.br' // Same email as broker_3
    },
    {
        id: 'broker_5',
        name: 'oliveira seguros', // Same name as broker_6, different case
        phone: '(85) 97777-6666',
        email: 'oliveira@hotmail.com'
    },
    {
        id: 'broker_6',
        name: 'Oliveira Seguros', // Same name as broker_5, different case
        phone: '(85) 95555-4444',
        email: 'oliveira2@hotmail.com'
    },
    {
        id: 'broker_7',
        name: 'Unique Broker',
        phone: '(85) 91111-2222',
        email: 'unique@gmail.com'
    },
    {
        id: 'broker_8',
        name: 'Another Unique',
        phone: '(85) 93333-4444',
        email: 'another@yahoo.com'
    },
    {
        id: 'broker_9',
        name: 'Test Broker',
        phone: '+55 85 97100-5622', // Same as broker_1, with country code
        email: 'test@test.com'
    },
    {
        id: 'broker_10',
        name: 'Empty Fields Broker',
        phone: '', // Empty phone
        email: '', // Empty email
        company: 'Some Company'
    }
];

function runDuplicateDetectionTests() {
    console.log('=== Simple Duplicate Detection Tests ===\n');
    
    const detector = new DuplicateDetector();
    
    // Test 1: Find duplicates in test data
    console.log('Test 1: Finding duplicates in test data');
    console.log('----------------------------------------');
    
    const results = detector.findDuplicates(testBrokers);
    
    console.log(`Total Records: ${results.totalRecords}`);
    console.log(`Duplicate Groups Found: ${results.duplicatesFound}`);
    console.log(`Records Involved: ${results.summary.totalDuplicateRecords}`);
    console.log(`Phone Matches: ${results.summary.phoneMatches}`);
    console.log(`Email Matches: ${results.summary.emailMatches}`);
    console.log(`Name Matches: ${results.summary.nameMatches}`);
    console.log(`Manual Review Needed: ${results.needsManualReview}\n`);
    
    // Test 2: Show detailed duplicate groups
    console.log('Test 2: Detailed duplicate groups');
    console.log('----------------------------------');
    
    results.duplicateGroups.forEach((group, index) => {
        console.log(`Group ${index + 1}:`);
        console.log(`  Type: ${group.matchType}`);
        console.log(`  Reason: ${group.reason}`);
        console.log(`  Review Type: ${group.reviewType}`);
        console.log(`  Records:`);
        group.records.forEach(record => {
            console.log(`    - ${record.id}: "${record.name}" | ${record.phone} | ${record.email}`);
        });
        console.log('');
    });
    
    // Test 3: Auto-mergeable groups
    console.log('Test 3: Auto-mergeable groups');
    console.log('------------------------------');
    
    const autoGroups = detector.getAutoMergeableGroups(results);
    console.log(`Auto-mergeable groups: ${autoGroups.length}`);
    autoGroups.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group.reason} (${group.recordCount} records)`);
    });
    console.log('');
    
    // Test 4: Manual review groups
    console.log('Test 4: Manual review groups');
    console.log('-----------------------------');
    
    const manualGroups = detector.getManualReviewGroups(results);
    console.log(`Manual review groups: ${manualGroups.length}`);
    manualGroups.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group.reason} (${group.recordCount} records)`);
    });
    console.log('');
    
    // Test 5: Merge suggestions
    console.log('Test 5: Merge suggestions');
    console.log('--------------------------');
    
    results.duplicateGroups.forEach((group, index) => {
        const suggestion = detector.suggestMerge(group);
        if (suggestion) {
            console.log(`Group ${index + 1} merge suggestion:`);
            console.log(`  Primary: ${suggestion.primaryRecord.id} (${suggestion.completenessScore.toFixed(1)}% complete)`);
            console.log(`  Duplicates: ${suggestion.duplicateRecords.map(r => r.id).join(', ')}`);
            console.log(`  Reason: ${suggestion.reason}`);
            console.log('');
        }
    });
    
    // Test 6: Generate full report
    console.log('Test 6: Full duplicate detection report');
    console.log('=======================================');
    
    const report = detector.generateReport(results);
    console.log(report);
    
    // Test 7: Test normalization functions
    console.log('\nTest 7: Normalization function tests');
    console.log('------------------------------------');
    
    const phoneTests = [
        '(85) 97100-5622',
        '85 97100-5622',
        '85971005622',
        '+55 85 97100-5622',
        '5585971005622',
        '85 9abc7100-5622', // Invalid characters
        '123' // Too short
    ];
    
    console.log('Phone normalization tests:');
    phoneTests.forEach(phone => {
        const normalized = detector.normalizePhone(phone);
        console.log(`  "${phone}" → "${normalized}"`);
    });
    
    const emailTests = [
        'test@gmail.com',
        'TEST@GMAIL.COM',
        '  test@gmail.com  ',
        'invalid-email',
        '',
        null
    ];
    
    console.log('\nEmail normalization tests:');
    emailTests.forEach(email => {
        const normalized = detector.normalizeEmail(email);
        console.log(`  "${email}" → "${normalized}"`);
    });
    
    const nameTests = [
        'Silva Seguros',
        'SILVA SEGUROS',
        '  silva   seguros  ',
        'Silva  Seguros', // Extra spaces
        '',
        null
    ];
    
    console.log('\nName normalization tests:');
    nameTests.forEach(name => {
        const normalized = detector.normalizeName(name);
        console.log(`  "${name}" → "${normalized}"`);
    });
    
    return results;
}

// Test with empty array
function testEmptyArray() {
    console.log('\n=== Test with Empty Array ===');
    const detector = new DuplicateDetector();
    const results = detector.findDuplicates([]);
    console.log('Empty array results:', results);
}

// Test with single record
function testSingleRecord() {
    console.log('\n=== Test with Single Record ===');
    const detector = new DuplicateDetector();
    const singleRecord = [{
        id: 'single',
        name: 'Single Broker',
        phone: '(85) 99999-9999',
        email: 'single@test.com'
    }];
    const results = detector.findDuplicates(singleRecord);
    console.log('Single record results:', results);
}

// Run all tests
if (require.main === module) {
    runDuplicateDetectionTests();
    testEmptyArray();
    testSingleRecord();
}

module.exports = { runDuplicateDetectionTests, testBrokers };
/**
 * Test Simple Validation Reporter
 * 
 * Unit tests for the SimpleValidationReporter class
 */

const SimpleValidationReporter = require('./simple-validation-reporter');

// Test data with various validation issues
const testRecords = [
    {
        id: 'test_1',
        name: 'Perfect Broker',
        email: 'perfect@example.com',
        phone: '(85) 99999-9999',
        website: 'https://perfect.com',
        address: 'Rua Perfect, 123',
        neighborhood: 'Centro',
        city: 'Fortaleza',
        state: 'CE',
        postal_code: '60000-000',
        specialties: ['auto', 'vida'],
        rating: 4.5,
        review_count: 10,
        description: 'Perfect broker with all fields'
    },
    {
        id: 'test_2',
        name: 'Missing Email Broker',
        email: '', // Invalid - empty
        phone: '(85) 88888-8888',
        website: 'https://missing-email.com',
        address: 'Rua Missing, 456'
        // Missing many optional fields
    },
    {
        id: 'test_3',
        name: 'Bad Phone Broker',
        email: 'badphone@example.com',
        phone: '123', // Invalid - too short
        website: 'https://badphone.com'
        // Missing many fields
    },
    {
        id: 'test_4',
        name: '', // Invalid - empty name
        email: 'invalid-email', // Invalid format
        phone: '(85) 77777-7777'
        // Very incomplete record
    },
    {
        id: 'test_5',
        name: 'Duplicate Broker',
        email: 'duplicate@example.com',
        phone: '(85) 66666-6666',
        address: 'Rua Duplicate, 789'
    },
    {
        id: 'test_6',
        name: 'Duplicate Broker', // Same name as test_5
        email: 'duplicate2@example.com',
        phone: '(85) 55555-5555',
        address: 'Rua Duplicate, 999'
    }
];

async function runTests() {
    console.log('🧪 Testing Simple Validation Reporter');
    console.log('====================================\n');

    const reporter = new SimpleValidationReporter();

    try {
        // Generate validation report
        console.log('📊 Generating validation report...');
        const report = await reporter.generateValidationReport(testRecords);

        // Display results
        console.log('\n📈 Test Results:');
        console.log('================');
        console.log(`Total Records: ${report.metadata.totalRecords}`);
        console.log(`Records with no issues: ${report.summary.recordsWithNoIssues}`);
        console.log(`Records needing attention: ${report.summary.recordsNeedingAttention}`);
        console.log(`Total issues: ${report.summary.totalIssues}`);

        console.log('\n🔍 Issues by Type:');
        Object.entries(report.issuesByType).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });

        console.log('\n⚠️ Records Needing Attention:');
        report.recordsNeedingAttention.forEach((record, index) => {
            console.log(`${index + 1}. ${record.name} (${record.severity})`);
            record.issues.forEach(issue => {
                console.log(`   - ${issue.type}: ${issue.description}`);
            });
        });

        // Test summary text generation
        console.log('\n📄 Testing summary text generation...');
        const summaryText = reporter.generateSummaryText(report);
        console.log('Summary text generated successfully ✅');

        // Test file saving
        console.log('\n💾 Testing file saving...');
        const filePaths = await reporter.saveReport(report, 'test-validation-report');
        console.log(`JSON report saved: ${filePaths.json} ✅`);
        console.log(`Summary saved: ${filePaths.summary} ✅`);

        console.log('\n✅ All tests completed successfully!');
        
        // Validate expected results
        console.log('\n🔍 Validating expected results...');
        
        // Should have 6 total records
        if (report.metadata.totalRecords !== 6) {
            throw new Error(`Expected 6 records, got ${report.metadata.totalRecords}`);
        }
        
        // Should have at least 4 records with issues (missing email, bad phone, empty name, duplicate)
        if (report.summary.recordsNeedingAttention < 4) {
            throw new Error(`Expected at least 4 records needing attention, got ${report.summary.recordsNeedingAttention}`);
        }
        
        // Should detect missing required fields
        if (report.issuesByType.missingRequiredFields === 0) {
            throw new Error('Expected to detect missing required fields');
        }
        
        // Should detect invalid emails
        if (report.issuesByType.invalidEmails === 0) {
            throw new Error('Expected to detect invalid emails');
        }
        
        // Should detect invalid phones
        if (report.issuesByType.invalidPhones === 0) {
            throw new Error('Expected to detect invalid phones');
        }
        
        console.log('✅ All validation checks passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests if called directly
if (require.main === module) {
    runTests();
}

module.exports = { testRecords, runTests };
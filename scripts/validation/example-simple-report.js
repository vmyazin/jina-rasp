/**
 * Example: Simple Validation Report Usage
 * 
 * This example demonstrates how to use the SimpleValidationReporter
 * to generate validation reports for broker data.
 */

const SimpleValidationReporter = require('./simple-validation-reporter');

// Example broker data with various validation issues
const exampleBrokers = [
    {
        id: 'broker_1',
        name: 'Excellent Insurance Co.',
        email: 'contact@excellent.com',
        phone: '(85) 99999-9999',
        website: 'https://excellent.com',
        address: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'Fortaleza',
        state: 'CE',
        postal_code: '60000-000',
        specialties: ['auto', 'vida', 'residencial'],
        rating: 4.8,
        review_count: 25,
        description: 'Leading insurance broker in Fortaleza'
    },
    {
        id: 'broker_2',
        name: 'Incomplete Broker',
        email: '', // Missing email - critical issue
        phone: '(85) 88888-8888',
        address: 'Rua Incomplete, 456'
        // Missing many fields - low completeness
    },
    {
        id: 'broker_3',
        name: 'Bad Data Broker',
        email: 'invalid-email', // Invalid email format
        phone: '123', // Invalid phone format
        website: 'not-a-url',
        address: 'Some address'
    },
    {
        id: 'broker_4',
        name: 'Duplicate Name',
        email: 'duplicate1@example.com',
        phone: '(85) 77777-7777',
        address: 'Rua Duplicate, 789'
    },
    {
        id: 'broker_5',
        name: 'Duplicate Name', // Same name as broker_4
        email: 'duplicate2@example.com',
        phone: '(85) 66666-6666',
        address: 'Rua Different, 101'
    }
];

async function runExample() {
    console.log('📊 Simple Validation Report Example');
    console.log('===================================\n');

    const reporter = new SimpleValidationReporter();

    try {
        // Generate validation report
        console.log('🔍 Running validation on example data...');
        const report = await reporter.generateValidationReport(exampleBrokers);

        // Display key metrics
        console.log('\n📈 Key Metrics:');
        console.log(`Total Records: ${report.metadata.totalRecords}`);
        console.log(`Records with Issues: ${report.summary.recordsNeedingAttention}`);
        console.log(`Records without Issues: ${report.summary.recordsWithNoIssues}`);
        console.log(`Total Issues Found: ${report.summary.totalIssues}`);

        // Show issue breakdown
        console.log('\n🔍 Issues by Type:');
        Object.entries(report.issuesByType).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`- ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${count} records`);
            }
        });

        // Show records needing attention
        if (report.recordsNeedingAttention.length > 0) {
            console.log('\n⚠️ Records Needing Attention:');
            report.recordsNeedingAttention.forEach((record, index) => {
                console.log(`\n${index + 1}. ${record.name} (${record.severity} priority)`);
                console.log(`   Contact: ${record.email} | ${record.phone}`);
                console.log('   Issues:');
                record.issues.forEach(issue => {
                    console.log(`   - ${issue.description}`);
                });
            });
        }

        // Generate summary text
        console.log('\n📄 Generating summary report...');
        const summaryText = reporter.generateSummaryText(report);
        
        // Save reports
        console.log('💾 Saving reports...');
        const filePaths = await reporter.saveReport(report, 'example-validation-report');
        
        console.log('\n✅ Example completed successfully!');
        console.log(`📊 JSON Report: ${filePaths.json}`);
        console.log(`📄 Summary: ${filePaths.summary}`);

        // Show what the JSON structure looks like
        console.log('\n📋 JSON Report Structure:');
        console.log('- metadata: Report generation info');
        console.log('- summary: Overall statistics');
        console.log('- issuesByType: Count of each issue type');
        console.log('- validationResults: Detailed results from each validator');
        console.log('- recordsNeedingAttention: List of problematic records with details');

    } catch (error) {
        console.error('❌ Example failed:', error.message);
        process.exit(1);
    }
}

// Run example if called directly
if (require.main === module) {
    runExample();
}

module.exports = { exampleBrokers, runExample };
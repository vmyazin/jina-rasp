/**
 * Test duplicate detection with real broker data
 * Loads actual broker data and runs duplicate detection
 */

const fs = require('fs');
const path = require('path');
const DuplicateDetector = require('./duplicate-detector');

// Load real broker data
function loadBrokerData() {
    try {
        // Try to load consolidated broker data
        const dataPath = path.join(__dirname, '../data/consolidated_brokers.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            // Check if data has brokers array or is structured differently
            if (data.brokers && Array.isArray(data.brokers)) {
                return data.brokers;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.log('Consolidated data has unexpected structure, trying simple data...');
            }
        }
        
        // Fallback to simple brokers data
        const fallbackPath = path.join(__dirname, '../data/brokers_simple.json');
        if (fs.existsSync(fallbackPath)) {
            const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            if (Array.isArray(data)) {
                return data;
            } else if (data.brokers && Array.isArray(data.brokers)) {
                return data.brokers;
            }
        }
        
        console.log('No valid broker data files found. Using sample data.');
        return null;
    } catch (error) {
        console.error('Error loading broker data:', error.message);
        return null;
    }
}

function testDuplicatesWithRealData() {
    console.log('=== Duplicate Detection with Real Broker Data ===\n');
    
    const brokerData = loadBrokerData();
    
    if (!brokerData) {
        console.log('No real data available. Please run data collection scripts first.');
        return;
    }
    
    console.log(`Loaded ${brokerData.length} broker records\n`);
    
    const detector = new DuplicateDetector();
    
    // Run duplicate detection
    console.log('Running duplicate detection...');
    const results = detector.findDuplicates(brokerData);
    
    // Show summary
    console.log('\n=== Duplicate Detection Results ===');
    console.log(`Total Records: ${results.totalRecords}`);
    console.log(`Duplicate Groups Found: ${results.duplicatesFound}`);
    console.log(`Records Involved in Duplicates: ${results.summary.totalDuplicateRecords} (${((results.summary.totalDuplicateRecords / results.totalRecords) * 100).toFixed(1)}%)`);
    console.log(`Phone Matches: ${results.summary.phoneMatches} groups`);
    console.log(`Email Matches: ${results.summary.emailMatches} groups`);
    console.log(`Name Matches: ${results.summary.nameMatches} groups`);
    console.log(`Manual Review Needed: ${results.needsManualReview} groups\n`);
    
    // Show detailed results if duplicates found
    if (results.duplicatesFound > 0) {
        console.log('=== Detailed Duplicate Groups ===');
        results.duplicateGroups.forEach((group, index) => {
            console.log(`\nGroup ${index + 1} [${group.reviewType.toUpperCase()}]:`);
            console.log(`  Type: ${group.matchType}`);
            console.log(`  Reason: ${group.reason}`);
            console.log(`  Records (${group.recordCount}):`);
            
            group.records.forEach(record => {
                console.log(`    - ID: ${record.id}`);
                console.log(`      Name: "${record.name}"`);
                console.log(`      Phone: "${record.phone}"`);
                console.log(`      Email: "${record.email}"`);
                if (record.company) console.log(`      Company: "${record.company}"`);
                if (record.neighborhood) console.log(`      Neighborhood: "${record.neighborhood}"`);
                console.log('');
            });
            
            // Show merge suggestion
            const suggestion = detector.suggestMerge(group);
            if (suggestion) {
                console.log(`  Merge Suggestion:`);
                console.log(`    Primary: ${suggestion.primaryRecord.id} (${suggestion.completenessScore.toFixed(1)}% complete)`);
                console.log(`    Duplicates: ${suggestion.duplicateRecords.map(r => r.id).join(', ')}`);
                console.log(`    Reason: ${suggestion.reason}`);
            }
        });
        
        // Auto-mergeable groups
        const autoGroups = detector.getAutoMergeableGroups(results);
        if (autoGroups.length > 0) {
            console.log(`\n=== Auto-Mergeable Groups (${autoGroups.length}) ===`);
            autoGroups.forEach((group, index) => {
                const suggestion = detector.suggestMerge(group);
                console.log(`${index + 1}. ${group.reason}`);
                console.log(`   → Keep ${suggestion.primaryRecord.id} (${suggestion.primaryRecord.name})`);
                console.log(`   → Merge ${suggestion.duplicateRecords.map(r => `${r.id} (${r.name})`).join(', ')}`);
            });
        }
        
        // Manual review groups
        const manualGroups = detector.getManualReviewGroups(results);
        if (manualGroups.length > 0) {
            console.log(`\n=== Manual Review Groups (${manualGroups.length}) ===`);
            manualGroups.forEach((group, index) => {
                console.log(`${index + 1}. ${group.reason}`);
                console.log(`   Records: ${group.records.map(r => `${r.id} (${r.name})`).join(', ')}`);
            });
        }
        
        // Generate full report
        console.log('\n=== Full Duplicate Detection Report ===');
        const report = detector.generateReport(results);
        console.log(report);
        
        // Save results to file
        const outputPath = path.join(__dirname, '../data/duplicate-detection-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to: ${outputPath}`);
        
    } else {
        console.log('✅ No duplicates found in the dataset!');
        console.log('This indicates good data quality in the broker directory.');
    }
    
    return results;
}

// Sample data for testing if no real data available
const sampleBrokers = [
    {
        id: 'sample_1',
        name: 'Silva Seguros',
        phone: '(85) 97100-5622',
        email: 'silva@gmail.com',
        company: 'Silva Seguros Ltda',
        neighborhood: 'Centro'
    },
    {
        id: 'sample_2',
        name: 'Silva Seguros',
        phone: '85 97100-5622', // Same phone, different format
        email: 'silva@gmail.com',
        company: 'Silva Seguros Ltda',
        neighborhood: 'Centro'
    },
    {
        id: 'sample_3',
        name: 'Costa Seguros',
        phone: '(85) 98765-4321',
        email: 'costa@uol.com.br',
        neighborhood: 'Aldeota'
    }
];

function testWithSampleData() {
    console.log('\n=== Testing with Sample Data ===');
    
    const detector = new DuplicateDetector();
    const results = detector.findDuplicates(sampleBrokers);
    
    console.log(`Sample test results:`);
    console.log(`- Total Records: ${results.totalRecords}`);
    console.log(`- Duplicate Groups: ${results.duplicatesFound}`);
    console.log(`- Phone Matches: ${results.summary.phoneMatches}`);
    console.log(`- Email Matches: ${results.summary.emailMatches}`);
    console.log(`- Name Matches: ${results.summary.nameMatches}`);
    
    if (results.duplicatesFound > 0) {
        console.log('\nSample duplicate groups:');
        results.duplicateGroups.forEach((group, index) => {
            console.log(`${index + 1}. ${group.reason} (${group.recordCount} records)`);
        });
    }
}

// Run the test
if (require.main === module) {
    const results = testDuplicatesWithRealData();
    
    // If no real data was available, test with sample data
    if (!results) {
        testWithSampleData();
    }
}

module.exports = { testDuplicatesWithRealData, loadBrokerData };
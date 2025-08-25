/**
 * Example usage of Completeness Scorer
 * 
 * Demonstrates how to use the completeness scorer with real broker data
 * and integrate it with existing validation tools.
 */

const CompletenessScorer = require('./completeness-scorer');
const RequiredFieldValidator = require('./required-field-validator');
const fs = require('fs').promises;
const path = require('path');

async function demonstrateCompletenessScoring() {
    console.log('🎯 Completeness Scoring Example\n');
    
    const scorer = new CompletenessScorer();
    const requiredValidator = new RequiredFieldValidator();
    
    // Sample broker data (simulating real database records)
    const brokerRecords = [
        {
            id: 'broker-001',
            name: 'Seguros Fortaleza Ltda',
            email: 'contato@segurosfortaleza.com',
            phone: '(85) 3456-7890',
            website: 'https://segurosfortaleza.com',
            address: 'Av. Santos Dumont, 1234',
            neighborhood: 'Aldeota',
            city: 'Fortaleza',
            state: 'CE',
            postal_code: '60150-161',
            specialties: ['auto', 'vida', 'residencial', 'empresarial'],
            rating: 4.7,
            review_count: 42,
            description: 'Corretora de seguros com mais de 20 anos de experiência no mercado cearense.',
            license_number: 'SUSEP-CE-001234',
            years_experience: 22,
            company_size: 'medium'
        },
        {
            id: 'broker-002',
            name: 'João Silva - Corretor',
            email: 'joao.silva@gmail.com',
            phone: '(85) 99876-5432',
            address: 'Rua Major Facundo, 567',
            neighborhood: 'Centro',
            city: 'Fortaleza',
            state: 'CE',
            specialties: ['auto', 'moto'],
            rating: 4.2,
            review_count: 15,
            description: 'Corretor autônomo especializado em seguros automotivos.'
            // Missing: website, postal_code, social_media, business_hours, license_number, years_experience, company_size, source_url
        },
        {
            id: 'broker-003',
            name: 'Maria Santos Seguros',
            email: 'maria@santosseguros.com.br',
            phone: '(85) 3333-4444',
            website: 'www.santosseguros.com.br',
            neighborhood: 'Meireles',
            specialties: ['vida', 'saude'],
            rating: 4.5
            // Missing many fields - lower completeness
        },
        {
            id: 'broker-004',
            name: 'Pedro Oliveira',
            phone: '(85) 2222-3333'
            // Missing email (required field) and most others - very low completeness
        }
    ];

    console.log('📊 Step 1: Individual Record Analysis');
    console.log('=====================================');
    
    brokerRecords.forEach((record, index) => {
        const completeness = scorer.calculateCompleteness(record);
        const requiredValidation = requiredValidator.validateRecord(record);
        
        console.log(`\n🏢 Broker ${index + 1}: ${record.name}`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Completeness: ${completeness.completenessPercentage}% (${completeness.filledFields}/${completeness.totalFields} fields)`);
        console.log(`   Category: ${scorer.getCompletenessCategory(completeness.completenessPercentage)}`);
        console.log(`   Required Fields: ${requiredValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (!requiredValidation.isValid) {
            console.log(`   Missing Required: ${requiredValidation.missingFields.join(', ')}`);
        }
        
        if (completeness.missingFields.length > 0) {
            const topMissing = completeness.missingFields.slice(0, 5);
            console.log(`   Top Missing Fields: ${topMissing.join(', ')}${completeness.missingFields.length > 5 ? '...' : ''}`);
        }
    });

    console.log('\n\n📈 Step 2: Batch Analysis');
    console.log('=========================');
    
    const batchResults = scorer.calculateBatchCompleteness(brokerRecords);
    const requiredResults = requiredValidator.validateBatch(brokerRecords);
    
    console.log(`Total Records Analyzed: ${batchResults.totalRecords}`);
    console.log(`Average Completeness: ${batchResults.averageCompleteness}%`);
    console.log(`Required Fields Pass Rate: ${((requiredResults.validRecords / requiredResults.totalRecords) * 100).toFixed(1)}%`);
    
    console.log('\nCompleteness Distribution:');
    console.log(`  High (≥80%): ${batchResults.summary.highCompleteness} records`);
    console.log(`  Medium (50-79%): ${batchResults.summary.mediumCompleteness} records`);
    console.log(`  Low (<50%): ${batchResults.summary.lowCompleteness} records`);

    console.log('\n\n📋 Step 3: Field Analysis');
    console.log('=========================');
    
    console.log('Fields with lowest fill rates (need attention):');
    const sortedFields = Object.entries(batchResults.summary.fieldFillRates)
        .sort((a, b) => a[1].percentage - b[1].percentage)
        .slice(0, 8);
    
    sortedFields.forEach(([field, stats]) => {
        const status = stats.percentage >= 80 ? '✅' : stats.percentage >= 50 ? '⚠️' : '❌';
        console.log(`  ${status} ${field}: ${stats.percentage}% (${stats.filled}/${stats.total})`);
    });

    console.log('\n\n📄 Step 4: Generate Reports');
    console.log('============================');
    
    // Generate text report
    const textReport = scorer.generateReport(batchResults);
    const reportPath = path.join(__dirname, 'reports', `completeness-report-${new Date().toISOString().split('T')[0]}.txt`);
    
    try {
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, textReport);
        console.log(`✅ Text report saved: ${reportPath}`);
    } catch (error) {
        console.log(`❌ Error saving text report: ${error.message}`);
    }
    
    // Generate JSON export
    const jsonExport = scorer.exportToJSON(batchResults);
    const jsonPath = path.join(__dirname, 'reports', `completeness-data-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
        await fs.writeFile(jsonPath, JSON.stringify(jsonExport, null, 2));
        console.log(`✅ JSON data saved: ${jsonPath}`);
    } catch (error) {
        console.log(`❌ Error saving JSON data: ${error.message}`);
    }

    console.log('\n\n🎯 Step 5: Actionable Insights');
    console.log('==============================');
    
    // Find records that need immediate attention
    const lowCompletenessRecords = batchResults.completenessResults
        .filter(result => result.completenessPercentage < 50)
        .sort((a, b) => a.completenessPercentage - b.completenessPercentage);
    
    if (lowCompletenessRecords.length > 0) {
        console.log('🚨 Records needing immediate attention:');
        lowCompletenessRecords.forEach(result => {
            const record = brokerRecords.find(r => r.id === result.recordId);
            console.log(`  • ${record?.name || result.recordId}: ${result.completenessPercentage}% complete`);
            console.log(`    Priority missing: ${result.missingFields.slice(0, 3).join(', ')}`);
        });
    }
    
    // Find fields that need data collection focus
    const lowFillRateFields = Object.entries(batchResults.summary.fieldFillRates)
        .filter(([field, stats]) => stats.percentage < 30)
        .sort((a, b) => a[1].percentage - b[1].percentage);
    
    if (lowFillRateFields.length > 0) {
        console.log('\n📝 Fields needing data collection focus:');
        lowFillRateFields.forEach(([field, stats]) => {
            console.log(`  • ${field}: Only ${stats.percentage}% filled (${stats.filled}/${stats.total} records)`);
        });
    }
    
    // Success metrics
    const highQualityRecords = batchResults.completenessResults
        .filter(result => result.completenessPercentage >= 80);
    
    console.log('\n✨ Success Metrics:');
    console.log(`  • ${highQualityRecords.length} records have high completeness (≥80%)`);
    console.log(`  • ${requiredResults.validRecords} records have all required fields`);
    console.log(`  • Average data quality: ${batchResults.averageCompleteness}%`);
    
    console.log('\n🎉 Completeness analysis complete!');
    console.log('\nNext steps:');
    console.log('1. Focus data collection on low fill-rate fields');
    console.log('2. Improve records with <50% completeness');
    console.log('3. Ensure all records have required fields (name, email, phone)');
    console.log('4. Set up regular completeness monitoring');
}

// Integration example with existing validation workflow
async function integratedValidationExample() {
    console.log('\n\n🔄 Integrated Validation Workflow Example');
    console.log('==========================================');
    
    const scorer = new CompletenessScorer();
    const requiredValidator = new RequiredFieldValidator();
    
    // Simulate processing a new batch of broker data
    const newBrokerData = [
        {
            id: 'new-001',
            name: 'Nova Corretora Ltda',
            email: 'contato@novacorretora.com',
            phone: '(85) 1111-2222',
            website: 'https://novacorretora.com',
            specialties: ['auto', 'residencial'],
            rating: 4.0,
            review_count: 8
        }
    ];
    
    console.log('Processing new broker data...\n');
    
    newBrokerData.forEach(record => {
        // Step 1: Required field validation
        const requiredCheck = requiredValidator.validateRecord(record);
        console.log(`📋 Required Fields: ${requiredCheck.isValid ? '✅ Pass' : '❌ Fail'}`);
        
        if (!requiredCheck.isValid) {
            console.log(`   Missing: ${requiredCheck.missingFields.join(', ')}`);
        }
        
        // Step 2: Completeness scoring
        const completeness = scorer.calculateCompleteness(record);
        console.log(`📊 Completeness: ${completeness.completenessPercentage}% (${scorer.getCompletenessCategory(completeness.completenessPercentage)})`);
        
        // Step 3: Decision logic
        if (!requiredCheck.isValid) {
            console.log('🚫 Action: Reject record - missing required fields');
        } else if (completeness.completenessPercentage < 30) {
            console.log('⚠️  Action: Flag for data enrichment - very low completeness');
        } else if (completeness.completenessPercentage < 60) {
            console.log('📝 Action: Accept with note - could use more data');
        } else {
            console.log('✅ Action: Accept - good quality record');
        }
        
        console.log(`   Suggested improvements: ${completeness.missingFields.slice(0, 3).join(', ')}`);
    });
}

// Run examples if this file is executed directly
if (require.main === module) {
    demonstrateCompletenessScoring()
        .then(() => integratedValidationExample())
        .catch(error => {
            console.error('❌ Error running examples:', error);
            process.exit(1);
        });
}

module.exports = {
    demonstrateCompletenessScoring,
    integratedValidationExample
};
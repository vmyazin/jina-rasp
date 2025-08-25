/**
 * Test script for Completeness Scorer
 * 
 * Tests the completeness scoring functionality with sample data
 */

const CompletenessScorer = require('./completeness-scorer');

// Sample test data representing different completeness levels
const testRecords = [
    // High completeness record (most fields filled)
    {
        id: 'test-001',
        name: 'João Silva Seguros',
        email: 'joao@silva-seguros.com',
        phone: '(85) 99999-1234',
        website: 'https://silva-seguros.com',
        address: 'Rua das Flores, 123',
        neighborhood: 'Aldeota',
        city: 'Fortaleza',
        state: 'CE',
        postal_code: '60150-000',
        specialties: ['auto', 'vida', 'residencial'],
        rating: 4.5,
        review_count: 25,
        description: 'Especialista em seguros com 15 anos de experiência',
        social_media: { facebook: 'silva-seguros', instagram: '@silvaseguros' },
        business_hours: { monday: '8:00-18:00', tuesday: '8:00-18:00' },
        license_number: 'SUSEP-12345',
        years_experience: 15,
        company_size: 'small',
        source_url: 'https://example.com/joao-silva'
    },

    // Medium completeness record (some fields missing)
    {
        id: 'test-002',
        name: 'Maria Santos Corretora',
        email: 'maria@santos.com',
        phone: '(85) 88888-5678',
        website: 'https://santos-corretora.com',
        address: 'Av. Beira Mar, 456',
        neighborhood: 'Meireles',
        city: 'Fortaleza',
        state: 'CE',
        specialties: ['auto', 'empresarial'],
        rating: 4.2,
        review_count: 18,
        description: 'Corretora de seguros especializada em empresas',
        // Missing: postal_code, social_media, business_hours, license_number, years_experience, company_size, source_url
    },

    // Low completeness record (only required fields)
    {
        id: 'test-003',
        name: 'Pedro Oliveira',
        email: 'pedro@email.com',
        phone: '(85) 77777-9012',
        // Missing most optional fields
        city: 'Fortaleza',
        state: 'CE'
    },

    // Very low completeness record (missing even some required fields)
    {
        id: 'test-004',
        name: 'Ana Costa',
        // Missing email and phone (required fields)
        neighborhood: 'Centro',
        city: 'Fortaleza'
    },

    // Record with empty/null values (should be treated as missing)
    {
        id: 'test-005',
        name: 'Carlos Lima',
        email: 'carlos@lima.com',
        phone: '(85) 66666-3456',
        website: '', // Empty string
        address: null, // Null value
        neighborhood: '   ', // Whitespace only
        specialties: [], // Empty array
        social_media: {}, // Empty object
        rating: 0, // Zero is valid
        review_count: 0 // Zero is valid
    }
];

function runTests() {
    console.log('🧪 Testing Completeness Scorer\n');
    
    const scorer = new CompletenessScorer();
    
    // Test 1: Single record scoring
    console.log('📊 Test 1: Single Record Scoring');
    console.log('================================');
    
    testRecords.forEach((record, index) => {
        const result = scorer.calculateCompleteness(record);
        console.log(`Record ${index + 1} (${record.id}):`);
        console.log(`  Completeness: ${result.completenessPercentage}% (${result.filledFields}/${result.totalFields} fields)`);
        console.log(`  Category: ${scorer.getCompletenessCategory(result.completenessPercentage)}`);
        console.log(`  Missing fields: ${result.missingFields.join(', ') || 'None'}`);
        console.log('');
    });

    // Test 2: Batch scoring
    console.log('📈 Test 2: Batch Scoring');
    console.log('========================');
    
    const batchResults = scorer.calculateBatchCompleteness(testRecords);
    console.log(`Total Records: ${batchResults.totalRecords}`);
    console.log(`Average Completeness: ${batchResults.averageCompleteness}%`);
    console.log(`High Completeness (≥80%): ${batchResults.summary.highCompleteness} records`);
    console.log(`Medium Completeness (50-79%): ${batchResults.summary.mediumCompleteness} records`);
    console.log(`Low Completeness (<50%): ${batchResults.summary.lowCompleteness} records`);
    console.log('');

    // Test 3: Field fill rates
    console.log('📋 Test 3: Field Fill Rates');
    console.log('===========================');
    
    const sortedFields = Object.entries(batchResults.summary.fieldFillRates)
        .sort((a, b) => b[1].percentage - a[1].percentage);
    
    sortedFields.slice(0, 10).forEach(([field, stats]) => {
        console.log(`${field}: ${stats.percentage}% (${stats.filled}/${stats.total})`);
    });
    console.log('');

    // Test 4: Generate report
    console.log('📄 Test 4: Generated Report');
    console.log('===========================');
    const report = scorer.generateReport(batchResults);
    console.log(report);

    // Test 5: JSON export
    console.log('💾 Test 5: JSON Export');
    console.log('======================');
    const jsonExport = scorer.exportToJSON(batchResults);
    console.log('JSON export structure:');
    console.log(`- Metadata keys: ${Object.keys(jsonExport.metadata).join(', ')}`);
    console.log(`- Summary keys: ${Object.keys(jsonExport.summary).join(', ')}`);
    console.log(`- Records count: ${jsonExport.records.length}`);
    console.log(`- Sample record keys: ${Object.keys(jsonExport.records[0]).join(', ')}`);
    console.log('');

    // Test 6: Edge cases
    console.log('🔍 Test 6: Edge Cases');
    console.log('=====================');
    
    // Empty array
    const emptyResults = scorer.calculateBatchCompleteness([]);
    console.log(`Empty array: ${emptyResults.totalRecords} records, ${emptyResults.averageCompleteness}% avg`);
    
    // Record with all null values
    const nullRecord = { id: 'null-test' };
    Object.keys(testRecords[0]).forEach(key => {
        if (key !== 'id') nullRecord[key] = null;
    });
    const nullResult = scorer.calculateCompleteness(nullRecord);
    console.log(`All-null record: ${nullResult.completenessPercentage}% completeness`);
    
    // Record with mixed data types
    const mixedRecord = {
        id: 'mixed-test',
        name: 'Test',
        email: 'test@test.com',
        phone: '123456789',
        rating: 0, // Valid zero
        review_count: false, // Boolean false
        specialties: ['auto'], // Array with content
        social_media: { test: 'value' }, // Object with content
        website: undefined, // Undefined
        address: '' // Empty string
    };
    const mixedResult = scorer.calculateCompleteness(mixedRecord);
    console.log(`Mixed data types: ${mixedResult.completenessPercentage}% completeness`);
    
    console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testRecords };
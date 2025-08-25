/**
 * Validate existing broker data for required fields
 */

const fs = require('fs');
const path = require('path');
const RequiredFieldValidator = require('./required-field-validator');

async function validateExistingData() {
    try {
        console.log('Loading existing broker data...');
        
        // Load consolidated broker data
        const dataPath = path.join(__dirname, '../data/consolidated_brokers.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        
        if (!data.brokers || !Array.isArray(data.brokers)) {
            throw new Error('Invalid data format: brokers array not found');
        }
        
        console.log(`Found ${data.brokers.length} broker records to validate\n`);
        
        // Initialize validator
        const validator = new RequiredFieldValidator();
        
        // Run validation
        console.log('Running required field validation...');
        const results = validator.validateBatch(data.brokers);
        
        // Display results
        console.log('\n=== Validation Results ===');
        console.log(`Total Records: ${results.totalRecords}`);
        console.log(`Valid Records: ${results.validRecords} (${((results.validRecords / results.totalRecords) * 100).toFixed(1)}%)`);
        console.log(`Invalid Records: ${results.invalidRecords}`);
        
        if (results.invalidRecords > 0) {
            console.log('\nMissing Field Summary:');
            console.log(`- Missing Name: ${results.summary.missingName} records`);
            console.log(`- Missing Phone: ${results.summary.missingPhone} records`);
            console.log(`- Missing Email: ${results.summary.missingEmail} records`);
            
            console.log('\nFirst 10 records needing attention:');
            results.validationResults
                .filter(result => !result.isValid)
                .slice(0, 10)
                .forEach(result => {
                    console.log(`- Record ${result.recordId}: Missing ${result.missingFields.join(', ')}`);
                });
                
            if (results.invalidRecords > 10) {
                console.log(`... and ${results.invalidRecords - 10} more records`);
            }
        }
        
        // Generate and save detailed report
        const report = validator.generateReport(results);
        const reportPath = path.join(__dirname, '../data/validation-report.txt');
        fs.writeFileSync(reportPath, report);
        console.log(`\nDetailed report saved to: ${reportPath}`);
        
        // Save validation results as JSON
        const jsonReportPath = path.join(__dirname, '../data/validation-results.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
        console.log(`Validation results saved to: ${jsonReportPath}`);
        
        return results;
        
    } catch (error) {
        console.error('Error validating data:', error.message);
        process.exit(1);
    }
}

// Run validation if called directly
if (require.main === module) {
    validateExistingData();
}

module.exports = validateExistingData;
#!/usr/bin/env node

/**
 * Example Usage of Database Cleanup Script
 * 
 * This script demonstrates how to use the database cleanup functionality
 * and shows the expected output format.
 */

const DatabaseCleanup = require('./cleanup-database');

async function runCleanupExample() {
    console.log('🧹 Database Cleanup Example');
    console.log('============================\n');

    try {
        // Create cleanup instance
        const cleanup = new DatabaseCleanup();
        
        // Run the cleanup process
        console.log('Starting cleanup process...\n');
        const results = await cleanup.runCleanup();
        
        // Display results summary
        console.log('\n📊 FINAL RESULTS SUMMARY:');
        console.log('==========================');
        console.log(`Total Records Processed: ${results.totalRecords}`);
        console.log(`Processing Time: ${(results.processingTime / 1000).toFixed(2)} seconds`);
        
        console.log('\n🔧 Fixes Applied:');
        console.log(`  - Phone Numbers Standardized: ${results.fixesApplied.phoneStandardized}`);
        console.log(`  - Email Addresses Normalized: ${results.fixesApplied.emailNormalized}`);
        console.log(`  - Total Records Updated: ${results.fixesApplied.totalRecordsUpdated}`);
        
        console.log('\n🔍 Validation Results:');
        const { requiredFields, phoneValidation, emailValidation, duplicateDetection } = results.validationResults;
        
        console.log(`  Required Fields:`);
        console.log(`    - Valid: ${requiredFields.validRecords}/${requiredFields.totalRecords} (${((requiredFields.validRecords / requiredFields.totalRecords) * 100).toFixed(1)}%)`);
        console.log(`    - Missing Name: ${requiredFields.summary.missingName}`);
        console.log(`    - Missing Phone: ${requiredFields.summary.missingPhone}`);
        console.log(`    - Missing Email: ${requiredFields.summary.missingEmail}`);
        
        console.log(`  Phone Validation:`);
        console.log(`    - Valid: ${phoneValidation.validPhones}/${phoneValidation.totalRecords} (${((phoneValidation.validPhones / phoneValidation.totalRecords) * 100).toFixed(1)}%)`);
        console.log(`    - Critical Issues: ${phoneValidation.summary.critical}`);
        console.log(`    - Warnings: ${phoneValidation.summary.warning}`);
        
        console.log(`  Email Validation:`);
        console.log(`    - Valid: ${emailValidation.validEmails}/${emailValidation.totalRecords} (${((emailValidation.validEmails / emailValidation.totalRecords) * 100).toFixed(1)}%)`);
        console.log(`    - Critical Issues: ${emailValidation.summary.critical}`);
        console.log(`    - Need Manual Review: ${emailValidation.needsManualReview}`);
        
        console.log(`  Duplicate Detection:`);
        console.log(`    - Duplicate Groups: ${duplicateDetection.duplicatesFound}`);
        console.log(`    - Records Involved: ${duplicateDetection.summary.totalDuplicateRecords}`);
        console.log(`    - Need Manual Review: ${duplicateDetection.needsManualReview}`);
        
        console.log('\n📋 Next Steps:');
        console.log('  1. Check the reports directory for detailed validation reports');
        console.log('  2. Review manual-review-*.json for records needing attention');
        console.log('  3. Address critical validation failures');
        console.log('  4. Review and merge duplicate records');
        console.log('  5. Fill in missing required fields');
        
        console.log('\n✅ Cleanup example completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Cleanup example failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    runCleanupExample();
}

module.exports = { runCleanupExample };
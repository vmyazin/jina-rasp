/**
 * Example usage of the validation system with duplicate detection
 * Shows how to use required field, phone, email validators and duplicate detector together
 */

const RequiredFieldValidator = require('./required-field-validator');
const PhoneValidator = require('./phone-validator');
const EmailValidator = require('./email-validator');
const DuplicateDetector = require('./duplicate-detector');

// Example broker records with various issues including duplicates
const testBrokers = [
    {
        id: 'broker_1',
        name: 'Silva Seguros',
        phone: '85 97100-5622', // Needs standardization
        email: 'SILVA@GMAIL.COM' // Needs normalization
    },
    {
        id: 'broker_2',
        name: 'Silva Seguros',
        phone: '(85) 97100-5622', // Same phone as broker_1, different format
        email: 'silva@gmail.com' // Same email as broker_1, normalized
    },
    {
        id: 'broker_3',
        name: 'Costa Seguros',
        phone: '(85) 00000-0000', // Invalid phone
        email: 'costa@example.com' // Suspicious email
    },
    {
        id: 'broker_4',
        name: '', // Missing name
        phone: '(85) 98765-4321',
        email: '  costa@example.com  ' // Same email as broker_3, needs trimming
    },
    {
        id: 'broker_5',
        name: 'Santos Seguros',
        phone: '85.9abc7*1def00#', // Has invalid characters
        email: 'invalid-email' // Invalid email format
    },
    {
        id: 'broker_6',
        name: 'oliveira seguros', // Same name as broker_7, different case
        phone: '(85) 98765-4321',
        email: 'oliveira@hotmail.com'
    },
    {
        id: 'broker_7',
        name: 'Oliveira Seguros', // Same name as broker_6, different case
        phone: '(85) 95555-4444',
        email: 'oliveira2@hotmail.com'
    }
];

function validateBrokersWithDuplicates(brokers) {
    console.log('=== Comprehensive Broker Validation with Duplicate Detection ===\n');
    
    const requiredValidator = new RequiredFieldValidator();
    const phoneValidator = new PhoneValidator();
    const emailValidator = new EmailValidator();
    const duplicateDetector = new DuplicateDetector();
    
    // Step 1: Individual record validation
    console.log('Step 1: Individual Record Validation');
    console.log('====================================');
    
    const validationResults = [];
    
    brokers.forEach(broker => {
        console.log(`Validating: ${broker.name || 'Unnamed Broker'} (${broker.id})`);
        
        const result = {
            broker: broker,
            requiredFields: requiredValidator.validateRecord(broker),
            phone: phoneValidator.validatePhone(broker.phone),
            email: emailValidator.validateEmail(broker.email),
            overallValid: true,
            issues: []
        };
        
        // Check required fields
        if (!result.requiredFields.isValid) {
            result.overallValid = false;
            result.issues.push(`Missing required fields: ${result.requiredFields.missingFields.join(', ')}`);
        }
        
        // Check phone validation
        if (!result.phone.isValid) {
            result.overallValid = false;
            result.issues.push(`Phone issues: ${result.phone.issues.join(', ')}`);
        }
        
        // Check email validation
        if (!result.email.isValid) {
            result.overallValid = false;
            result.issues.push(`Email issues: ${result.email.issues.join(', ')}`);
        }
        
        // Show results
        console.log(`  Overall Valid: ${result.overallValid}`);
        console.log(`  Required Fields: ${result.requiredFields.isValid ? 'PASS' : 'FAIL'}`);
        console.log(`  Phone: ${result.phone.isValid ? 'PASS' : 'FAIL'}`);
        console.log(`  Email: ${result.email.isValid ? 'PASS' : 'FAIL'}`);
        
        if (result.phone.standardizedPhone && result.phone.originalPhone !== result.phone.standardizedPhone) {
            console.log(`  Phone Standardized: "${result.phone.originalPhone}" → "${result.phone.standardizedPhone}"`);
        }
        
        if (result.email.normalizedEmail && result.email.originalEmail !== result.email.normalizedEmail) {
            console.log(`  Email Normalized: "${result.email.originalEmail}" → "${result.email.normalizedEmail}"`);
        }
        
        if (result.issues.length > 0) {
            console.log(`  Issues: ${result.issues.join('; ')}`);
        }
        
        console.log('');
        validationResults.push(result);
    });
    
    // Step 2: Duplicate detection
    console.log('Step 2: Duplicate Detection');
    console.log('===========================');
    
    const duplicateResults = duplicateDetector.findDuplicates(brokers);
    
    console.log(`Total Records: ${duplicateResults.totalRecords}`);
    console.log(`Duplicate Groups Found: ${duplicateResults.duplicatesFound}`);
    console.log(`Records Involved in Duplicates: ${duplicateResults.summary.totalDuplicateRecords}`);
    console.log(`Phone Matches: ${duplicateResults.summary.phoneMatches}`);
    console.log(`Email Matches: ${duplicateResults.summary.emailMatches}`);
    console.log(`Name Matches: ${duplicateResults.summary.nameMatches}`);
    console.log(`Manual Review Needed: ${duplicateResults.needsManualReview}\n`);
    
    // Show duplicate groups
    if (duplicateResults.duplicateGroups.length > 0) {
        console.log('Duplicate Groups Found:');
        duplicateResults.duplicateGroups.forEach((group, index) => {
            console.log(`\nGroup ${index + 1} [${group.reviewType.toUpperCase()}]:`);
            console.log(`  Reason: ${group.reason}`);
            console.log(`  Records:`);
            group.records.forEach(record => {
                console.log(`    - ${record.id}: "${record.name}" | ${record.phone} | ${record.email}`);
            });
            
            // Show merge suggestion
            const suggestion = duplicateDetector.suggestMerge(group);
            if (suggestion) {
                console.log(`  Merge Suggestion: Keep ${suggestion.primaryRecord.id} (${suggestion.completenessScore.toFixed(1)}% complete)`);
            }
        });
        console.log('');
    }
    
    // Step 3: Combined summary
    console.log('Step 3: Combined Validation Summary');
    console.log('==================================');
    
    const validCount = validationResults.filter(r => r.overallValid).length;
    const invalidCount = validationResults.length - validCount;
    const duplicateCount = duplicateResults.summary.totalDuplicateRecords;
    
    console.log(`Total Records: ${brokers.length}`);
    console.log(`Valid Records: ${validCount} (${((validCount / brokers.length) * 100).toFixed(1)}%)`);
    console.log(`Invalid Records: ${invalidCount}`);
    console.log(`Duplicate Records: ${duplicateCount} (${((duplicateCount / brokers.length) * 100).toFixed(1)}%)`);
    
    // Step 4: Action items
    console.log('\nStep 4: Action Items');
    console.log('===================');
    
    // Records needing validation fixes
    const needsValidationFix = validationResults.filter(r => !r.overallValid);
    if (needsValidationFix.length > 0) {
        console.log(`\nRecords Needing Validation Fixes (${needsValidationFix.length}):`);
        needsValidationFix.forEach(result => {
            console.log(`- ${result.broker.name || 'Unnamed'} (${result.broker.id}): ${result.issues.join('; ')}`);
        });
    }
    
    // Auto-mergeable duplicates
    const autoGroups = duplicateDetector.getAutoMergeableGroups(duplicateResults);
    if (autoGroups.length > 0) {
        console.log(`\nAuto-Mergeable Duplicates (${autoGroups.length} groups):`);
        autoGroups.forEach((group, index) => {
            const suggestion = duplicateDetector.suggestMerge(group);
            console.log(`- Group ${index + 1}: ${group.reason}`);
            console.log(`  → Keep ${suggestion.primaryRecord.id}, merge ${suggestion.duplicateRecords.map(r => r.id).join(', ')}`);
        });
    }
    
    // Manual review needed
    const manualGroups = duplicateDetector.getManualReviewGroups(duplicateResults);
    if (manualGroups.length > 0) {
        console.log(`\nDuplicates Needing Manual Review (${manualGroups.length} groups):`);
        manualGroups.forEach((group, index) => {
            console.log(`- Group ${index + 1}: ${group.reason}`);
            console.log(`  Records: ${group.records.map(r => `${r.id} (${r.name})`).join(', ')}`);
        });
    }
    
    // Step 5: Standardized data for database update
    console.log('\nStep 5: Standardized Data for Database Update');
    console.log('=============================================');
    
    const standardizedRecords = validationResults
        .filter(r => r.overallValid) // Only valid records
        .filter(r => 
            (r.phone.isValid && r.phone.originalPhone !== r.phone.standardizedPhone) ||
            (r.email.isValid && r.email.originalEmail !== r.email.normalizedEmail)
        )
        .map(r => ({
            id: r.broker.id,
            name: r.broker.name,
            originalPhone: r.phone.originalPhone,
            standardizedPhone: r.phone.standardizedPhone,
            originalEmail: r.email.originalEmail,
            normalizedEmail: r.email.normalizedEmail
        }));
    
    if (standardizedRecords.length > 0) {
        console.log(`Records with standardized data (${standardizedRecords.length}):`);
        standardizedRecords.forEach(record => {
            if (record.originalPhone !== record.standardizedPhone) {
                console.log(`- ${record.name} Phone: "${record.originalPhone}" → "${record.standardizedPhone}"`);
            }
            if (record.originalEmail !== record.normalizedEmail) {
                console.log(`- ${record.name} Email: "${record.originalEmail}" → "${record.normalizedEmail}"`);
            }
        });
    } else {
        console.log('No records need standardization updates.');
    }
    
    return {
        validationResults,
        duplicateResults,
        summary: {
            totalRecords: brokers.length,
            validRecords: validCount,
            invalidRecords: invalidCount,
            duplicateRecords: duplicateCount,
            autoMergeableGroups: autoGroups.length,
            manualReviewGroups: manualGroups.length,
            standardizedRecords: standardizedRecords.length
        }
    };
}

// Run the comprehensive validation
if (require.main === module) {
    validateBrokersWithDuplicates(testBrokers);
}

module.exports = { validateBrokersWithDuplicates, testBrokers };
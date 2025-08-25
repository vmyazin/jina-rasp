/**
 * Example usage of the validation system
 * Shows how to use required field, phone, and email validators together
 */

const RequiredFieldValidator = require('./required-field-validator');
const PhoneValidator = require('./phone-validator');
const EmailValidator = require('./email-validator');

// Example broker records with various issues
const testBrokers = [
    {
        id: 'broker_1',
        name: 'Silva Seguros',
        phone: '85 97100-5622', // Needs standardization
        email: 'SILVA@GMAIL.COM' // Needs normalization
    },
    {
        id: 'broker_2',
        name: 'Costa Seguros',
        phone: '(85) 00000-0000', // Invalid phone
        email: 'costa@example.com' // Suspicious email
    },
    {
        id: 'broker_3',
        name: '', // Missing name
        phone: '(85) 97100-5622',
        email: '  empty@uol.com.br  ' // Needs trimming
    },
    {
        id: 'broker_4',
        name: 'Santos Seguros',
        phone: '85.9abc7*1def00#', // Has invalid characters
        email: 'invalid-email' // Invalid email format
    },
    {
        id: 'broker_5',
        name: 'Oliveira Seguros',
        phone: '(85) 98765-4321',
        email: 'test@test.com' // Suspicious test email
    }
];

function validateBrokers(brokers) {
    console.log('=== Comprehensive Broker Validation ===\n');
    
    const requiredValidator = new RequiredFieldValidator();
    const phoneValidator = new PhoneValidator();
    const emailValidator = new EmailValidator();
    
    const results = [];
    
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
        
        if (result.email.needsManualReview) {
            console.log(`  Email Needs Review: ${result.email.issues.join(', ')}`);
        }
        
        if (result.issues.length > 0) {
            console.log(`  Issues: ${result.issues.join('; ')}`);
        }
        
        console.log('');
        results.push(result);
    });
    
    // Summary
    const validCount = results.filter(r => r.overallValid).length;
    const invalidCount = results.length - validCount;
    
    console.log('=== Validation Summary ===');
    console.log(`Total Records: ${results.length}`);
    console.log(`Valid Records: ${validCount} (${((validCount / results.length) * 100).toFixed(1)}%)`);
    console.log(`Invalid Records: ${invalidCount}`);
    
    // Show records that need attention
    const needsAttention = results.filter(r => !r.overallValid);
    if (needsAttention.length > 0) {
        console.log('\nRecords Needing Attention:');
        needsAttention.forEach(result => {
            console.log(`- ${result.broker.name || 'Unnamed'} (${result.broker.id}): ${result.issues.join('; ')}`);
        });
    }
    
    // Show standardized records for database update
    const standardizedRecords = results
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
        console.log('\nRecords with Standardized Data (for database update):');
        standardizedRecords.forEach(record => {
            if (record.originalPhone !== record.standardizedPhone) {
                console.log(`- ${record.name} Phone: "${record.originalPhone}" → "${record.standardizedPhone}"`);
            }
            if (record.originalEmail !== record.normalizedEmail) {
                console.log(`- ${record.name} Email: "${record.originalEmail}" → "${record.normalizedEmail}"`);
            }
        });
    }
    
    // Show records needing manual review
    const needsReview = results.filter(r => r.email.needsManualReview);
    if (needsReview.length > 0) {
        console.log('\nRecords Needing Manual Email Review:');
        needsReview.forEach(result => {
            console.log(`- ${result.broker.name || 'Unnamed'} (${result.broker.id}): ${result.email.issues.join(', ')}`);
        });
    }
    
    return results;
}

// Run the validation
validateBrokers(testBrokers);
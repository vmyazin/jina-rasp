/**
 * Test Email Validator
 * 
 * Test the EmailValidator with various email formats and edge cases
 */

const EmailValidator = require('./email-validator');

function runEmailValidatorTests() {
    console.log('🧪 Testing Email Validator...\n');
    
    const validator = new EmailValidator();
    
    // Test cases with expected results
    const testCases = [
        // Valid emails
        { email: 'user@example.com', shouldBeValid: true, description: 'Basic valid email' },
        { email: 'USER@EXAMPLE.COM', shouldBeValid: true, description: 'Uppercase email (should normalize)' },
        { email: '  user@example.com  ', shouldBeValid: true, description: 'Email with whitespace (should normalize)' },
        { email: 'user.name@example.com', shouldBeValid: true, description: 'Email with dot in local part' },
        { email: 'user+tag@example.com', shouldBeValid: true, description: 'Email with plus sign' },
        { email: 'user_name@example.com', shouldBeValid: true, description: 'Email with underscore' },
        { email: 'user123@example.com', shouldBeValid: true, description: 'Email with numbers' },
        { email: 'user@subdomain.example.com', shouldBeValid: true, description: 'Email with subdomain' },
        { email: 'user@example.co.uk', shouldBeValid: true, description: 'Email with country TLD' },
        { email: 'user@example-domain.com', shouldBeValid: true, description: 'Email with hyphen in domain' },
        
        // Brazilian email providers
        { email: 'user@gmail.com', shouldBeValid: true, description: 'Gmail address' },
        { email: 'user@uol.com.br', shouldBeValid: true, description: 'UOL Brazilian email' },
        { email: 'user@terra.com.br', shouldBeValid: true, description: 'Terra Brazilian email' },
        { email: 'user@hotmail.com', shouldBeValid: true, description: 'Hotmail address' },
        
        // Invalid emails
        { email: '', shouldBeValid: false, description: 'Empty email' },
        { email: '   ', shouldBeValid: false, description: 'Whitespace only email' },
        { email: null, shouldBeValid: false, description: 'Null email' },
        { email: undefined, shouldBeValid: false, description: 'Undefined email' },
        { email: 'invalid-email', shouldBeValid: false, description: 'Email without @ symbol' },
        { email: '@example.com', shouldBeValid: false, description: 'Email without local part' },
        { email: 'user@', shouldBeValid: false, description: 'Email without domain' },
        { email: 'user@.com', shouldBeValid: false, description: 'Email with missing domain name' },
        { email: 'user@example', shouldBeValid: false, description: 'Email without TLD' },
        { email: 'user..name@example.com', shouldBeValid: false, description: 'Email with consecutive dots' },
        { email: '.user@example.com', shouldBeValid: false, description: 'Email starting with dot' },
        { email: 'user.@example.com', shouldBeValid: false, description: 'Email ending with dot' },
        { email: 'user@example..com', shouldBeValid: false, description: 'Domain with consecutive dots' },
        
        // Suspicious emails (valid format but suspicious)
        { email: 'test@test.com', shouldBeValid: true, description: 'Suspicious test email', shouldNeedReview: true },
        { email: 'example@example.com', shouldBeValid: true, description: 'Suspicious example email', shouldNeedReview: true },
        { email: 'noemail@noemail.com', shouldBeValid: true, description: 'Suspicious noemail', shouldNeedReview: true },
        { email: 'fake@fake.com', shouldBeValid: true, description: 'Suspicious fake email', shouldNeedReview: true },
        
        // Edge cases
        { email: 'a@b.co', shouldBeValid: true, description: 'Very short valid email' },
        { email: 'user@123.456.789.012', shouldBeValid: false, description: 'Email with IP-like domain (invalid)' },
        { email: 'user@[192.168.1.1]', shouldBeValid: false, description: 'Email with IP address in brackets' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    console.log('Running individual email validation tests:\n');
    
    testCases.forEach((testCase, index) => {
        const result = validator.validateEmail(testCase.email);
        const isValid = result.isValid;
        const needsReview = result.needsManualReview;
        
        let testPassed = true;
        let failureReason = '';
        
        // Check validity expectation
        if (isValid !== testCase.shouldBeValid) {
            testPassed = false;
            failureReason = `Expected valid: ${testCase.shouldBeValid}, got: ${isValid}`;
        }
        
        // Check manual review expectation if specified
        if (testCase.shouldNeedReview !== undefined && needsReview !== testCase.shouldNeedReview) {
            testPassed = false;
            failureReason += (failureReason ? '; ' : '') + `Expected needsReview: ${testCase.shouldNeedReview}, got: ${needsReview}`;
        }
        
        if (testPassed) {
            console.log(`✅ Test ${index + 1}: ${testCase.description}`);
            if (result.originalEmail !== result.normalizedEmail) {
                console.log(`   📝 Normalized: "${result.originalEmail}" → "${result.normalizedEmail}"`);
            }
            if (result.issues.length > 0) {
                console.log(`   ⚠️  Issues: ${result.issues.join(', ')}`);
            }
            passed++;
        } else {
            console.log(`❌ Test ${index + 1}: ${testCase.description}`);
            console.log(`   💥 ${failureReason}`);
            console.log(`   📧 Email: "${testCase.email}"`);
            console.log(`   📊 Result: valid=${isValid}, needsReview=${needsReview}`);
            console.log(`   📝 Issues: ${result.issues.join(', ')}`);
            failed++;
        }
    });
    
    console.log(`\n📊 Individual Tests Summary: ${passed} passed, ${failed} failed\n`);
    
    // Test batch validation
    console.log('Testing batch validation:\n');
    
    const sampleRecords = [
        { id: 1, name: 'João Silva', email: 'joao@gmail.com' },
        { id: 2, name: 'Maria Santos', email: 'MARIA@UOL.COM.BR' },
        { id: 3, name: 'Pedro Costa', email: '  pedro@terra.com.br  ' },
        { id: 4, name: 'Ana Lima', email: 'invalid-email' },
        { id: 5, name: 'Carlos Souza', email: 'test@test.com' },
        { id: 6, name: 'Lucia Oliveira', email: '' },
        { id: 7, name: 'Roberto Alves', email: 'roberto@example..com' },
        { id: 8, name: 'Fernanda Rocha', email: 'fernanda+work@hotmail.com' }
    ];
    
    const batchResults = validator.validateBatch(sampleRecords);
    
    console.log('Batch Validation Results:');
    console.log(`📊 Total Records: ${batchResults.totalRecords}`);
    console.log(`✅ Valid Emails: ${batchResults.validEmails}`);
    console.log(`❌ Invalid Emails: ${batchResults.invalidEmails}`);
    console.log(`📝 Normalized Emails: ${batchResults.normalizedEmails}`);
    console.log(`👀 Need Manual Review: ${batchResults.needsManualReview}`);
    
    console.log('\n📋 Detailed Report:');
    console.log(validator.generateReport(batchResults));
    
    // Test normalized records
    console.log('Testing normalized records output:\n');
    const normalizedRecords = validator.getNormalizedRecords(sampleRecords);
    normalizedRecords.forEach(record => {
        if (record.emailValidation.wasNormalized) {
            console.log(`📝 Record ${record.id}: "${record.emailValidation.originalEmail || 'N/A'}" → "${record.email}"`);
        }
    });
    
    // Test records needing review
    console.log('\nRecords needing manual review:\n');
    const reviewRecords = validator.getRecordsNeedingReview(sampleRecords);
    reviewRecords.forEach(item => {
        console.log(`👀 Record ${item.recordId}: "${item.validation.originalEmail}" - ${item.validation.issues.join(', ')}`);
    });
    
    console.log('\n🎉 Email Validator testing completed!');
    
    return {
        individualTests: { passed, failed },
        batchResults
    };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runEmailValidatorTests();
}

module.exports = { runEmailValidatorTests };
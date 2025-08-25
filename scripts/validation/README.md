# Data Validation Scripts

This directory contains validation scripts for the Insurance Broker Directory data quality pipeline.

## Available Validators

### 1. Required Field Validator
Validates that broker records contain all required fields: name, phone, and email.

### 2. Phone Number Cleanup Validator
- Validates and standardizes Brazilian phone numbers
- Removes invalid characters (letters, special chars except -, (), spaces)
- Standardizes to consistent format: (XX) XXXXX-XXXX
- Flags obviously invalid numbers (too short/long, all zeros, repetitive patterns)
- Supports both mobile (9 digits) and landline (8 digits) formats

### 3. Email Format Validator
- Basic email regex validation
- Converts to lowercase and trims whitespace
- Flags malformed emails for manual review
- Detects suspicious placeholder emails (test@test.com, example@example.com)
- Identifies critical format issues (consecutive dots, missing TLD)

### 4. Simple Duplicate Detection ✨ NEW
- Matches on identical phone numbers or emails
- Flags exact name matches for manual review
- No complex similarity algorithms - keeps it simple
- Suggests merge strategies based on data completeness
- Separates auto-mergeable duplicates from manual review cases

## Usage

### Required Field Validation
```bash
node scripts/validation/validate-existing-data.js
```

### Phone Number Validation
```javascript
const PhoneValidator = require('./scripts/validation/phone-validator');

const validator = new PhoneValidator();

// Validate and clean single phone number
const result = validator.validatePhone(phoneNumber);
console.log(result.isValid); // true/false
console.log(result.standardizedPhone); // cleaned format: (XX) XXXXX-XXXX
console.log(result.issues); // array of issues found

// Validate multiple records
const batchResults = validator.validateBatch(brokerRecords);

// Get standardized records for database update
const standardizedRecords = validator.getStandardizedRecords(brokerRecords);
```

### Email Format Validation
```javascript
const EmailValidator = require('./scripts/validation/email-validator');

const validator = new EmailValidator();

// Validate and normalize single email
const result = validator.validateEmail(emailAddress);
console.log(result.isValid); // true/false
console.log(result.normalizedEmail); // cleaned format: lowercase, trimmed
console.log(result.needsManualReview); // true if suspicious or has issues
console.log(result.issues); // array of issues found

// Validate multiple records
const batchResults = validator.validateBatch(brokerRecords);

// Get normalized records for database update
const normalizedRecords = validator.getNormalizedRecords(brokerRecords);

// Get records needing manual review
const reviewRecords = validator.getRecordsNeedingReview(brokerRecords);
```

### Duplicate Detection
```javascript
const DuplicateDetector = require('./scripts/validation/duplicate-detector');

const detector = new DuplicateDetector();

// Find duplicates in a batch of records
const results = detector.findDuplicates(brokerRecords);
console.log(results.duplicatesFound); // number of duplicate groups
console.log(results.summary); // phone/email/name match counts

// Get auto-mergeable groups (phone/email matches)
const autoGroups = detector.getAutoMergeableGroups(results);

// Get groups needing manual review (name matches)
const manualGroups = detector.getManualReviewGroups(results);

// Get merge suggestions for duplicate groups
results.duplicateGroups.forEach(group => {
    const suggestion = detector.suggestMerge(group);
    console.log(`Keep ${suggestion.primaryRecord.id}, merge others`);
});

// Generate detailed report
const report = detector.generateReport(results);
console.log(report);
```

### Combined Validation
```javascript
// See example-usage-with-duplicates.js for comprehensive validation workflow
const RequiredFieldValidator = require('./scripts/validation/required-field-validator');
const PhoneValidator = require('./scripts/validation/phone-validator');
const EmailValidator = require('./scripts/validation/email-validator');
const DuplicateDetector = require('./scripts/validation/duplicate-detector');

// Validate required fields, phone format, email format, and find duplicates together
```

## Testing

Run the test scripts to verify validator functionality:

```bash
# Test required field validator
node scripts/validation/test-required-validator.js

# Test phone validator
node scripts/validation/test-phone-validator.js

# Test email validator
node scripts/validation/test-email-validator.js

# Test duplicate detector
node scripts/validation/test-duplicate-detector.js

# Test with real broker data
node scripts/validation/test-real-data.js

# See comprehensive validation example
node scripts/validation/example-usage.js

# See validation with duplicate detection
node scripts/validation/example-usage-with-duplicates.js
```

## Phone Number Formats

### Supported Input Formats (automatically cleaned):
- `(85) 97100-5622` - Already standardized ✅
- `85 97100-5622` - Missing parentheses → `(85) 97100-5622`
- `85971005622` - No formatting → `(85) 97100-5622`
- `+5585971005622` - With country code → `(85) 97100-5622`
- `(85) 3456-7890` - Landline format ✅
- `(85) 9.7100*5622#` - With invalid characters → `(85) 97100-5622`

### Phone Validation Rules:
- ✅ Brazilian area codes (11-99)
- ✅ Mobile numbers (9 digits after area code)
- ✅ Landline numbers (8 digits after area code)
- ❌ Obviously invalid patterns (all zeros, all same digit, very obvious sequences)
- ❌ Invalid area codes (< 11 or > 99)
- ❌ Wrong length (< 10 or > 13 digits total)

## Email Formats

### Supported Input Formats (automatically normalized):
- `USER@EXAMPLE.COM` - Uppercase → `user@example.com`
- `  user@example.com  ` - With whitespace → `user@example.com`
- `User.Name@Domain.Com` - Mixed case → `user.name@domain.com`

### Email Validation Rules:
- ✅ Basic RFC-compliant email format
- ✅ Common Brazilian email providers (gmail.com, uol.com.br, terra.com.br, etc.)
- ✅ International domains with proper TLD
- ❌ Missing @ symbol or domain
- ❌ Consecutive dots (user..name@domain.com)
- ❌ Dots at start/end of local part (.user@domain.com)
- ❌ Missing TLD (user@domain)
- ⚠️ Suspicious patterns (test@test.com, example@example.com, fake@fake.com)

## Current Status

### Required Fields (Last Run)
- **Total Records**: 100
- **Valid Records**: 93 (93.0%)
- **Invalid Records**: 7
  - Missing Phone: 3 records
  - Missing Email: 5 records
  - Missing Both: 1 record

### Phone Numbers (Real Data Test)
- **Total Records**: 10 (sample)
- **Valid Phones**: 10 (100.0%)
- **Invalid Phones**: 0
- **Cleaned/Standardized**: 0 (already in correct format)

All records have names, which is good. The 7 invalid records need manual attention to add missing contact information.
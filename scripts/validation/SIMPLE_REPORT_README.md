# Simple Validation Report

A unified validation reporting system that generates JSON reports with validation results, issue counts, and records needing attention. No fancy dashboards or alerts - just simple, actionable data.

## Features

- **Unified Validation**: Combines all validation tools (required fields, email, phone, completeness, duplicates)
- **JSON Output**: Machine-readable validation results with detailed breakdown
- **Issue Counting**: Count of issues by type for easy analysis
- **Priority Ranking**: Records sorted by severity (CRITICAL, HIGH, MEDIUM, LOW)
- **Simple Reports**: Human-readable summary alongside JSON data
- **No Dependencies**: Works with existing validation infrastructure

## Quick Start

### Generate Report from File Data

```bash
# Generate report from consolidated_brokers.json
node generate-simple-report.js file
```

### Generate Report from Database

```bash
# Generate report from Supabase database (limit 100 records)
node generate-simple-report.js database

# Generate report with custom limit
node generate-simple-report.js database --limit=50
```

### Programmatic Usage

```javascript
const SimpleValidationReporter = require('./simple-validation-reporter');

const reporter = new SimpleValidationReporter();
const records = [...]; // Your broker records

// Generate validation report
const report = await reporter.generateValidationReport(records);

// Save to files
const filePaths = await reporter.saveReport(report);
console.log('Report saved:', filePaths.json);
```

## Report Structure

### JSON Report Format

```json
{
  "metadata": {
    "generatedAt": "2025-08-25T22:48:42.786Z",
    "totalRecords": 10,
    "reportVersion": "1.0"
  },
  "summary": {
    "totalIssues": 5,
    "recordsNeedingAttention": 3,
    "recordsWithNoIssues": 7
  },
  "issuesByType": {
    "missingRequiredFields": 1,
    "invalidEmails": 2,
    "invalidPhones": 1,
    "lowCompleteness": 1,
    "potentialDuplicates": 0
  },
  "validationResults": {
    "requiredFields": { /* detailed results */ },
    "emails": { /* detailed results */ },
    "phones": { /* detailed results */ },
    "completeness": { /* detailed results */ },
    "duplicates": { /* detailed results */ }
  },
  "recordsNeedingAttention": [
    {
      "recordId": "broker_123",
      "name": "Problem Broker",
      "phone": "(85) 99999-9999",
      "email": "contact@broker.com",
      "severity": "CRITICAL",
      "issues": [
        {
          "type": "missing_required_fields",
          "description": "Missing: email",
          "severity": "CRITICAL"
        }
      ]
    }
  ]
}
```

### Issue Types

- **missingRequiredFields**: Records missing name, phone, or email
- **invalidEmails**: Records with malformed email addresses
- **invalidPhones**: Records with invalid phone number formats
- **lowCompleteness**: Records with <50% field completeness
- **potentialDuplicates**: Records that may be duplicates

### Severity Levels

- **CRITICAL**: Missing required fields (name, phone, email)
- **HIGH**: Invalid email or phone formats
- **MEDIUM**: Low completeness or potential duplicates
- **LOW**: Minor issues

## Files Generated

Each report generates two files:

1. **JSON Report** (`*-report.json`): Complete validation data
2. **Summary Report** (`*-summary.txt`): Human-readable overview

## Examples

### Run Example with Test Data

```bash
node example-simple-report.js
```

### Run Tests

```bash
node test-simple-reporter.js
```

## Integration

### With Existing Scripts

The simple validation reporter integrates with existing validation tools:

- `required-field-validator.js`
- `email-validator.js`
- `phone-validator.js`
- `completeness-scorer.js`
- `duplicate-detector.js`

### With Data Import Process

Add validation reporting to your data import:

```javascript
const SimpleValidationReporter = require('./simple-validation-reporter');

// After processing records
const reporter = new SimpleValidationReporter();
const report = await reporter.generateValidationReport(processedRecords);

// Save validation report
await reporter.saveReport(report, 'import-validation-report');

// Check for critical issues
if (report.issuesByType.missingRequiredFields > 0) {
    console.warn('Critical validation issues found!');
}
```

## Command Line Options

### generate-simple-report.js

```bash
# Show help
node generate-simple-report.js --help

# Generate from file (default)
node generate-simple-report.js file

# Generate from database
node generate-simple-report.js database

# Limit database records
node generate-simple-report.js database --limit=25
```

## Output Location

All reports are saved to: `scripts/validation/reports/`

Files are named with timestamps to avoid conflicts:
- `file-validation-report.json`
- `database-validation-report.json`
- `example-validation-report.json`

## Use Cases

### Data Quality Monitoring

Generate regular reports to track data quality over time:

```bash
# Weekly data quality check
node generate-simple-report.js database --limit=1000 > weekly-quality.log
```

### Import Validation

Validate data after import processes:

```bash
# After running consolidate_data.js
node generate-simple-report.js file
```

### Issue Prioritization

Use severity levels to prioritize data cleanup:

1. Fix CRITICAL issues first (missing required fields)
2. Address HIGH issues (invalid formats)
3. Improve MEDIUM issues (completeness, duplicates)

### Automated Reporting

Integrate into CI/CD or scheduled tasks:

```bash
#!/bin/bash
# Daily data quality report
cd /path/to/project/scripts/validation
node generate-simple-report.js database --limit=500
# Email or upload reports as needed
```

## Troubleshooting

### No Records Found

- Check file path: `../data/consolidated_brokers.json`
- Verify database connection in `.env` file
- Ensure records exist in `insurance_brokers` table

### Validation Errors

- Check that all validator dependencies are installed
- Verify record format matches expected schema
- Review error messages in console output

### Performance Issues

- Use `--limit` parameter for large datasets
- Run reports during off-peak hours
- Consider batch processing for very large datasets

## Related Files

- `simple-validation-reporter.js` - Main reporter class
- `generate-simple-report.js` - Command-line interface
- `example-simple-report.js` - Usage examples
- `test-simple-reporter.js` - Unit tests
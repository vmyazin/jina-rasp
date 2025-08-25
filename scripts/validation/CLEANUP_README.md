# Database Cleanup Script

This directory contains the one-time database cleanup script that validates all existing broker records and applies simple fixes for common data quality issues.

## Overview

The cleanup script performs the following operations:

1. **Fetches all records** from the `insurance_brokers` table
2. **Runs comprehensive validation** using existing validators:
   - Required field validation (name, phone, email)
   - Phone number format validation and standardization
   - Email format validation and normalization
   - Duplicate detection
3. **Applies simple fixes** automatically:
   - Standardizes phone numbers to `(XX) XXXXX-XXXX` format
   - Normalizes email addresses (lowercase, trim whitespace)
4. **Updates the database** with corrected data
5. **Generates detailed reports** of all issues found
6. **Creates manual review list** for issues requiring human attention

## Files

- `cleanup-database.js` - Main cleanup script
- `example-cleanup-usage.js` - Usage example
- `test-cleanup.js` - Test script with sample data
- `CLEANUP_README.md` - This documentation

## Usage

### 1. Test the Script First

Before running on production data, test with sample data:

```bash
node scripts/validation/test-cleanup.js
```

This will run the cleanup process on test data to verify everything works correctly.

### 2. Run the Cleanup

Execute the cleanup on your actual database:

```bash
node scripts/validation/cleanup-database.js
```

### 3. Review the Results

The script generates several report files in `scripts/validation/reports/`:

- `cleanup-summary-[timestamp].txt` - Overall summary of the cleanup
- `required-fields-[timestamp].txt` - Detailed required field validation report
- `phone-validation-[timestamp].txt` - Phone number validation report
- `email-validation-[timestamp].txt` - Email validation report
- `duplicate-detection-[timestamp].txt` - Duplicate detection report
- `manual-review-[timestamp].json` - List of records needing manual attention
- `cleanup-results-[timestamp].json` - Complete results in JSON format

## What Gets Fixed Automatically

The script automatically fixes these issues:

✅ **Phone Number Standardization**
- `85999998888` → `(85) 99999-8888`
- `(85)99999-8888` → `(85) 99999-8888`
- `+5585999998888` → `(85) 99999-8888`

✅ **Email Normalization**
- `  JOHN@GMAIL.COM  ` → `john@gmail.com`
- `Mary@Hotmail.COM` → `mary@hotmail.com`

## What Requires Manual Review

These issues are flagged for manual attention:

⚠️ **Critical Issues**
- Missing required fields (name, phone, email)
- Invalid phone numbers (too short/long, obviously fake)
- Invalid email formats
- Suspicious/placeholder emails

⚠️ **Duplicate Records**
- Identical phone numbers or emails (can be auto-merged)
- Identical names (need manual review)

## Example Output

```
🧹 Starting database cleanup process...
📊 Fetching all broker records...
   Found 150 records to process
🔍 Running validation checks...
   ✓ Running required field validation...
   ✓ Running phone number validation...
   ✓ Running email validation...
   ✓ Running duplicate detection...
🔧 Applying simple fixes...
   ✓ 23 phone numbers standardized
   ✓ 15 email addresses normalized
   ✓ 38 records ready for update
💾 Updating database with fixes...
   ✓ 38 records updated successfully
📋 Generating reports...
   ✓ Reports generated:
     - summary: scripts/validation/reports/cleanup-summary-2024-01-15T10-30-00-000Z.txt
     - manualReview: scripts/validation/reports/manual-review-2024-01-15T10-30-00-000Z.json
✅ Cleanup completed in 3.45 seconds

📊 CLEANUP SUMMARY:
   Total Records: 150
   Records Updated: 38
   Phone Numbers Fixed: 23
   Email Addresses Fixed: 15
   Processing Time: 3.45s
```

## Environment Requirements

Make sure your `.env` file contains:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The script uses the service role key to have full database access for updates.

## Safety Features

- **Non-destructive**: Only fixes obvious formatting issues
- **Backup tracking**: Original values are preserved in validation results
- **Detailed logging**: All changes are logged and reported
- **Manual review**: Complex issues are flagged for human review
- **Test mode**: Test script available to verify functionality

## Integration with Existing System

After running the cleanup, you can integrate validation into your data import process by updating `consolidate_data.js` to use the validation components (Task 4.1 in the simplified tasks).

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `.env` file has correct Supabase credentials
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not the placeholder)

2. **Permission Errors**
   - Make sure you're using the service role key, not the anon key
   - Check that RLS policies allow updates

3. **No Records Found**
   - Verify the `insurance_brokers` table exists and has data
   - Check the table name matches the schema

### Getting Help

If you encounter issues:

1. Run the test script first: `node scripts/validation/test-cleanup.js`
2. Check the generated reports for detailed error information
3. Review the console output for specific error messages
4. Ensure all validation dependencies are properly installed

## Next Steps

After running the cleanup:

1. Review the manual review JSON file for records needing attention
2. Address critical validation failures
3. Review and merge duplicate records
4. Fill in missing required fields
5. Consider integrating validation into your data import process (Task 4.1)
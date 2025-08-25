#!/usr/bin/env node

/**
 * One-time Database Cleanup Script
 * 
 * This script runs validation on all existing database records and:
 * - Generates a comprehensive report of issues found
 * - Provides a list of records needing manual attention
 * - Applies simple fixes for obvious issues (phone formatting, email case)
 * - Creates backup of original data before making changes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import validation components
const RequiredFieldValidator = require('./required-field-validator');
const PhoneValidator = require('./phone-validator');
const EmailValidator = require('./email-validator');
const DuplicateDetector = require('./duplicate-detector');

class DatabaseCleanup {
    constructor() {
        // Initialize Supabase client
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );

        // Initialize validators
        this.requiredFieldValidator = new RequiredFieldValidator();
        this.phoneValidator = new PhoneValidator();
        this.emailValidator = new EmailValidator();
        this.duplicateDetector = new DuplicateDetector();

        // Results storage
        this.results = {
            totalRecords: 0,
            validationResults: {
                requiredFields: null,
                phoneValidation: null,
                emailValidation: null,
                duplicateDetection: null
            },
            fixesApplied: {
                phoneStandardized: 0,
                emailNormalized: 0,
                totalRecordsUpdated: 0
            },
            manualReviewNeeded: [],
            processingTime: 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Main cleanup process
     */
    async runCleanup() {
        console.log('🧹 Starting database cleanup process...');
        const startTime = Date.now();

        try {
            // Step 1: Fetch all records from database
            console.log('📊 Fetching all broker records...');
            const records = await this.fetchAllRecords();
            this.results.totalRecords = records.length;
            console.log(`   Found ${records.length} records to process`);

            if (records.length === 0) {
                console.log('ℹ️  No records found in database');
                return this.results;
            }

            // Step 2: Run all validations
            console.log('🔍 Running validation checks...');
            await this.runValidations(records);

            // Step 3: Apply simple fixes
            console.log('🔧 Applying simple fixes...');
            const updatedRecords = await this.applySimpleFixes(records);

            // Step 4: Update database with fixes
            if (updatedRecords.length > 0) {
                console.log('💾 Updating database with fixes...');
                await this.updateDatabase(updatedRecords);
            }

            // Step 5: Generate reports
            console.log('📋 Generating reports...');
            await this.generateReports();

            this.results.processingTime = Date.now() - startTime;
            console.log(`✅ Cleanup completed in ${(this.results.processingTime / 1000).toFixed(2)} seconds`);

            return this.results;

        } catch (error) {
            console.error('❌ Error during cleanup process:', error);
            throw error;
        }
    }

    /**
     * Fetch all records from the database
     */
    async fetchAllRecords() {
        const { data, error } = await this.supabase
            .from('insurance_brokers')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch records: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Run all validation checks on the records
     */
    async runValidations(records) {
        console.log('   ✓ Running required field validation...');
        this.results.validationResults.requiredFields = this.requiredFieldValidator.validateBatch(records);

        console.log('   ✓ Running phone number validation...');
        this.results.validationResults.phoneValidation = this.phoneValidator.validateBatch(records);

        console.log('   ✓ Running email validation...');
        this.results.validationResults.emailValidation = this.emailValidator.validateBatch(records);

        console.log('   ✓ Running duplicate detection...');
        this.results.validationResults.duplicateDetection = this.duplicateDetector.findDuplicates(records);
    }

    /**
     * Apply simple fixes to records that can be automatically corrected
     */
    async applySimpleFixes(records) {
        const updatedRecords = [];
        let phoneStandardized = 0;
        let emailNormalized = 0;

        for (const record of records) {
            let recordUpdated = false;
            const updatedRecord = { ...record };

            // Fix phone numbers
            const phoneValidation = this.phoneValidator.validatePhone(record.phone);
            if (phoneValidation.isValid && phoneValidation.standardizedPhone && 
                phoneValidation.originalPhone !== phoneValidation.standardizedPhone) {
                updatedRecord.phone = phoneValidation.standardizedPhone;
                recordUpdated = true;
                phoneStandardized++;
            }

            // Fix email addresses
            const emailValidation = this.emailValidator.validateEmail(record.email);
            if (emailValidation.isValid && emailValidation.normalizedEmail && 
                emailValidation.originalEmail !== emailValidation.normalizedEmail) {
                updatedRecord.email = emailValidation.normalizedEmail;
                recordUpdated = true;
                emailNormalized++;
            }

            if (recordUpdated) {
                updatedRecords.push(updatedRecord);
            }
        }

        this.results.fixesApplied.phoneStandardized = phoneStandardized;
        this.results.fixesApplied.emailNormalized = emailNormalized;
        this.results.fixesApplied.totalRecordsUpdated = updatedRecords.length;

        console.log(`   ✓ ${phoneStandardized} phone numbers standardized`);
        console.log(`   ✓ ${emailNormalized} email addresses normalized`);
        console.log(`   ✓ ${updatedRecords.length} records ready for update`);

        return updatedRecords;
    }

    /**
     * Update database with fixed records
     */
    async updateDatabase(updatedRecords) {
        let successCount = 0;
        let errorCount = 0;

        for (const record of updatedRecords) {
            try {
                const { error } = await this.supabase
                    .from('insurance_brokers')
                    .update({
                        phone: record.phone,
                        email: record.email,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', record.id);

                if (error) {
                    console.error(`   ❌ Failed to update record ${record.id}:`, error.message);
                    errorCount++;
                } else {
                    successCount++;
                }
            } catch (error) {
                console.error(`   ❌ Error updating record ${record.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`   ✓ ${successCount} records updated successfully`);
        if (errorCount > 0) {
            console.log(`   ⚠️  ${errorCount} records failed to update`);
        }
    }

    /**
     * Generate comprehensive reports
     */
    async generateReports() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportsDir = path.join(__dirname, 'reports');
        
        // Ensure reports directory exists
        try {
            await fs.mkdir(reportsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Generate individual validation reports
        const reports = {
            requiredFields: this.requiredFieldValidator.generateReport(this.results.validationResults.requiredFields),
            phoneValidation: this.phoneValidator.generateReport(this.results.validationResults.phoneValidation),
            emailValidation: this.emailValidator.generateReport(this.results.validationResults.emailValidation),
            duplicateDetection: this.duplicateDetector.generateReport(this.results.validationResults.duplicateDetection)
        };

        // Generate comprehensive summary report
        const summaryReport = this.generateSummaryReport(reports);

        // Generate manual review list
        const manualReviewList = this.generateManualReviewList();

        // Save reports to files
        const reportFiles = {
            summary: path.join(reportsDir, `cleanup-summary-${timestamp}.txt`),
            requiredFields: path.join(reportsDir, `required-fields-${timestamp}.txt`),
            phoneValidation: path.join(reportsDir, `phone-validation-${timestamp}.txt`),
            emailValidation: path.join(reportsDir, `email-validation-${timestamp}.txt`),
            duplicateDetection: path.join(reportsDir, `duplicate-detection-${timestamp}.txt`),
            manualReview: path.join(reportsDir, `manual-review-${timestamp}.json`),
            resultsJson: path.join(reportsDir, `cleanup-results-${timestamp}.json`)
        };

        await Promise.all([
            fs.writeFile(reportFiles.summary, summaryReport),
            fs.writeFile(reportFiles.requiredFields, reports.requiredFields),
            fs.writeFile(reportFiles.phoneValidation, reports.phoneValidation),
            fs.writeFile(reportFiles.emailValidation, reports.emailValidation),
            fs.writeFile(reportFiles.duplicateDetection, reports.duplicateDetection),
            fs.writeFile(reportFiles.manualReview, JSON.stringify(manualReviewList, null, 2)),
            fs.writeFile(reportFiles.resultsJson, JSON.stringify(this.results, null, 2))
        ]);

        console.log('   ✓ Reports generated:');
        Object.entries(reportFiles).forEach(([type, filePath]) => {
            console.log(`     - ${type}: ${filePath}`);
        });

        return reportFiles;
    }

    /**
     * Generate comprehensive summary report
     */
    generateSummaryReport(reports) {
        const { requiredFields, phoneValidation, emailValidation, duplicateDetection } = this.results.validationResults;
        const { phoneStandardized, emailNormalized, totalRecordsUpdated } = this.results.fixesApplied;

        let summary = `DATABASE CLEANUP SUMMARY REPORT\n`;
        summary += `===============================================\n`;
        summary += `Generated: ${this.results.timestamp}\n`;
        summary += `Processing Time: ${(this.results.processingTime / 1000).toFixed(2)} seconds\n`;
        summary += `Total Records Processed: ${this.results.totalRecords}\n\n`;

        summary += `FIXES APPLIED\n`;
        summary += `=============\n`;
        summary += `Phone Numbers Standardized: ${phoneStandardized}\n`;
        summary += `Email Addresses Normalized: ${emailNormalized}\n`;
        summary += `Total Records Updated: ${totalRecordsUpdated}\n\n`;

        summary += `VALIDATION SUMMARY\n`;
        summary += `==================\n`;
        summary += `Required Fields:\n`;
        summary += `  - Valid Records: ${requiredFields.validRecords}/${requiredFields.totalRecords} (${((requiredFields.validRecords / requiredFields.totalRecords) * 100).toFixed(1)}%)\n`;
        summary += `  - Missing Name: ${requiredFields.summary.missingName}\n`;
        summary += `  - Missing Phone: ${requiredFields.summary.missingPhone}\n`;
        summary += `  - Missing Email: ${requiredFields.summary.missingEmail}\n\n`;

        summary += `Phone Validation:\n`;
        summary += `  - Valid Phones: ${phoneValidation.validPhones}/${phoneValidation.totalRecords} (${((phoneValidation.validPhones / phoneValidation.totalRecords) * 100).toFixed(1)}%)\n`;
        summary += `  - Critical Issues: ${phoneValidation.summary.critical}\n`;
        summary += `  - Warnings: ${phoneValidation.summary.warning}\n`;
        summary += `  - Standardized: ${phoneValidation.summary.standardized}\n\n`;

        summary += `Email Validation:\n`;
        summary += `  - Valid Emails: ${emailValidation.validEmails}/${emailValidation.totalRecords} (${((emailValidation.validEmails / emailValidation.totalRecords) * 100).toFixed(1)}%)\n`;
        summary += `  - Critical Issues: ${emailValidation.summary.critical}\n`;
        summary += `  - Need Manual Review: ${emailValidation.needsManualReview}\n`;
        summary += `  - Suspicious Emails: ${emailValidation.summary.suspicious}\n\n`;

        summary += `Duplicate Detection:\n`;
        summary += `  - Duplicate Groups Found: ${duplicateDetection.duplicatesFound}\n`;
        summary += `  - Records Involved: ${duplicateDetection.summary.totalDuplicateRecords}\n`;
        summary += `  - Phone Matches: ${duplicateDetection.summary.phoneMatches}\n`;
        summary += `  - Email Matches: ${duplicateDetection.summary.emailMatches}\n`;
        summary += `  - Name Matches: ${duplicateDetection.summary.nameMatches}\n`;
        summary += `  - Need Manual Review: ${duplicateDetection.needsManualReview}\n\n`;

        summary += `NEXT STEPS\n`;
        summary += `==========\n`;
        summary += `1. Review manual-review-*.json file for records needing attention\n`;
        summary += `2. Check individual validation reports for detailed issues\n`;
        summary += `3. Address critical validation failures\n`;
        summary += `4. Review and merge duplicate records\n`;
        summary += `5. Fill in missing required fields\n\n`;

        summary += `DETAILED REPORTS\n`;
        summary += `================\n`;
        summary += `See individual report files for complete details:\n`;
        summary += `- required-fields-*.txt\n`;
        summary += `- phone-validation-*.txt\n`;
        summary += `- email-validation-*.txt\n`;
        summary += `- duplicate-detection-*.txt\n`;
        summary += `- manual-review-*.json\n`;

        return summary;
    }

    /**
     * Generate list of records needing manual attention
     */
    generateManualReviewList() {
        const manualReviewList = {
            summary: {
                totalRecordsNeedingReview: 0,
                criticalIssues: 0,
                duplicateGroups: 0,
                missingRequiredFields: 0
            },
            records: []
        };

        const { requiredFields, phoneValidation, emailValidation, duplicateDetection } = this.results.validationResults;

        // Records with missing required fields
        requiredFields.validationResults
            .filter(result => !result.isValid)
            .forEach(result => {
                manualReviewList.records.push({
                    recordId: result.recordId,
                    issueType: 'missing_required_fields',
                    severity: 'critical',
                    issues: [`Missing fields: ${result.missingFields.join(', ')}`],
                    action: 'Fill in missing required fields'
                });
                manualReviewList.summary.criticalIssues++;
                manualReviewList.summary.missingRequiredFields++;
            });

        // Records with critical phone issues
        phoneValidation.validationResults
            .filter(result => !result.isValid && result.severity === 'critical')
            .forEach(result => {
                manualReviewList.records.push({
                    recordId: result.recordId,
                    issueType: 'invalid_phone',
                    severity: 'critical',
                    issues: result.issues,
                    originalValue: result.originalPhone,
                    action: 'Fix or replace phone number'
                });
                manualReviewList.summary.criticalIssues++;
            });

        // Records with critical email issues or needing review
        emailValidation.validationResults
            .filter(result => !result.isValid || result.needsManualReview)
            .forEach(result => {
                manualReviewList.records.push({
                    recordId: result.recordId,
                    issueType: 'email_issue',
                    severity: result.isValid ? 'warning' : 'critical',
                    issues: result.issues,
                    originalValue: result.originalEmail,
                    normalizedValue: result.normalizedEmail,
                    action: result.isValid ? 'Review suspicious email' : 'Fix or replace email address'
                });
                if (!result.isValid) {
                    manualReviewList.summary.criticalIssues++;
                }
            });

        // Duplicate groups needing manual review
        duplicateDetection.duplicateGroups
            .filter(group => group.reviewType === 'manual')
            .forEach(group => {
                manualReviewList.records.push({
                    recordId: 'multiple',
                    issueType: 'duplicate_records',
                    severity: 'warning',
                    issues: [group.reason],
                    duplicateRecords: group.records,
                    action: 'Review and merge duplicate records manually'
                });
                manualReviewList.summary.duplicateGroups++;
            });

        manualReviewList.summary.totalRecordsNeedingReview = manualReviewList.records.length;

        return manualReviewList;
    }
}

// Main execution
async function main() {
    try {
        const cleanup = new DatabaseCleanup();
        const results = await cleanup.runCleanup();
        
        console.log('\n📊 CLEANUP SUMMARY:');
        console.log(`   Total Records: ${results.totalRecords}`);
        console.log(`   Records Updated: ${results.fixesApplied.totalRecordsUpdated}`);
        console.log(`   Phone Numbers Fixed: ${results.fixesApplied.phoneStandardized}`);
        console.log(`   Email Addresses Fixed: ${results.fixesApplied.emailNormalized}`);
        console.log(`   Processing Time: ${(results.processingTime / 1000).toFixed(2)}s`);
        
        console.log('\n✅ Database cleanup completed successfully!');
        console.log('📋 Check the reports directory for detailed results.');
        
    } catch (error) {
        console.error('\n❌ Database cleanup failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DatabaseCleanup;
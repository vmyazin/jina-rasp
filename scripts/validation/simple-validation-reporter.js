/**
 * Simple Validation Reporter
 * 
 * Generates a unified JSON report with validation results from all validation tools.
 * Provides count of issues by type and list of records needing attention.
 * No fancy dashboards or alerts - just simple, actionable data.
 */

const RequiredFieldValidator = require('./required-field-validator');
const EmailValidator = require('./email-validator');
const PhoneValidator = require('./phone-validator');
const CompletenessScorer = require('./completeness-scorer');
const DuplicateDetector = require('./duplicate-detector');
const fs = require('fs').promises;
const path = require('path');

class SimpleValidationReporter {
    constructor() {
        this.requiredValidator = new RequiredFieldValidator();
        this.emailValidator = new EmailValidator();
        this.phoneValidator = new PhoneValidator();
        this.completenessScorer = new CompletenessScorer();
        this.duplicateDetector = new DuplicateDetector();
    }

    /**
     * Run all validations and generate a simple unified report
     * @param {Array} records - Broker records to validate
     * @returns {Object} Simple validation report
     */
    async generateValidationReport(records) {
        console.log(`📊 Generating validation report for ${records.length} records...`);
        
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalRecords: records.length,
                reportVersion: '1.0'
            },
            summary: {
                totalIssues: 0,
                recordsNeedingAttention: 0,
                recordsWithNoIssues: 0
            },
            issuesByType: {
                missingRequiredFields: 0,
                invalidEmails: 0,
                invalidPhones: 0,
                lowCompleteness: 0,
                potentialDuplicates: 0
            },
            validationResults: {
                requiredFields: null,
                emails: null,
                phones: null,
                completeness: null,
                duplicates: null
            },
            recordsNeedingAttention: []
        };

        // 1. Required field validation
        console.log('  ✓ Checking required fields...');
        report.validationResults.requiredFields = this.requiredValidator.validateBatch(records);
        report.issuesByType.missingRequiredFields = report.validationResults.requiredFields.invalidRecords;

        // 2. Email validation
        console.log('  ✓ Validating emails...');
        report.validationResults.emails = this.emailValidator.validateBatch(records);
        report.issuesByType.invalidEmails = report.validationResults.emails.invalidEmails;

        // 3. Phone validation
        console.log('  ✓ Validating phones...');
        report.validationResults.phones = this.phoneValidator.validateBatch(records);
        report.issuesByType.invalidPhones = report.validationResults.phones.invalidPhones;

        // 4. Completeness scoring
        console.log('  ✓ Calculating completeness...');
        report.validationResults.completeness = this.completenessScorer.calculateBatchCompleteness(records);
        report.issuesByType.lowCompleteness = report.validationResults.completeness.summary.lowCompleteness;

        // 5. Duplicate detection
        console.log('  ✓ Detecting duplicates...');
        report.validationResults.duplicates = this.duplicateDetector.findDuplicates(records);
        report.issuesByType.potentialDuplicates = report.validationResults.duplicates.duplicatesFound;

        // Calculate summary statistics
        this.calculateSummaryStats(report, records);

        // Identify records needing attention
        this.identifyRecordsNeedingAttention(report, records);

        console.log('  ✅ Validation report generated');
        return report;
    }

    /**
     * Calculate overall summary statistics
     * @param {Object} report - Report object to update
     * @param {Array} records - Original records
     */
    calculateSummaryStats(report, records) {
        const { issuesByType } = report;
        
        // Count total issues (note: a record can have multiple types of issues)
        report.summary.totalIssues = Object.values(issuesByType).reduce((sum, count) => sum + count, 0);

        // Count records with at least one issue
        let recordsWithIssues = 0;
        records.forEach((record, index) => {
            const hasRequiredFieldIssue = !report.validationResults.requiredFields.validationResults[index]?.isValid;
            const hasEmailIssue = !report.validationResults.emails.validationResults[index]?.isValid;
            const hasPhoneIssue = !report.validationResults.phones.validationResults[index]?.isValid;
            const hasCompletenessIssue = report.validationResults.completeness.completenessResults[index]?.completenessPercentage < 50;
            
            if (hasRequiredFieldIssue || hasEmailIssue || hasPhoneIssue || hasCompletenessIssue) {
                recordsWithIssues++;
            }
        });

        report.summary.recordsNeedingAttention = recordsWithIssues;
        report.summary.recordsWithNoIssues = records.length - recordsWithIssues;
    }

    /**
     * Identify specific records that need attention
     * @param {Object} report - Report object to update
     * @param {Array} records - Original records
     */
    identifyRecordsNeedingAttention(report, records) {
        const recordsNeedingAttention = [];

        records.forEach((record, index) => {
            const issues = [];
            const recordInfo = {
                recordId: record.id || `record_${index}`,
                name: record.name || 'Unknown',
                phone: record.phone || 'Unknown',
                email: record.email || 'Unknown',
                issues: [],
                severity: 'LOW'
            };

            // Check required field issues
            const requiredResult = report.validationResults.requiredFields.validationResults[index];
            if (requiredResult && !requiredResult.isValid) {
                issues.push({
                    type: 'missing_required_fields',
                    description: `Missing: ${requiredResult.missingFields.join(', ')}`,
                    severity: 'CRITICAL'
                });
                recordInfo.severity = 'CRITICAL';
            }

            // Check email issues
            const emailResult = report.validationResults.emails.validationResults[index];
            if (emailResult && !emailResult.isValid) {
                issues.push({
                    type: 'invalid_email',
                    description: emailResult.issues?.join(', ') || 'Invalid email format',
                    severity: 'HIGH'
                });
                if (recordInfo.severity !== 'CRITICAL') {
                    recordInfo.severity = 'HIGH';
                }
            }

            // Check phone issues
            const phoneResult = report.validationResults.phones.validationResults[index];
            if (phoneResult && !phoneResult.isValid) {
                issues.push({
                    type: 'invalid_phone',
                    description: phoneResult.issues?.join(', ') || 'Invalid phone format',
                    severity: 'HIGH'
                });
                if (recordInfo.severity !== 'CRITICAL') {
                    recordInfo.severity = 'HIGH';
                }
            }

            // Check completeness issues
            const completenessResult = report.validationResults.completeness.completenessResults[index];
            if (completenessResult && completenessResult.completenessPercentage < 50) {
                issues.push({
                    type: 'low_completeness',
                    description: `Only ${completenessResult.completenessPercentage}% complete (${completenessResult.filledFields}/${completenessResult.totalFields} fields)`,
                    severity: 'MEDIUM'
                });
                if (recordInfo.severity === 'LOW') {
                    recordInfo.severity = 'MEDIUM';
                }
            }

            // Check for duplicate matches
            const duplicateMatches = report.validationResults.duplicates.duplicateGroups
                .filter(group => group.records.some(r => r.id === record.id || r.name === record.name));
            
            if (duplicateMatches.length > 0) {
                duplicateMatches.forEach(group => {
                    const otherRecords = group.records.filter(r => r.id !== record.id && r.name !== record.name);
                    if (otherRecords.length > 0) {
                        issues.push({
                            type: 'potential_duplicate',
                            description: `Potential duplicate of: ${otherRecords.map(r => r.name || 'Unknown').join(', ')}`,
                            severity: 'MEDIUM'
                        });
                        if (recordInfo.severity === 'LOW') {
                            recordInfo.severity = 'MEDIUM';
                        }
                    }
                });
            }

            // Only include records that have issues
            if (issues.length > 0) {
                recordInfo.issues = issues;
                recordsNeedingAttention.push(recordInfo);
            }
        });

        // Sort by severity (CRITICAL first, then HIGH, MEDIUM, LOW)
        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        recordsNeedingAttention.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        report.recordsNeedingAttention = recordsNeedingAttention;
    }

    /**
     * Generate a human-readable summary from the validation report
     * @param {Object} report - Validation report
     * @returns {string} Human-readable summary
     */
    generateSummaryText(report) {
        const { metadata, summary, issuesByType } = report;
        
        let text = `Simple Validation Report Summary\n`;
        text += `=====================================\n`;
        text += `Generated: ${new Date(metadata.generatedAt).toLocaleString()}\n`;
        text += `Total Records: ${metadata.totalRecords}\n\n`;

        text += `Overall Status:\n`;
        text += `- Records with no issues: ${summary.recordsWithNoIssues}\n`;
        text += `- Records needing attention: ${summary.recordsNeedingAttention}\n`;
        text += `- Total issues found: ${summary.totalIssues}\n\n`;

        text += `Issues by Type:\n`;
        text += `- Missing required fields: ${issuesByType.missingRequiredFields} records\n`;
        text += `- Invalid emails: ${issuesByType.invalidEmails} records\n`;
        text += `- Invalid phones: ${issuesByType.invalidPhones} records\n`;
        text += `- Low completeness (<50%): ${issuesByType.lowCompleteness} records\n`;
        text += `- Potential duplicates: ${issuesByType.potentialDuplicates} records\n\n`;

        // Show top records needing attention
        if (report.recordsNeedingAttention.length > 0) {
            text += `Top Records Needing Attention:\n`;
            report.recordsNeedingAttention.slice(0, 10).forEach((record, index) => {
                text += `${index + 1}. ${record.name} (${record.severity})\n`;
                record.issues.forEach(issue => {
                    text += `   - ${issue.description}\n`;
                });
            });
            
            if (report.recordsNeedingAttention.length > 10) {
                text += `... and ${report.recordsNeedingAttention.length - 10} more records\n`;
            }
        }

        return text;
    }

    /**
     * Save validation report to files
     * @param {Object} report - Validation report
     * @param {string} filename - Base filename (without extension)
     * @returns {Object} File paths
     */
    async saveReport(report, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const baseFilename = filename || `simple-validation-${timestamp}`;
        const reportsDir = path.join(__dirname, 'reports');
        
        await fs.mkdir(reportsDir, { recursive: true });

        const filePaths = {
            json: path.join(reportsDir, `${baseFilename}.json`),
            summary: path.join(reportsDir, `${baseFilename}-summary.txt`)
        };

        // Save JSON report
        await fs.writeFile(filePaths.json, JSON.stringify(report, null, 2));

        // Save summary text
        const summaryText = this.generateSummaryText(report);
        await fs.writeFile(filePaths.summary, summaryText);

        return filePaths;
    }
}

module.exports = SimpleValidationReporter;
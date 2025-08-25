/**
 * Email Format Validator
 * 
 * Basic email format validation with normalization.
 * Validates email format using regex, converts to lowercase, and trims whitespace.
 */

class EmailValidator {
    constructor() {
        // Basic email regex pattern - simple but effective
        this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        // Common domain patterns for additional validation
        this.commonDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'uol.com.br', 'terra.com.br', 'bol.com.br', 'ig.com.br',
            'globo.com', 'r7.com', 'oi.com.br', 'live.com'
        ];
        
        // Suspicious patterns that might indicate fake emails
        this.suspiciousPatterns = [
            /test@test\.com/i,
            /example@example\.com/i,
            /noemail@/i,
            /fake@/i,
            /@test\./i,
            /@example\./i
        ];
    }

    /**
     * Validate and normalize a single email address
     * @param {string} email - Email address to validate and normalize
     * @returns {Object} Validation result with normalized email and status
     */
    validateEmail(email) {
        const result = {
            isValid: false,
            originalEmail: email,
            normalizedEmail: null,
            issues: [],
            severity: 'info', // info, warning, critical
            needsManualReview: false
        };

        // Check if email is present
        if (!email || typeof email !== 'string') {
            result.issues.push('Email address is missing or not a string');
            result.severity = 'critical';
            return result;
        }

        // Step 1: Normalize email (trim whitespace and convert to lowercase)
        const normalizedEmail = email.trim().toLowerCase();
        result.normalizedEmail = normalizedEmail;

        // Step 2: Check for empty email after trimming
        if (normalizedEmail.length === 0) {
            result.issues.push('Email address is empty after trimming whitespace');
            result.severity = 'critical';
            return result;
        }

        // Step 3: Check for critical format issues first (these make email invalid)
        const criticalIssues = this.checkCriticalFormatIssues(normalizedEmail);
        if (criticalIssues.length > 0) {
            result.issues.push(...criticalIssues);
            result.severity = 'critical';
            result.needsManualReview = true;
            return result;
        }

        // Step 4: Basic format validation
        if (!this.emailRegex.test(normalizedEmail)) {
            result.issues.push('Email format is invalid');
            result.severity = 'critical';
            result.needsManualReview = true;
            return result;
        }

        // Step 5: Check for suspicious patterns
        if (this.isSuspiciousEmail(normalizedEmail)) {
            result.issues.push('Email appears to be a placeholder or test email');
            result.severity = 'warning';
            result.needsManualReview = true;
        }

        // Step 6: Additional format checks (warnings)
        const formatIssues = this.checkFormatIssues(normalizedEmail);
        if (formatIssues.length > 0) {
            result.issues.push(...formatIssues);
            result.severity = 'warning';
            result.needsManualReview = true;
        }

        // Step 7: Check if normalization was needed
        if (email !== normalizedEmail) {
            result.issues.push('Email was normalized (trimmed and lowercased)');
        }

        // Email is valid if it passes regex and isn't critical
        result.isValid = result.severity !== 'critical';

        return result;
    }

    /**
     * Check if email matches suspicious patterns
     * @param {string} email - Normalized email to check
     * @returns {boolean} True if email appears suspicious
     */
    isSuspiciousEmail(email) {
        return this.suspiciousPatterns.some(pattern => pattern.test(email));
    }

    /**
     * Check for critical format issues that make email invalid
     * @param {string} email - Normalized email to check
     * @returns {Array} Array of critical format issues found
     */
    checkCriticalFormatIssues(email) {
        const issues = [];
        
        // Check for consecutive dots (critical issue)
        if (email.includes('..')) {
            issues.push('Email contains consecutive dots');
        }

        // Check for dots at start or end of local part (critical issue)
        const [localPart, domain] = email.split('@');
        if (localPart && (localPart.startsWith('.') || localPart.endsWith('.'))) {
            issues.push('Email local part starts or ends with a dot');
        }

        // Check for missing TLD (critical issue)
        if (domain && !domain.includes('.')) {
            issues.push('Email domain appears to be missing TLD');
        }

        return issues;
    }

    /**
     * Check for additional format issues (warnings)
     * @param {string} email - Normalized email to check
     * @returns {Array} Array of format issues found
     */
    checkFormatIssues(email) {
        const issues = [];
        
        // Check for very short local part or domain
        const [localPart, domain] = email.split('@');
        if (localPart && localPart.length < 2) {
            issues.push('Email local part is too short');
        }

        if (domain && domain.length < 4) {
            issues.push('Email domain is too short');
        }

        // Check for very long email (RFC 5321 limit is 320 characters)
        if (email.length > 320) {
            issues.push('Email address is unusually long');
        }

        return issues;
    }

    /**
     * Validate multiple email addresses
     * @param {Array} records - Array of records with email field
     * @returns {Object} Batch validation results
     */
    validateBatch(records) {
        const results = {
            totalRecords: records.length,
            validEmails: 0,
            invalidEmails: 0,
            normalizedEmails: 0,
            needsManualReview: 0,
            validationResults: [],
            summary: {
                critical: 0,
                warning: 0,
                info: 0,
                normalized: 0,
                suspicious: 0
            }
        };

        records.forEach(record => {
            const validation = this.validateEmail(record.email);
            validation.recordId = record.id || 'unknown';
            results.validationResults.push(validation);

            if (validation.isValid) {
                results.validEmails++;
                if (validation.originalEmail !== validation.normalizedEmail) {
                    results.normalizedEmails++;
                    results.summary.normalized++;
                }
            } else {
                results.invalidEmails++;
            }

            if (validation.needsManualReview) {
                results.needsManualReview++;
            }

            // Count by severity
            results.summary[validation.severity]++;

            // Count suspicious emails
            if (validation.issues.some(issue => issue.includes('placeholder') || issue.includes('test'))) {
                results.summary.suspicious++;
            }
        });

        return results;
    }

    /**
     * Generate a simple report of email validation results
     * @param {Object} batchResults - Results from validateBatch
     * @returns {string} Human-readable report
     */
    generateReport(batchResults) {
        const { totalRecords, validEmails, invalidEmails, normalizedEmails, needsManualReview, summary } = batchResults;
        const validPercentage = ((validEmails / totalRecords) * 100).toFixed(1);

        let report = `Email Validation Report\n`;
        report += `=====================================\n`;
        report += `Total Records: ${totalRecords}\n`;
        report += `Valid Emails: ${validEmails} (${validPercentage}%)\n`;
        report += `Invalid Emails: ${invalidEmails}\n`;
        report += `Normalized Emails: ${normalizedEmails}\n`;
        report += `Need Manual Review: ${needsManualReview}\n\n`;
        
        report += `Issue Summary:\n`;
        report += `- Critical Issues: ${summary.critical} (missing/malformed)\n`;
        report += `- Warnings: ${summary.warning} (suspicious/format issues)\n`;
        report += `- Info: ${summary.info} (normalized successfully)\n`;
        report += `- Normalized: ${summary.normalized}\n`;
        report += `- Suspicious: ${summary.suspicious}\n\n`;
        
        if (invalidEmails > 0 || needsManualReview > 0) {
            report += `Records Needing Attention:\n`;
            batchResults.validationResults
                .filter(result => !result.isValid || result.needsManualReview)
                .forEach(result => {
                    const status = result.isValid ? 'REVIEW' : 'INVALID';
                    report += `- Record ${result.recordId} [${status}]: ${result.issues.join(', ')}\n`;
                    report += `  Original: "${result.originalEmail}"\n`;
                    if (result.normalizedEmail && result.normalizedEmail !== result.originalEmail) {
                        report += `  Normalized: "${result.normalizedEmail}"\n`;
                    }
                });
        }

        return report;
    }

    /**
     * Get normalized email addresses for batch update
     * @param {Array} records - Array of records with email field
     * @returns {Array} Array of records with normalized emails
     */
    getNormalizedRecords(records) {
        return records.map(record => {
            const validation = this.validateEmail(record.email);
            return {
                ...record,
                email: validation.normalizedEmail || record.email,
                emailValidation: {
                    isValid: validation.isValid,
                    wasNormalized: validation.originalEmail !== validation.normalizedEmail,
                    needsManualReview: validation.needsManualReview,
                    issues: validation.issues
                }
            };
        });
    }

    /**
     * Get records that need manual review
     * @param {Array} records - Array of records with email field
     * @returns {Array} Array of records needing manual review
     */
    getRecordsNeedingReview(records) {
        const results = [];
        
        records.forEach(record => {
            const validation = this.validateEmail(record.email);
            if (validation.needsManualReview || !validation.isValid) {
                results.push({
                    recordId: record.id || 'unknown',
                    record: record,
                    validation: validation
                });
            }
        });

        return results;
    }
}

module.exports = EmailValidator;
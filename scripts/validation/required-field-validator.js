/**
 * Required Field Validator
 * 
 * Simple validator to check that required fields (name, phone, email) 
 * are present and not empty in broker records.
 */

class RequiredFieldValidator {
    constructor() {
        // Define required fields for broker records
        this.requiredFields = ['name', 'phone', 'email'];
    }

    /**
     * Validate a single broker record for required fields
     * @param {Object} record - Broker record to validate
     * @returns {Object} Validation result with pass/fail and missing fields
     */
    validateRecord(record) {
        const result = {
            isValid: true,
            missingFields: [],
            recordId: record.id || 'unknown'
        };

        // Check each required field
        for (const field of this.requiredFields) {
            if (!this.isFieldPresent(record[field])) {
                result.isValid = false;
                result.missingFields.push(field);
            }
        }

        return result;
    }

    /**
     * Validate multiple broker records
     * @param {Array} records - Array of broker records to validate
     * @returns {Object} Batch validation results
     */
    validateBatch(records) {
        const results = {
            totalRecords: records.length,
            validRecords: 0,
            invalidRecords: 0,
            validationResults: [],
            summary: {
                missingName: 0,
                missingPhone: 0,
                missingEmail: 0
            }
        };

        records.forEach(record => {
            const validation = this.validateRecord(record);
            results.validationResults.push(validation);

            if (validation.isValid) {
                results.validRecords++;
            } else {
                results.invalidRecords++;
                
                // Count missing field types for summary
                validation.missingFields.forEach(field => {
                    if (field === 'name') results.summary.missingName++;
                    if (field === 'phone') results.summary.missingPhone++;
                    if (field === 'email') results.summary.missingEmail++;
                });
            }
        });

        return results;
    }

    /**
     * Check if a field is present and not empty
     * @param {any} value - Field value to check
     * @returns {boolean} True if field is present and not empty
     */
    isFieldPresent(value) {
        // Check for null, undefined, empty string, or whitespace-only string
        if (value === null || value === undefined) {
            return false;
        }
        
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }
        
        return true; // Non-string values are considered present if not null/undefined
    }

    /**
     * Get list of required fields
     * @returns {Array} Array of required field names
     */
    getRequiredFields() {
        return [...this.requiredFields];
    }

    /**
     * Generate a simple report of validation results
     * @param {Object} batchResults - Results from validateBatch
     * @returns {string} Human-readable report
     */
    generateReport(batchResults) {
        const { totalRecords, validRecords, invalidRecords, summary } = batchResults;
        const validPercentage = ((validRecords / totalRecords) * 100).toFixed(1);

        let report = `Required Field Validation Report\n`;
        report += `=====================================\n`;
        report += `Total Records: ${totalRecords}\n`;
        report += `Valid Records: ${validRecords} (${validPercentage}%)\n`;
        report += `Invalid Records: ${invalidRecords}\n\n`;
        
        if (invalidRecords > 0) {
            report += `Missing Field Summary:\n`;
            report += `- Missing Name: ${summary.missingName} records\n`;
            report += `- Missing Phone: ${summary.missingPhone} records\n`;
            report += `- Missing Email: ${summary.missingEmail} records\n\n`;
            
            report += `Records Needing Attention:\n`;
            batchResults.validationResults
                .filter(result => !result.isValid)
                .forEach(result => {
                    report += `- Record ${result.recordId}: Missing ${result.missingFields.join(', ')}\n`;
                });
        }

        return report;
    }
}

module.exports = RequiredFieldValidator;
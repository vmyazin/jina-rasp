/**
 * Phone Number Cleanup Validator
 * 
 * Basic phone format validation for Brazilian numbers with cleanup and standardization.
 * Removes invalid characters and standardizes to (XX) XXXXX-XXXX format.
 */

class PhoneValidator {
    constructor() {
        // Brazilian phone patterns
        this.validPatterns = [
            /^\(\d{2}\)\s\d{4,5}-\d{4}$/, // (XX) XXXXX-XXXX or (XX) XXXX-XXXX
            /^\d{2}\s\d{4,5}-\d{4}$/, // XX XXXXX-XXXX or XX XXXX-XXXX
            /^\d{10,11}$/, // XXXXXXXXXXX or XXXXXXXXXXXX
            /^\+55\d{10,11}$/, // +55XXXXXXXXXXX
            /^\(\d{2}\)\d{4,5}-\d{4}$/, // (XX)XXXXX-XXXX (no space)
            /^\d{2}\d{4,5}\d{4}$/ // XXXXXXXXXXX (11 digits total)
        ];
        
        // Characters to remove (keep only digits, parentheses, hyphens, spaces)
        this.invalidCharsRegex = /[^0-9()\-\s]/g;
        
        // Standard format: (XX) XXXXX-XXXX
        this.standardFormat = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    }

    /**
     * Validate and clean a single phone number
     * @param {string} phone - Phone number to validate and clean
     * @returns {Object} Validation result with cleaned phone and status
     */
    validatePhone(phone) {
        const result = {
            isValid: false,
            originalPhone: phone,
            cleanedPhone: null,
            standardizedPhone: null,
            issues: [],
            severity: 'info' // info, warning, critical
        };

        // Check if phone is present
        if (!phone || typeof phone !== 'string') {
            result.issues.push('Phone number is missing or not a string');
            result.severity = 'critical';
            return result;
        }

        // Step 1: Remove invalid characters
        const cleanedPhone = phone.replace(this.invalidCharsRegex, '');
        result.cleanedPhone = cleanedPhone;

        // Step 2: Extract digits only for length validation
        const digitsOnly = cleanedPhone.replace(/[^0-9]/g, '');
        
        // Step 3: Check for obviously invalid numbers
        if (this.isObviouslyInvalid(digitsOnly)) {
            result.issues.push('Phone number is obviously invalid (too short/long, all zeros, etc.)');
            result.severity = 'critical';
            return result;
        }

        // Step 4: Try to standardize the phone number
        const standardized = this.standardizePhone(cleanedPhone);
        if (standardized) {
            result.isValid = true;
            result.standardizedPhone = standardized;
            result.severity = 'info';
            
            // Check if any cleaning was needed
            if (phone !== standardized) {
                result.issues.push('Phone number was cleaned and standardized');
            }
        } else {
            result.issues.push('Phone number format could not be standardized');
            result.severity = 'warning';
        }

        return result;
    }

    /**
     * Check if a phone number is obviously invalid
     * @param {string} digitsOnly - Phone number with only digits
     * @returns {boolean} True if obviously invalid
     */
    isObviouslyInvalid(digitsOnly) {
        // Too short (less than 10 digits) or too long (more than 13 digits including country code)
        if (digitsOnly.length < 10 || digitsOnly.length > 13) {
            return true;
        }

        // Remove area code for pattern checking (first 2 digits for Brazilian numbers)
        let numberPart;
        if (digitsOnly.length === 13 && digitsOnly.startsWith('55')) {
            // Country code + area code + number
            numberPart = digitsOnly.substring(4);
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith('55')) {
            // Country code + area code + number
            numberPart = digitsOnly.substring(4);
        } else {
            // Area code + number
            numberPart = digitsOnly.substring(2);
        }

        // All zeros in the number part
        if (/^0+$/.test(numberPart)) {
            return true;
        }

        // All same digit in the number part (like 11111111 or 111111111)
        // But be more lenient - only flag if it's really obvious
        if (/^(\d)\1{7,}$/.test(numberPart)) {
            return true;
        }

        // For simplified approach, be more lenient with sequential patterns
        // Only flag if it starts from 0 or 1 (like 01234567 or 12345678)
        if (this.isVeryObviousSequential(numberPart)) {
            return true;
        }

        return false;
    }

    /**
     * Check if digits are very obviously sequential (extremely strict for simplified approach)
     * @param {string} digits - String of digits
     * @returns {boolean} True if very obviously sequential
     */
    isVeryObviousSequential(digits) {
        if (digits.length < 8) return false;
        
        // Only flag the most obvious patterns that start with 0, 1, or 9
        const veryObviousPatterns = [
            '01234567', '12345678', '98765432', '87654321'
        ];
        
        // Check if the entire number matches these patterns
        return veryObviousPatterns.includes(digits);
    }

    /**
     * Standardize phone number to (XX) XXXXX-XXXX format
     * @param {string} phone - Cleaned phone number
     * @returns {string|null} Standardized phone or null if can't standardize
     */
    standardizePhone(phone) {
        // Extract only digits
        const digits = phone.replace(/[^0-9]/g, '');
        
        // Handle different digit lengths
        let areaCode, number;
        
        if (digits.length === 11) {
            // 11 digits: XX XXXXX-XXXX (mobile)
            areaCode = digits.substring(0, 2);
            number = digits.substring(2);
        } else if (digits.length === 10) {
            // 10 digits: XX XXXX-XXXX (landline)
            areaCode = digits.substring(0, 2);
            number = digits.substring(2);
        } else if (digits.length === 13 && digits.startsWith('55')) {
            // 13 digits with country code: +55 XX XXXXX-XXXX
            areaCode = digits.substring(2, 4);
            number = digits.substring(4);
        } else if (digits.length === 12 && digits.startsWith('55')) {
            // 12 digits with country code: +55 XX XXXX-XXXX
            areaCode = digits.substring(2, 4);
            number = digits.substring(4);
        } else {
            return null; // Can't standardize
        }

        // Validate area code (Brazilian area codes are 11-99)
        const areaCodeNum = parseInt(areaCode);
        if (areaCodeNum < 11 || areaCodeNum > 99) {
            return null;
        }

        // Format the number part
        let formattedNumber;
        if (number.length === 9) {
            // Mobile: XXXXX-XXXX
            formattedNumber = `${number.substring(0, 5)}-${number.substring(5)}`;
        } else if (number.length === 8) {
            // Landline: XXXX-XXXX  
            formattedNumber = `${number.substring(0, 4)}-${number.substring(4)}`;
        } else {
            return null;
        }

        return `(${areaCode}) ${formattedNumber}`;
    }

    /**
     * Validate multiple phone numbers
     * @param {Array} records - Array of records with phone field
     * @returns {Object} Batch validation results
     */
    validateBatch(records) {
        const results = {
            totalRecords: records.length,
            validPhones: 0,
            invalidPhones: 0,
            cleanedPhones: 0,
            validationResults: [],
            summary: {
                critical: 0,
                warning: 0,
                info: 0,
                standardized: 0
            }
        };

        records.forEach(record => {
            const validation = this.validatePhone(record.phone);
            validation.recordId = record.id || 'unknown';
            results.validationResults.push(validation);

            if (validation.isValid) {
                results.validPhones++;
                if (validation.originalPhone !== validation.standardizedPhone) {
                    results.cleanedPhones++;
                    results.summary.standardized++;
                }
            } else {
                results.invalidPhones++;
            }

            // Count by severity
            results.summary[validation.severity]++;
        });

        return results;
    }

    /**
     * Generate a simple report of phone validation results
     * @param {Object} batchResults - Results from validateBatch
     * @returns {string} Human-readable report
     */
    generateReport(batchResults) {
        const { totalRecords, validPhones, invalidPhones, cleanedPhones, summary } = batchResults;
        const validPercentage = ((validPhones / totalRecords) * 100).toFixed(1);

        let report = `Phone Number Validation Report\n`;
        report += `=====================================\n`;
        report += `Total Records: ${totalRecords}\n`;
        report += `Valid Phones: ${validPhones} (${validPercentage}%)\n`;
        report += `Invalid Phones: ${invalidPhones}\n`;
        report += `Cleaned/Standardized: ${cleanedPhones}\n\n`;
        
        report += `Issue Summary:\n`;
        report += `- Critical Issues: ${summary.critical} (missing/obviously invalid)\n`;
        report += `- Warnings: ${summary.warning} (format issues)\n`;
        report += `- Info: ${summary.info} (cleaned successfully)\n`;
        report += `- Standardized: ${summary.standardized}\n\n`;
        
        if (invalidPhones > 0) {
            report += `Records Needing Attention:\n`;
            batchResults.validationResults
                .filter(result => !result.isValid)
                .forEach(result => {
                    report += `- Record ${result.recordId}: ${result.issues.join(', ')}\n`;
                    report += `  Original: "${result.originalPhone}"\n`;
                    if (result.cleanedPhone) {
                        report += `  Cleaned: "${result.cleanedPhone}"\n`;
                    }
                });
        }

        return report;
    }

    /**
     * Get standardized phone numbers for batch update
     * @param {Array} records - Array of records with phone field
     * @returns {Array} Array of records with standardized phones
     */
    getStandardizedRecords(records) {
        return records.map(record => {
            const validation = this.validatePhone(record.phone);
            return {
                ...record,
                phone: validation.standardizedPhone || record.phone,
                phoneValidation: {
                    isValid: validation.isValid,
                    wasStandardized: validation.originalPhone !== validation.standardizedPhone,
                    issues: validation.issues
                }
            };
        });
    }
}

module.exports = PhoneValidator;
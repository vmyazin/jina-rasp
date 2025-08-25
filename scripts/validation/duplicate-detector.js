/**
 * Simple Duplicate Detection
 * 
 * Basic duplicate detection for broker records.
 * Matches on identical phone numbers or emails, flags exact name matches for manual review.
 * No complex similarity algorithms - keeps it simple.
 */

class DuplicateDetector {
    constructor() {
        // Simple matching strategies
        this.matchingStrategies = {
            PHONE_EXACT: 'phone_exact',
            EMAIL_EXACT: 'email_exact', 
            NAME_EXACT: 'name_exact'
        };
    }

    /**
     * Find duplicates in a batch of records
     * @param {Array} records - Array of broker records to check for duplicates
     * @returns {Object} Duplicate detection results
     */
    findDuplicates(records) {
        const results = {
            totalRecords: records.length,
            duplicatesFound: 0,
            duplicateGroups: [],
            needsManualReview: 0,
            summary: {
                phoneMatches: 0,
                emailMatches: 0,
                nameMatches: 0,
                totalDuplicateRecords: 0
            }
        };

        // Create lookup maps for efficient duplicate detection
        const phoneMap = new Map();
        const emailMap = new Map();
        const nameMap = new Map();

        // First pass: build lookup maps
        records.forEach((record, index) => {
            const recordWithIndex = { ...record, originalIndex: index };

            // Phone lookup (only if phone exists and is not empty)
            if (record.phone && typeof record.phone === 'string' && record.phone.trim()) {
                const normalizedPhone = this.normalizePhone(record.phone);
                if (normalizedPhone) {
                    if (!phoneMap.has(normalizedPhone)) {
                        phoneMap.set(normalizedPhone, []);
                    }
                    phoneMap.get(normalizedPhone).push(recordWithIndex);
                }
            }

            // Email lookup (only if email exists and is not empty)
            if (record.email && typeof record.email === 'string' && record.email.trim()) {
                const normalizedEmail = this.normalizeEmail(record.email);
                if (normalizedEmail) {
                    if (!emailMap.has(normalizedEmail)) {
                        emailMap.set(normalizedEmail, []);
                    }
                    emailMap.get(normalizedEmail).push(recordWithIndex);
                }
            }

            // Name lookup (only if name exists and is not empty)
            if (record.name && typeof record.name === 'string' && record.name.trim()) {
                const normalizedName = this.normalizeName(record.name);
                if (normalizedName) {
                    if (!nameMap.has(normalizedName)) {
                        nameMap.set(normalizedName, []);
                    }
                    nameMap.get(normalizedName).push(recordWithIndex);
                }
            }
        });

        // Second pass: find duplicates
        const processedRecords = new Set();

        // Check phone duplicates
        phoneMap.forEach((recordsWithSamePhone, phone) => {
            if (recordsWithSamePhone.length > 1) {
                const duplicateGroup = this.createDuplicateGroup(
                    recordsWithSamePhone,
                    this.matchingStrategies.PHONE_EXACT,
                    `Identical phone number: ${phone}`,
                    'auto' // Phone matches can be auto-merged
                );
                results.duplicateGroups.push(duplicateGroup);
                results.summary.phoneMatches++;
                
                recordsWithSamePhone.forEach(record => {
                    processedRecords.add(record.originalIndex);
                });
            }
        });

        // Check email duplicates (only for records not already processed)
        emailMap.forEach((recordsWithSameEmail, email) => {
            if (recordsWithSameEmail.length > 1) {
                const unprocessedRecords = recordsWithSameEmail.filter(
                    record => !processedRecords.has(record.originalIndex)
                );
                
                if (unprocessedRecords.length > 1) {
                    const duplicateGroup = this.createDuplicateGroup(
                        unprocessedRecords,
                        this.matchingStrategies.EMAIL_EXACT,
                        `Identical email address: ${email}`,
                        'auto' // Email matches can be auto-merged
                    );
                    results.duplicateGroups.push(duplicateGroup);
                    results.summary.emailMatches++;
                    
                    unprocessedRecords.forEach(record => {
                        processedRecords.add(record.originalIndex);
                    });
                }
            }
        });

        // Check name duplicates (only for records not already processed)
        nameMap.forEach((recordsWithSameName, name) => {
            if (recordsWithSameName.length > 1) {
                const unprocessedRecords = recordsWithSameName.filter(
                    record => !processedRecords.has(record.originalIndex)
                );
                
                if (unprocessedRecords.length > 1) {
                    const duplicateGroup = this.createDuplicateGroup(
                        unprocessedRecords,
                        this.matchingStrategies.NAME_EXACT,
                        `Identical name: ${name}`,
                        'manual' // Name matches need manual review
                    );
                    results.duplicateGroups.push(duplicateGroup);
                    results.summary.nameMatches++;
                    results.needsManualReview++;
                    
                    unprocessedRecords.forEach(record => {
                        processedRecords.add(record.originalIndex);
                    });
                }
            }
        });

        // Calculate summary statistics
        results.duplicatesFound = results.duplicateGroups.length;
        results.summary.totalDuplicateRecords = processedRecords.size;

        return results;
    }

    /**
     * Create a duplicate group object
     * @param {Array} records - Records that are duplicates
     * @param {string} matchType - Type of match found
     * @param {string} reason - Reason for the match
     * @param {string} reviewType - 'auto' or 'manual'
     * @returns {Object} Duplicate group object
     */
    createDuplicateGroup(records, matchType, reason, reviewType) {
        return {
            matchType: matchType,
            reason: reason,
            reviewType: reviewType,
            recordCount: records.length,
            records: records.map(record => ({
                id: record.id || 'unknown',
                name: record.name || '',
                phone: record.phone || '',
                email: record.email || '',
                originalIndex: record.originalIndex
            })),
            suggestedAction: reviewType === 'auto' ? 'merge' : 'manual_review'
        };
    }

    /**
     * Normalize phone number for comparison
     * @param {string} phone - Phone number to normalize
     * @returns {string|null} Normalized phone or null if invalid
     */
    normalizePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return null;
        }

        // Extract only digits
        const digits = phone.replace(/[^0-9]/g, '');
        
        // Must have at least 10 digits for Brazilian numbers
        if (digits.length < 10) {
            return null;
        }

        // Remove country code if present (55)
        let normalizedDigits = digits;
        if (digits.length >= 12 && digits.startsWith('55')) {
            normalizedDigits = digits.substring(2);
        }

        // Should have 10 or 11 digits after normalization
        if (normalizedDigits.length === 10 || normalizedDigits.length === 11) {
            return normalizedDigits;
        }

        return null;
    }

    /**
     * Normalize email for comparison
     * @param {string} email - Email to normalize
     * @returns {string|null} Normalized email or null if invalid
     */
    normalizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return null;
        }

        const normalized = email.trim().toLowerCase();
        
        // Basic email format check
        if (normalized.includes('@') && normalized.includes('.')) {
            return normalized;
        }

        return null;
    }

    /**
     * Normalize name for comparison
     * @param {string} name - Name to normalize
     * @returns {string|null} Normalized name or null if invalid
     */
    normalizeName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }

        // Trim whitespace, convert to lowercase, and remove extra spaces
        const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
        
        if (normalized.length > 0) {
            return normalized;
        }

        return null;
    }

    /**
     * Get records that can be automatically merged
     * @param {Object} duplicateResults - Results from findDuplicates
     * @returns {Array} Array of duplicate groups that can be auto-merged
     */
    getAutoMergeableGroups(duplicateResults) {
        return duplicateResults.duplicateGroups.filter(
            group => group.reviewType === 'auto'
        );
    }

    /**
     * Get records that need manual review
     * @param {Object} duplicateResults - Results from findDuplicates
     * @returns {Array} Array of duplicate groups needing manual review
     */
    getManualReviewGroups(duplicateResults) {
        return duplicateResults.duplicateGroups.filter(
            group => group.reviewType === 'manual'
        );
    }

    /**
     * Generate a simple report of duplicate detection results
     * @param {Object} duplicateResults - Results from findDuplicates
     * @returns {string} Human-readable report
     */
    generateReport(duplicateResults) {
        const { totalRecords, duplicatesFound, needsManualReview, summary, duplicateGroups } = duplicateResults;
        const duplicatePercentage = ((summary.totalDuplicateRecords / totalRecords) * 100).toFixed(1);

        let report = `Duplicate Detection Report\n`;
        report += `=====================================\n`;
        report += `Total Records: ${totalRecords}\n`;
        report += `Duplicate Groups Found: ${duplicatesFound}\n`;
        report += `Records Involved in Duplicates: ${summary.totalDuplicateRecords} (${duplicatePercentage}%)\n`;
        report += `Groups Needing Manual Review: ${needsManualReview}\n\n`;
        
        report += `Match Summary:\n`;
        report += `- Phone Number Matches: ${summary.phoneMatches} groups\n`;
        report += `- Email Address Matches: ${summary.emailMatches} groups\n`;
        report += `- Name Matches: ${summary.nameMatches} groups (need manual review)\n\n`;
        
        if (duplicateGroups.length > 0) {
            report += `Duplicate Groups Found:\n`;
            duplicateGroups.forEach((group, index) => {
                report += `\nGroup ${index + 1} [${group.reviewType.toUpperCase()}]:\n`;
                report += `  Reason: ${group.reason}\n`;
                report += `  Records (${group.recordCount}):\n`;
                group.records.forEach(record => {
                    report += `    - ID: ${record.id}, Name: "${record.name}", Phone: "${record.phone}", Email: "${record.email}"\n`;
                });
                report += `  Suggested Action: ${group.suggestedAction}\n`;
            });
        }

        // Auto-mergeable groups
        const autoGroups = this.getAutoMergeableGroups(duplicateResults);
        if (autoGroups.length > 0) {
            report += `\nAuto-Mergeable Groups (${autoGroups.length}):\n`;
            autoGroups.forEach((group, index) => {
                report += `- Group ${index + 1}: ${group.reason} (${group.recordCount} records)\n`;
            });
        }

        // Manual review groups
        const manualGroups = this.getManualReviewGroups(duplicateResults);
        if (manualGroups.length > 0) {
            report += `\nGroups Needing Manual Review (${manualGroups.length}):\n`;
            manualGroups.forEach((group, index) => {
                report += `- Group ${index + 1}: ${group.reason} (${group.recordCount} records)\n`;
            });
        }

        return report;
    }

    /**
     * Suggest merge strategy for a duplicate group
     * @param {Object} duplicateGroup - Duplicate group from findDuplicates
     * @returns {Object} Merge suggestion with primary record and merge strategy
     */
    suggestMerge(duplicateGroup) {
        if (duplicateGroup.records.length < 2) {
            return null;
        }

        // For simple approach, suggest keeping the record with most complete data
        let primaryRecord = duplicateGroup.records[0];
        let maxCompleteness = this.calculateCompleteness(primaryRecord);

        duplicateGroup.records.forEach(record => {
            const completeness = this.calculateCompleteness(record);
            if (completeness > maxCompleteness) {
                maxCompleteness = completeness;
                primaryRecord = record;
            }
        });

        return {
            primaryRecord: primaryRecord,
            duplicateRecords: duplicateGroup.records.filter(r => r.id !== primaryRecord.id),
            mergeStrategy: 'keep_most_complete',
            completenessScore: maxCompleteness,
            reason: `Selected record with highest completeness score (${maxCompleteness.toFixed(1)}%)`
        };
    }

    /**
     * Calculate simple completeness score for a record
     * @param {Object} record - Record to score
     * @returns {number} Completeness percentage (0-100)
     */
    calculateCompleteness(record) {
        const fields = ['name', 'phone', 'email', 'company', 'website', 'address', 'neighborhood'];
        let filledFields = 0;

        fields.forEach(field => {
            if (record[field] && typeof record[field] === 'string' && record[field].trim().length > 0) {
                filledFields++;
            }
        });

        return (filledFields / fields.length) * 100;
    }
}

module.exports = DuplicateDetector;
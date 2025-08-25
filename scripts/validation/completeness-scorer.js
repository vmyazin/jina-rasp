/**
 * Completeness Scorer
 * 
 * Simple completeness scoring system that counts filled vs empty fields
 * and calculates percentage completeness per record.
 * No complex weighting - all fields are treated equally.
 */

class CompletenessScorer {
    constructor() {
        // Define all scoreable fields from the insurance_brokers table
        // Excluding system fields like id, created_at, updated_at, etc.
        this.scoreableFields = [
            'name',           // Required field
            'email',          // Required field  
            'phone',          // Required field
            'website',
            'address',
            'neighborhood',
            'city',
            'state',
            'postal_code',
            'specialties',
            'rating',
            'review_count',
            'description',
            'social_media',
            'business_hours',
            'license_number',
            'years_experience',
            'company_size',
            'source_url'
        ];
    }

    /**
     * Calculate completeness score for a single broker record
     * @param {Object} record - Broker record to score
     * @returns {Object} Completeness scoring result
     */
    calculateCompleteness(record) {
        const result = {
            recordId: record.id || 'unknown',
            totalFields: this.scoreableFields.length,
            filledFields: 0,
            emptyFields: 0,
            completenessPercentage: 0,
            fieldStatus: {},
            missingFields: []
        };

        // Check each scoreable field
        this.scoreableFields.forEach(field => {
            const isFilled = this.isFieldFilled(record[field]);
            result.fieldStatus[field] = isFilled;
            
            if (isFilled) {
                result.filledFields++;
            } else {
                result.emptyFields++;
                result.missingFields.push(field);
            }
        });

        // Calculate percentage (rounded to 1 decimal place)
        result.completenessPercentage = Math.round((result.filledFields / result.totalFields) * 1000) / 10;

        return result;
    }

    /**
     * Calculate completeness scores for multiple broker records
     * @param {Array} records - Array of broker records to score
     * @returns {Object} Batch completeness scoring results
     */
    calculateBatchCompleteness(records) {
        const results = {
            totalRecords: records.length,
            averageCompleteness: 0,
            completenessResults: [],
            summary: {
                highCompleteness: 0,    // >= 80%
                mediumCompleteness: 0,  // 50-79%
                lowCompleteness: 0,     // < 50%
                fieldFillRates: {}
            }
        };

        // Initialize field fill rate tracking
        this.scoreableFields.forEach(field => {
            results.summary.fieldFillRates[field] = {
                filled: 0,
                total: records.length,
                percentage: 0
            };
        });

        let totalCompleteness = 0;

        // Process each record
        records.forEach(record => {
            const completeness = this.calculateCompleteness(record);
            results.completenessResults.push(completeness);
            
            totalCompleteness += completeness.completenessPercentage;

            // Categorize completeness level
            if (completeness.completenessPercentage >= 80) {
                results.summary.highCompleteness++;
            } else if (completeness.completenessPercentage >= 50) {
                results.summary.mediumCompleteness++;
            } else {
                results.summary.lowCompleteness++;
            }

            // Track field fill rates
            this.scoreableFields.forEach(field => {
                if (completeness.fieldStatus[field]) {
                    results.summary.fieldFillRates[field].filled++;
                }
            });
        });

        // Calculate averages and percentages
        results.averageCompleteness = records.length > 0 ? 
            Math.round((totalCompleteness / records.length) * 10) / 10 : 0;

        // Calculate field fill rate percentages
        Object.keys(results.summary.fieldFillRates).forEach(field => {
            const fillRate = results.summary.fieldFillRates[field];
            fillRate.percentage = records.length > 0 ? 
                Math.round((fillRate.filled / fillRate.total) * 1000) / 10 : 0;
        });

        return results;
    }

    /**
     * Check if a field is filled (not empty)
     * @param {any} value - Field value to check
     * @returns {boolean} True if field is filled
     */
    isFieldFilled(value) {
        // Handle null and undefined
        if (value === null || value === undefined) {
            return false;
        }

        // Handle strings
        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        // Handle arrays (like specialties)
        if (Array.isArray(value)) {
            return value.length > 0 && value.some(item => 
                item !== null && item !== undefined && 
                (typeof item !== 'string' || item.trim().length > 0)
            );
        }

        // Handle objects (like social_media, business_hours)
        if (typeof value === 'object') {
            return Object.keys(value).length > 0;
        }

        // Handle numbers (including 0, which is valid)
        if (typeof value === 'number') {
            return !isNaN(value);
        }

        // Handle booleans (both true and false are valid)
        if (typeof value === 'boolean') {
            return true;
        }

        // Default: consider filled if not null/undefined
        return true;
    }

    /**
     * Get completeness category based on percentage
     * @param {number} percentage - Completeness percentage
     * @returns {string} Category name
     */
    getCompletenessCategory(percentage) {
        if (percentage >= 80) return 'High';
        if (percentage >= 50) return 'Medium';
        return 'Low';
    }

    /**
     * Get list of scoreable fields
     * @returns {Array} Array of field names used in scoring
     */
    getScoreableFields() {
        return [...this.scoreableFields];
    }

    /**
     * Generate a simple report of completeness results
     * @param {Object} batchResults - Results from calculateBatchCompleteness
     * @returns {string} Human-readable report
     */
    generateReport(batchResults) {
        const { totalRecords, averageCompleteness, summary } = batchResults;

        let report = `Completeness Scoring Report\n`;
        report += `===========================\n`;
        report += `Total Records: ${totalRecords}\n`;
        report += `Average Completeness: ${averageCompleteness}%\n\n`;
        
        report += `Completeness Distribution:\n`;
        report += `- High (≥80%): ${summary.highCompleteness} records (${Math.round((summary.highCompleteness / totalRecords) * 100)}%)\n`;
        report += `- Medium (50-79%): ${summary.mediumCompleteness} records (${Math.round((summary.mediumCompleteness / totalRecords) * 100)}%)\n`;
        report += `- Low (<50%): ${summary.lowCompleteness} records (${Math.round((summary.lowCompleteness / totalRecords) * 100)}%)\n\n`;

        report += `Field Fill Rates:\n`;
        // Sort fields by fill rate (lowest first to highlight gaps)
        const sortedFields = Object.entries(summary.fieldFillRates)
            .sort((a, b) => a[1].percentage - b[1].percentage);

        sortedFields.forEach(([field, stats]) => {
            report += `- ${field}: ${stats.filled}/${stats.total} (${stats.percentage}%)\n`;
        });

        // Show records with lowest completeness for attention
        const lowCompletenessRecords = batchResults.completenessResults
            .filter(result => result.completenessPercentage < 50)
            .sort((a, b) => a.completenessPercentage - b.completenessPercentage)
            .slice(0, 10); // Show top 10 lowest

        if (lowCompletenessRecords.length > 0) {
            report += `\nRecords Needing Most Attention (lowest completeness):\n`;
            lowCompletenessRecords.forEach(result => {
                report += `- Record ${result.recordId}: ${result.completenessPercentage}% (${result.filledFields}/${result.totalFields} fields)\n`;
            });
        }

        return report;
    }

    /**
     * Export completeness results to JSON format
     * @param {Object} batchResults - Results from calculateBatchCompleteness
     * @returns {Object} JSON-formatted results
     */
    exportToJSON(batchResults) {
        return {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalRecords: batchResults.totalRecords,
                averageCompleteness: batchResults.averageCompleteness,
                scoreableFields: this.scoreableFields
            },
            summary: batchResults.summary,
            records: batchResults.completenessResults.map(result => ({
                recordId: result.recordId,
                completenessPercentage: result.completenessPercentage,
                filledFields: result.filledFields,
                totalFields: result.totalFields,
                category: this.getCompletenessCategory(result.completenessPercentage),
                missingFields: result.missingFields
            }))
        };
    }
}

module.exports = CompletenessScorer;
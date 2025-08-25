/**
 * Enhanced validation script with completeness scoring
 * 
 * Integrates completeness scoring with existing validation tools
 * to provide comprehensive data quality assessment.
 */

const { createClient } = require('@supabase/supabase-js');
const CompletenessScorer = require('./completeness-scorer');
const RequiredFieldValidator = require('./required-field-validator');
const EmailValidator = require('./email-validator');
const PhoneValidator = require('./phone-validator');
const DuplicateDetector = require('./duplicate-detector');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

class EnhancedValidator {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );
        
        this.completenessScorer = new CompletenessScorer();
        this.requiredValidator = new RequiredFieldValidator();
        this.emailValidator = new EmailValidator();
        this.phoneValidator = new PhoneValidator();
        this.duplicateDetector = new DuplicateDetector();
    }

    /**
     * Run comprehensive validation including completeness scoring
     * @param {Array} records - Broker records to validate
     * @returns {Object} Complete validation results
     */
    async runComprehensiveValidation(records) {
        console.log(`🔍 Running comprehensive validation on ${records.length} records...\n`);
        
        const results = {
            totalRecords: records.length,
            timestamp: new Date().toISOString(),
            validationResults: {
                required: null,
                email: null,
                phone: null,
                completeness: null,
                duplicates: null
            },
            summary: {
                overallScore: 0,
                passedAllValidations: 0,
                needsAttention: 0,
                criticalIssues: 0
            },
            recommendations: []
        };

        // 1. Required field validation
        console.log('📋 Step 1: Required field validation...');
        results.validationResults.required = this.requiredValidator.validateBatch(records);
        console.log(`   ✅ ${results.validationResults.required.validRecords}/${records.length} records have all required fields`);

        // 2. Email validation
        console.log('📧 Step 2: Email validation...');
        results.validationResults.email = this.emailValidator.validateBatch(records);
        console.log(`   ✅ ${results.validationResults.email.validEmails}/${records.length} records have valid emails`);

        // 3. Phone validation
        console.log('📞 Step 3: Phone validation...');
        results.validationResults.phone = this.phoneValidator.validateBatch(records);
        console.log(`   ✅ ${results.validationResults.phone.validPhones}/${records.length} records have valid phones`);

        // 4. Completeness scoring
        console.log('📊 Step 4: Completeness scoring...');
        results.validationResults.completeness = this.completenessScorer.calculateBatchCompleteness(records);
        console.log(`   ✅ Average completeness: ${results.validationResults.completeness.averageCompleteness}%`);

        // 5. Duplicate detection
        console.log('🔍 Step 5: Duplicate detection...');
        results.validationResults.duplicates = await this.duplicateDetector.findDuplicatesInBatch(records);
        console.log(`   ✅ Found ${results.validationResults.duplicates.totalDuplicates} potential duplicates`);

        // Calculate overall metrics
        this.calculateOverallMetrics(results);
        
        // Generate recommendations
        this.generateRecommendations(results);

        console.log('\n✅ Comprehensive validation complete!\n');
        return results;
    }

    /**
     * Calculate overall quality metrics
     * @param {Object} results - Validation results object
     */
    calculateOverallMetrics(results) {
        const { required, email, phone, completeness } = results.validationResults;
        const totalRecords = results.totalRecords;

        // Calculate weighted overall score
        const requiredScore = (required.validRecords / totalRecords) * 100;
        const emailScore = (email.validEmails / totalRecords) * 100;
        const phoneScore = (phone.validPhones / totalRecords) * 100;
        const completenessScore = completeness.averageCompleteness;

        // Weighted average (required fields are most important)
        results.summary.overallScore = Math.round(
            (requiredScore * 0.4 + emailScore * 0.2 + phoneScore * 0.2 + completenessScore * 0.2) * 10
        ) / 10;

        // Count records by quality level
        completeness.completenessResults.forEach((record, index) => {
            const requiredValid = required.validationResults[index]?.isValid || false;
            const emailValid = email.emailResults[index]?.isValid || false;
            const phoneValid = phone.phoneResults[index]?.isValid || false;
            const completenessHigh = record.completenessPercentage >= 80;

            if (requiredValid && emailValid && phoneValid && completenessHigh) {
                results.summary.passedAllValidations++;
            } else if (!requiredValid) {
                results.summary.criticalIssues++;
            } else {
                results.summary.needsAttention++;
            }
        });
    }

    /**
     * Generate actionable recommendations
     * @param {Object} results - Validation results object
     */
    generateRecommendations(results) {
        const { required, email, phone, completeness, duplicates } = results.validationResults;
        const recommendations = [];

        // Critical issues (missing required fields)
        if (required.invalidRecords > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Required Fields',
                issue: `${required.invalidRecords} records missing required fields`,
                action: 'Immediately collect missing name, email, or phone data',
                affectedRecords: required.invalidRecords
            });
        }

        // Email issues
        if (email.invalidEmails > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Email Quality',
                issue: `${email.invalidEmails} records have invalid emails`,
                action: 'Verify and correct email addresses',
                affectedRecords: email.invalidEmails
            });
        }

        // Phone issues
        if (phone.invalidPhones > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Phone Quality',
                issue: `${phone.invalidPhones} records have invalid phones`,
                action: 'Standardize phone number formats',
                affectedRecords: phone.invalidPhones
            });
        }

        // Low completeness
        const lowCompletenessCount = completeness.summary.lowCompleteness;
        if (lowCompletenessCount > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Data Completeness',
                issue: `${lowCompletenessCount} records have <50% completeness`,
                action: 'Focus data collection on incomplete records',
                affectedRecords: lowCompletenessCount
            });
        }

        // Duplicate issues
        if (duplicates.totalDuplicates > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Data Duplicates',
                issue: `${duplicates.totalDuplicates} potential duplicate records found`,
                action: 'Review and merge duplicate entries',
                affectedRecords: duplicates.totalDuplicates
            });
        }

        // Field-specific recommendations
        const lowFillFields = Object.entries(completeness.summary.fieldFillRates)
            .filter(([field, stats]) => stats.percentage < 30)
            .sort((a, b) => a[1].percentage - b[1].percentage);

        if (lowFillFields.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Field Collection',
                issue: `${lowFillFields.length} fields have <30% fill rate`,
                action: `Focus on collecting: ${lowFillFields.slice(0, 3).map(([field]) => field).join(', ')}`,
                affectedRecords: results.totalRecords
            });
        }

        results.recommendations = recommendations;
    }

    /**
     * Generate comprehensive report
     * @param {Object} results - Validation results
     * @returns {string} Formatted report
     */
    generateComprehensiveReport(results) {
        const { validationResults, summary, recommendations } = results;
        
        let report = `Comprehensive Data Quality Report\n`;
        report += `==================================\n`;
        report += `Generated: ${new Date(results.timestamp).toLocaleString()}\n`;
        report += `Total Records: ${results.totalRecords}\n`;
        report += `Overall Quality Score: ${summary.overallScore}%\n\n`;

        // Quality distribution
        report += `Quality Distribution:\n`;
        report += `- Excellent (passed all validations): ${summary.passedAllValidations} records\n`;
        report += `- Needs attention: ${summary.needsAttention} records\n`;
        report += `- Critical issues: ${summary.criticalIssues} records\n\n`;

        // Validation breakdown
        report += `Validation Breakdown:\n`;
        report += `- Required Fields: ${validationResults.required.validRecords}/${results.totalRecords} (${Math.round((validationResults.required.validRecords / results.totalRecords) * 100)}%)\n`;
        report += `- Valid Emails: ${validationResults.email.validEmails}/${results.totalRecords} (${Math.round((validationResults.email.validEmails / results.totalRecords) * 100)}%)\n`;
        report += `- Valid Phones: ${validationResults.phone.validPhones}/${results.totalRecords} (${Math.round((validationResults.phone.validPhones / results.totalRecords) * 100)}%)\n`;
        report += `- Average Completeness: ${validationResults.completeness.averageCompleteness}%\n`;
        report += `- Potential Duplicates: ${validationResults.duplicates.totalDuplicates}\n\n`;

        // Recommendations
        if (recommendations.length > 0) {
            report += `Recommendations (Priority Order):\n`;
            recommendations
                .sort((a, b) => {
                    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .forEach((rec, index) => {
                    const priorityIcon = {
                        'CRITICAL': '🚨',
                        'HIGH': '⚠️',
                        'MEDIUM': '📝',
                        'LOW': '💡'
                    };
                    report += `${index + 1}. ${priorityIcon[rec.priority]} ${rec.category}: ${rec.issue}\n`;
                    report += `   Action: ${rec.action}\n`;
                    report += `   Affected: ${rec.affectedRecords} records\n\n`;
                });
        }

        // Top incomplete records
        const incompleteRecords = validationResults.completeness.completenessResults
            .filter(result => result.completenessPercentage < 50)
            .sort((a, b) => a.completenessPercentage - b.completenessPercentage)
            .slice(0, 5);

        if (incompleteRecords.length > 0) {
            report += `Records Needing Most Attention:\n`;
            incompleteRecords.forEach(result => {
                report += `- ${result.recordId}: ${result.completenessPercentage}% complete\n`;
            });
        }

        return report;
    }

    /**
     * Save validation results to files
     * @param {Object} results - Validation results
     * @returns {Object} File paths
     */
    async saveResults(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const reportsDir = path.join(__dirname, 'reports');
        
        await fs.mkdir(reportsDir, { recursive: true });

        const filePaths = {
            report: path.join(reportsDir, `comprehensive-validation-${timestamp}.txt`),
            data: path.join(reportsDir, `comprehensive-validation-${timestamp}.json`)
        };

        // Save text report
        const report = this.generateComprehensiveReport(results);
        await fs.writeFile(filePaths.report, report);

        // Save JSON data
        await fs.writeFile(filePaths.data, JSON.stringify(results, null, 2));

        return filePaths;
    }
}

/**
 * Main function to run validation on database records
 */
async function validateDatabaseRecords() {
    const validator = new EnhancedValidator();
    
    try {
        console.log('🔄 Fetching broker records from database...\n');
        
        const { data: records, error } = await validator.supabase
            .from('insurance_brokers')
            .select('*')
            .limit(50); // Limit for testing

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        if (!records || records.length === 0) {
            console.log('⚠️ No records found in database');
            return;
        }

        console.log(`📊 Found ${records.length} records to validate\n`);

        // Run comprehensive validation
        const results = await validator.runComprehensiveValidation(records);

        // Display summary
        console.log('📈 Validation Summary:');
        console.log('=====================');
        console.log(`Overall Quality Score: ${results.summary.overallScore}%`);
        console.log(`Records with excellent quality: ${results.summary.passedAllValidations}`);
        console.log(`Records needing attention: ${results.summary.needsAttention}`);
        console.log(`Records with critical issues: ${results.summary.criticalIssues}`);

        // Show top recommendations
        if (results.recommendations.length > 0) {
            console.log('\n🎯 Top Recommendations:');
            results.recommendations.slice(0, 3).forEach((rec, index) => {
                const priorityIcon = {
                    'CRITICAL': '🚨',
                    'HIGH': '⚠️',
                    'MEDIUM': '📝',
                    'LOW': '💡'
                };
                console.log(`${index + 1}. ${priorityIcon[rec.priority]} ${rec.issue}`);
                console.log(`   ${rec.action}`);
            });
        }

        // Save results
        const filePaths = await validator.saveResults(results);
        console.log('\n💾 Results saved:');
        console.log(`📄 Report: ${filePaths.report}`);
        console.log(`📊 Data: ${filePaths.data}`);

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

// Run validation if this file is executed directly
if (require.main === module) {
    validateDatabaseRecords();
}

module.exports = { EnhancedValidator, validateDatabaseRecords };
#!/usr/bin/env node

/**
 * Generate Simple Validation Report
 * 
 * Command-line script to generate simple validation reports from various data sources.
 * Supports both file-based data and database records.
 */

const { createClient } = require('@supabase/supabase-js');
const SimpleValidationReporter = require('./simple-validation-reporter');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

class ReportGenerator {
    constructor() {
        this.reporter = new SimpleValidationReporter();
        this.supabase = null; // Initialize only when needed
    }

    /**
     * Initialize Supabase client if needed
     */
    initializeSupabase() {
        if (!this.supabase && process.env.SUPABASE_URL) {
            this.supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
            );
        }
    }

    /**
     * Load records from consolidated JSON file
     * @returns {Array} Broker records
     */
    async loadFromFile() {
        const filePath = path.join(__dirname, '../data/consolidated_brokers.json');
        
        try {
            const rawData = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(rawData);
            
            if (!data.brokers || !Array.isArray(data.brokers)) {
                throw new Error('Invalid data format: brokers array not found');
            }
            
            return data.brokers;
        } catch (error) {
            console.error(`❌ Error loading file ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * Load records from database
     * @param {number} limit - Maximum number of records to load
     * @returns {Array} Broker records
     */
    async loadFromDatabase(limit = 100) {
        try {
            this.initializeSupabase();
            
            if (!this.supabase) {
                throw new Error('Supabase configuration missing. Please check SUPABASE_URL in .env file.');
            }

            const { data: records, error } = await this.supabase
                .from('insurance_brokers')
                .select('*')
                .limit(limit);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            return records || [];
        } catch (error) {
            console.error('❌ Error loading from database:', error.message);
            return [];
        }
    }

    /**
     * Generate report from file data
     */
    async generateFromFile() {
        console.log('📁 Loading records from consolidated file...');
        const records = await this.loadFromFile();
        
        if (records.length === 0) {
            console.log('⚠️ No records found in file');
            return;
        }

        console.log(`📊 Found ${records.length} records in file\n`);
        
        const report = await this.reporter.generateValidationReport(records);
        const filePaths = await this.reporter.saveReport(report, 'file-validation-report');
        
        this.displayResults(report, filePaths);
    }

    /**
     * Generate report from database data
     * @param {number} limit - Maximum number of records to process
     */
    async generateFromDatabase(limit = 100) {
        console.log(`🗄️ Loading records from database (limit: ${limit})...`);
        const records = await this.loadFromDatabase(limit);
        
        if (records.length === 0) {
            console.log('⚠️ No records found in database');
            return;
        }

        console.log(`📊 Found ${records.length} records in database\n`);
        
        const report = await this.reporter.generateValidationReport(records);
        const filePaths = await this.reporter.saveReport(report, 'database-validation-report');
        
        this.displayResults(report, filePaths);
    }

    /**
     * Display validation results summary
     * @param {Object} report - Validation report
     * @param {Object} filePaths - Generated file paths
     */
    displayResults(report, filePaths) {
        const { summary, issuesByType } = report;
        
        console.log('\n📈 Validation Results Summary:');
        console.log('==============================');
        console.log(`Total Records: ${report.metadata.totalRecords}`);
        console.log(`Records with no issues: ${summary.recordsWithNoIssues} (${Math.round((summary.recordsWithNoIssues / report.metadata.totalRecords) * 100)}%)`);
        console.log(`Records needing attention: ${summary.recordsNeedingAttention} (${Math.round((summary.recordsNeedingAttention / report.metadata.totalRecords) * 100)}%)`);
        
        console.log('\n🔍 Issues by Type:');
        console.log(`- Missing required fields: ${issuesByType.missingRequiredFields}`);
        console.log(`- Invalid emails: ${issuesByType.invalidEmails}`);
        console.log(`- Invalid phones: ${issuesByType.invalidPhones}`);
        console.log(`- Low completeness: ${issuesByType.lowCompleteness}`);
        console.log(`- Potential duplicates: ${issuesByType.potentialDuplicates}`);

        // Show severity breakdown
        const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        report.recordsNeedingAttention.forEach(record => {
            severityCounts[record.severity]++;
        });

        console.log('\n⚠️ Issues by Severity:');
        console.log(`- Critical: ${severityCounts.CRITICAL} records`);
        console.log(`- High: ${severityCounts.HIGH} records`);
        console.log(`- Medium: ${severityCounts.MEDIUM} records`);
        console.log(`- Low: ${severityCounts.LOW} records`);

        // Show top issues
        if (report.recordsNeedingAttention.length > 0) {
            console.log('\n🎯 Top Records Needing Attention:');
            report.recordsNeedingAttention.slice(0, 5).forEach((record, index) => {
                console.log(`${index + 1}. ${record.name} (${record.severity})`);
                record.issues.slice(0, 2).forEach(issue => {
                    console.log(`   - ${issue.description}`);
                });
            });
            
            if (report.recordsNeedingAttention.length > 5) {
                console.log(`   ... and ${report.recordsNeedingAttention.length - 5} more records`);
            }
        }

        console.log('\n💾 Reports saved:');
        console.log(`📊 JSON Report: ${filePaths.json}`);
        console.log(`📄 Summary: ${filePaths.summary}`);
    }
}

/**
 * Main function - parse command line arguments and generate report
 */
async function main() {
    const args = process.argv.slice(2);
    const generator = new ReportGenerator();

    // Parse command line arguments
    const source = args.find(arg => arg === 'file' || arg === 'database') || 'file';
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

    console.log('🚀 Simple Validation Report Generator');
    console.log('====================================\n');

    try {
        if (source === 'database') {
            await generator.generateFromDatabase(limit);
        } else {
            await generator.generateFromFile();
        }
    } catch (error) {
        console.error('❌ Report generation failed:', error.message);
        process.exit(1);
    }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Simple Validation Report Generator');
    console.log('==================================');
    console.log('');
    console.log('Usage:');
    console.log('  node generate-simple-report.js [source] [options]');
    console.log('');
    console.log('Sources:');
    console.log('  file      Generate report from consolidated_brokers.json (default)');
    console.log('  database  Generate report from Supabase database');
    console.log('');
    console.log('Options:');
    console.log('  --limit=N  Limit database records to N (default: 100)');
    console.log('  --help     Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-simple-report.js file');
    console.log('  node generate-simple-report.js database --limit=50');
    process.exit(0);
}

// Run main function if called directly
if (require.main === module) {
    main();
}

module.exports = ReportGenerator;
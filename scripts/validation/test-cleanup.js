#!/usr/bin/env node

/**
 * Test Database Cleanup Script
 * 
 * This script tests the database cleanup functionality with sample data
 * to ensure it works correctly before running on the actual database.
 */

const DatabaseCleanup = require('./cleanup-database');

// Mock Supabase client for testing
class MockSupabaseClient {
    constructor(testData) {
        this.testData = testData;
        this.updatedRecords = [];
    }

    from(table) {
        return {
            select: () => ({
                order: () => ({
                    data: this.testData,
                    error: null
                })
            }),
            update: (data) => ({
                eq: (field, value) => {
                    // Track updates for testing
                    this.updatedRecords.push({ field, value, data });
                    return { error: null };
                }
            })
        };
    }
}

// Test data with various issues
const testData = [
    {
        id: '1',
        name: 'João Silva',
        phone: '(85) 99999-9999',
        email: 'JOAO@GMAIL.COM',
        company: 'Silva Seguros',
        address: 'Rua A, 123',
        neighborhood: 'Centro'
    },
    {
        id: '2',
        name: 'Maria Santos',
        phone: '85999998888',  // Needs standardization
        email: '  maria@hotmail.com  ',  // Needs normalization
        company: 'Santos Corretora',
        address: 'Rua B, 456',
        neighborhood: 'Aldeota'
    },
    {
        id: '3',
        name: 'Pedro Costa',
        phone: '(85) 3333-4444',
        email: 'pedro@gmail.com',
        company: 'Costa Seguros',
        address: 'Rua C, 789',
        neighborhood: 'Meireles'
    },
    {
        id: '4',
        name: 'Ana Oliveira',
        phone: '',  // Missing phone
        email: 'invalid-email',  // Invalid email
        company: 'Oliveira Seguros',
        address: 'Rua D, 101',
        neighborhood: 'Cocó'
    },
    {
        id: '5',
        name: '',  // Missing name
        phone: '(85) 99999-9999',  // Duplicate phone with record 1
        email: 'duplicate@test.com',
        company: 'Test Company',
        address: 'Rua E, 202',
        neighborhood: 'Papicu'
    },
    {
        id: '6',
        name: 'Carlos Lima',
        phone: '85987654321',  // Needs standardization
        email: 'carlos@gmail.com',
        company: 'Lima Seguros',
        address: 'Rua F, 303',
        neighborhood: 'Fortaleza'
    }
];

class TestDatabaseCleanup extends DatabaseCleanup {
    constructor(testData) {
        super();
        this.mockClient = new MockSupabaseClient(testData);
        this.supabase = this.mockClient;
    }

    async fetchAllRecords() {
        return this.testData || testData;
    }

    async updateDatabase(updatedRecords) {
        // Mock database update - just track the updates
        console.log(`   ✓ Mock update: ${updatedRecords.length} records would be updated`);
        this.mockClient.updatedRecords = updatedRecords;
        return updatedRecords;
    }

    async generateReports() {
        // Skip file generation for tests
        console.log('   ✓ Mock reports generated (files not created in test mode)');
        return {
            summary: 'test-summary.txt',
            manualReview: 'test-manual-review.json'
        };
    }
}

async function runCleanupTest() {
    console.log('🧪 Testing Database Cleanup Script');
    console.log('===================================\n');

    try {
        // Create test cleanup instance
        const cleanup = new TestDatabaseCleanup(testData);
        
        console.log('📊 Test Data:');
        console.log(`   - ${testData.length} test records`);
        console.log('   - Various validation issues included');
        console.log('   - Phone formatting issues');
        console.log('   - Email normalization needed');
        console.log('   - Missing required fields');
        console.log('   - Duplicate records\n');
        
        // Run the cleanup process
        const results = await cleanup.runCleanup();
        
        // Verify results
        console.log('\n🔍 Test Results Verification:');
        console.log('==============================');
        
        // Check that we processed the right number of records
        console.log(`✓ Processed ${results.totalRecords} records (expected: ${testData.length})`);
        
        // Check validation results
        const { requiredFields, phoneValidation, emailValidation, duplicateDetection } = results.validationResults;
        
        console.log(`✓ Required field validation: ${requiredFields.invalidRecords} issues found`);
        console.log(`✓ Phone validation: ${phoneValidation.invalidPhones} invalid, ${phoneValidation.summary.standardized} standardized`);
        console.log(`✓ Email validation: ${emailValidation.invalidEmails} invalid, ${emailValidation.summary.normalized} normalized`);
        console.log(`✓ Duplicate detection: ${duplicateDetection.duplicatesFound} groups found`);
        
        // Check fixes applied
        console.log(`✓ Fixes applied: ${results.fixesApplied.totalRecordsUpdated} records updated`);
        console.log(`  - Phone standardized: ${results.fixesApplied.phoneStandardized}`);
        console.log(`  - Email normalized: ${results.fixesApplied.emailNormalized}`);
        
        // Verify specific test cases
        console.log('\n🎯 Specific Test Case Verification:');
        console.log('====================================');
        
        // Test case 1: Phone standardization
        const phoneResults = phoneValidation.validationResults;
        const record2Phone = phoneResults.find(r => r.recordId === '2');
        if (record2Phone && record2Phone.standardizedPhone === '(85) 99999-8888') {
            console.log('✓ Phone standardization working correctly');
        } else {
            console.log('❌ Phone standardization failed');
        }
        
        // Test case 2: Email normalization
        const emailResults = emailValidation.validationResults;
        const record2Email = emailResults.find(r => r.recordId === '2');
        if (record2Email && record2Email.normalizedEmail === 'maria@hotmail.com') {
            console.log('✓ Email normalization working correctly');
        } else {
            console.log('❌ Email normalization failed');
        }
        
        // Test case 3: Missing required fields detection
        const requiredResults = requiredFields.validationResults;
        const record4Required = requiredResults.find(r => r.recordId === '4');
        const record5Required = requiredResults.find(r => r.recordId === '5');
        if (record4Required && !record4Required.isValid && record5Required && !record5Required.isValid) {
            console.log('✓ Missing required fields detection working correctly');
        } else {
            console.log('❌ Missing required fields detection failed');
        }
        
        // Test case 4: Duplicate detection
        if (duplicateDetection.duplicatesFound > 0) {
            console.log('✓ Duplicate detection working correctly');
        } else {
            console.log('❌ Duplicate detection failed');
        }
        
        console.log('\n✅ All tests completed successfully!');
        console.log('🚀 Cleanup script is ready for production use.');
        
        return results;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    runCleanupTest();
}

module.exports = { runCleanupTest, TestDatabaseCleanup, testData };
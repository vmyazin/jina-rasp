#!/usr/bin/env node

/**
 * Security Setup Script for SEC-001
 * Helps configure the final security settings
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Security Setup - SEC-001 API Keys Configuration\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please create one based on .env.example');
    process.exit(1);
}

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for placeholder values
const checks = [
    {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        placeholder: 'your-actual-service-role-key-here',
        description: 'Supabase Service Role Key (from Project Settings > API)',
        critical: true
    },
    {
        key: 'SUPABASE_URL',
        placeholder: 'https://your-project-ref.supabase.co',
        description: 'Supabase Project URL',
        critical: true
    }
];

let hasIssues = false;
let criticalIssues = 0;

console.log('📋 Security Configuration Check:\n');

checks.forEach(check => {
    const regex = new RegExp(`${check.key}=(.+)`, 'i');
    const match = envContent.match(regex);
    
    if (!match) {
        console.log(`❌ ${check.key}: Missing`);
        hasIssues = true;
        if (check.critical) criticalIssues++;
    } else {
        const value = match[1].trim();
        if (value.includes(check.placeholder) || value === '') {
            console.log(`⚠️  ${check.key}: Contains placeholder value`);
            console.log(`   → ${check.description}`);
            hasIssues = true;
            if (check.critical) criticalIssues++;
        } else {
            console.log(`✅ ${check.key}: Configured`);
        }
    }
});

console.log('\n📊 Security Status Summary:');
console.log(`   Critical Issues: ${criticalIssues}`);
console.log(`   Total Issues: ${hasIssues ? 'Found' : 'None'}`);

if (criticalIssues > 0) {
    console.log('\n🔴 CRITICAL: Server may not function properly with current configuration');
    console.log('\n📝 To fix:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Settings > API');
    console.log('3. Copy the "service_role" key (secret)');
    console.log('4. Update your .env file:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('\n⚠️  Keep this key secret - never commit it to version control!');
} else if (hasIssues) {
    console.log('\n🟡 Some configuration issues found, but server should work');
} else {
    console.log('\n🎉 All security configurations look good!');
    console.log('\n✅ SEC-001 API Keys security is properly configured');
}

// Check if server.js exists and has the security features
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    console.log('\n🛡️  Security Features Check:');
    
    const securityFeatures = [
        { name: 'Rate Limiting', pattern: /checkRateLimit|RATE_LIMIT/, found: false },
        { name: 'Input Validation', pattern: /validateSearchTerm|validateSpecialty/, found: false },
        { name: 'CORS Configuration', pattern: /cors\(/, found: false },
        { name: 'Error Handling', pattern: /error.*middleware/i, found: false }
    ];
    
    securityFeatures.forEach(feature => {
        feature.found = feature.pattern.test(serverContent);
        console.log(`   ${feature.found ? '✅' : '❌'} ${feature.name}`);
    });
    
    const allFeaturesPresent = securityFeatures.every(f => f.found);
    if (allFeaturesPresent) {
        console.log('\n🎯 All security features are implemented!');
    }
} else {
    console.log('\n❌ server.js not found - security proxy not implemented');
}

console.log('\n🔗 Next Steps:');
if (criticalIssues > 0) {
    console.log('1. Fix critical configuration issues above');
    console.log('2. Run: npm start');
    console.log('3. Test the application');
} else {
    console.log('1. Run: npm start');
    console.log('2. Test rate limiting: make 31+ requests in 1 minute');
    console.log('3. Test input validation: try malicious input');
    console.log('4. Verify no credentials in browser dev tools');
}

console.log('\n📚 Documentation: See SECURITY_CHECKLIST.md for details');
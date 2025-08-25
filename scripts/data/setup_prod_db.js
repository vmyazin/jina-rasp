const config = require('../../config/config');
const fs = require('fs');

// Test production database connection
async function testConnection() {
    console.log('🔗 Testing Supabase production connection...');
    console.log(`URL: ${config.supabase.url}`);
    console.log(`Anon Key: ${config.supabase.anonKey.substring(0, 20)}...`);
    
    try {
        const response = await fetch(`${config.supabase.url}/rest/v1/`, {
            headers: {
                'apikey': config.supabase.anonKey,
                'Authorization': `Bearer ${config.supabase.anonKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Production database connection successful!');
            return true;
        } else {
            console.log('❌ Connection failed:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        return false;
    }
}

// Check if tables exist
async function checkTables() {
    console.log('\n📋 Checking database tables...');
    
    try {
        const response = await fetch(`${config.supabase.url}/rest/v1/insurance_brokers?limit=1`, {
            headers: {
                'apikey': config.supabase.anonKey,
                'Authorization': `Bearer ${config.supabase.anonKey}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ insurance_brokers table exists with ${Array.isArray(data) ? data.length : 0} records shown`);
            return true;
        } else if (response.status === 404) {
            console.log('⚠️  insurance_brokers table does not exist - needs to be created');
            return false;
        } else {
            console.log('❌ Error checking table:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
        return false;
    }
}

// Get current broker count
async function getBrokerCount() {
    try {
        const response = await fetch(`${config.supabase.url}/rest/v1/insurance_brokers?select=count`, {
            headers: {
                'apikey': config.supabase.anonKey,
                'Authorization': `Bearer ${config.supabase.anonKey}`,
                'Prefer': 'count=exact'
            }
        });
        
        if (response.ok) {
            const count = response.headers.get('Content-Range');
            if (count) {
                const totalCount = count.split('/')[1];
                console.log(`📊 Current broker count: ${totalCount}`);
                return parseInt(totalCount);
            }
        }
    } catch (error) {
        console.log('❌ Could not get broker count:', error.message);
    }
    return 0;
}

// Main function
async function setupProductionDB() {
    console.log('🚀 Setting up Production Database...\n');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('\n❌ Cannot connect to database. Check your credentials in .env');
        return;
    }
    
    // Check if tables exist
    const tablesExist = await checkTables();
    
    if (tablesExist) {
        // Get current data count
        const count = await getBrokerCount();
        
        if (count > 0) {
            console.log(`\n✅ Database is already set up with ${count} brokers!`);
            console.log(`🌐 Visit your Supabase dashboard: https://supabase.com/dashboard/project/uumwnszvdcrjqnobopax`);
        } else {
            console.log('\n📤 Table exists but is empty. You can now insert data.');
            showInsertInstructions();
        }
    } else {
        console.log('\n📋 Database needs to be set up. Please run the schema in Supabase dashboard:');
        showSchemaInstructions();
    }
}

function showSchemaInstructions() {
    console.log(`
🔧 To set up your database:

1. Go to Supabase Dashboard:
   https://supabase.com/dashboard/project/uumwnszvdcrjqnobopax

2. Navigate to SQL Editor

3. Run the schema.sql file:
   - Copy contents of schema.sql
   - Paste into SQL Editor
   - Click "Run"

4. Then run insert_brokers.sql:
   - Copy contents of insert_brokers.sql  
   - Paste into SQL Editor
   - Click "Run"

5. Verify: Check the "Table Editor" for insurance_brokers table
`);
}

function showInsertInstructions() {
    console.log(`
📤 To insert broker data:

1. Go to Supabase Dashboard SQL Editor:
   https://supabase.com/dashboard/project/uumwnszvdcrjqnobopax/sql

2. Run insert_brokers.sql:
   - Copy contents of insert_brokers.sql
   - Paste into SQL Editor  
   - Click "Run"

3. This will insert all 100 insurance brokers

4. Verify in Table Editor: insurance_brokers should have 100 rows
`);
}

// Run if called directly
if (require.main === module) {
    setupProductionDB().catch(console.error);
}

module.exports = { testConnection, checkTables, getBrokerCount };
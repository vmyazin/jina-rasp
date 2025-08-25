#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script to apply Row Level Security policies to the Supabase database
 * This reads the RLS policies from rls_policies.sql and applies them
 */

async function applyRLSPolicies() {
  console.log('🛡️  Applying Row Level Security Policies to Database\n');

  // Create Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // Read the RLS policies SQL file
    const rlsPoliciesPath = path.join(__dirname, '../../database/rls_policies.sql');
    const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf8');

    console.log('📄 Read RLS policies from:', rlsPoliciesPath);
    console.log('📏 SQL content length:', rlsPoliciesSQL.length, 'characters\n');

    // Split the SQL into individual statements (simple approach)
    const statements = rlsPoliciesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📝 Found', statements.length, 'SQL statements to execute\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add semicolon back
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the rpc function to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });

        if (error) {
          // If exec_sql doesn't exist, try using the SQL query directly
          // This is a fallback method for databases that don't have exec_sql function
          console.log('   Fallback: Attempting direct SQL execution...');
          
          // For Supabase, we need to use the REST API directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          console.log('   ✅ Statement executed successfully');
          successCount++;
        } else {
          console.log('   ✅ Statement executed successfully');
          successCount++;
        }

      } catch (error) {
        console.log('   ❌ Statement failed:', error.message);
        console.log('   📄 Statement was:', statement.substring(0, 100) + '...');
        errorCount++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📈 Success Rate: ${((successCount / statements.length) * 100).toFixed(1)}%\n`);

    if (errorCount === 0) {
      console.log('🎉 All RLS policies applied successfully!');
    } else {
      console.log('⚠️  Some policies failed to apply. Check the errors above.');
      console.log('💡 You may need to apply some policies manually in the Supabase dashboard.');
    }

  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error.message);
    process.exit(1);
  }
}

/**
 * Alternative method: Print SQL statements for manual execution
 */
function printSQLForManualExecution() {
  console.log('📋 Manual Execution Instructions\n');
  console.log('If automatic application failed, copy and paste the following SQL');
  console.log('statements into your Supabase SQL Editor:\n');
  
  const rlsPoliciesPath = path.join(__dirname, '../../database/rls_policies.sql');
  const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf8');
  
  console.log('=' .repeat(60));
  console.log(rlsPoliciesSQL);
  console.log('=' .repeat(60));
  console.log('\n🔗 Access your Supabase SQL Editor at:');
  console.log(`   ${process.env.SUPABASE_URL.replace('/rest/v1', '')}/sql`);
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--manual') || args.includes('-m')) {
  printSQLForManualExecution();
} else if (require.main === module) {
  applyRLSPolicies()
    .then(() => {
      console.log('\n💡 Tip: Run "node test_rls_policies.js" to verify the policies are working');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Application failed:', error);
      console.log('\n💡 Try running with --manual flag to get SQL for manual execution');
      process.exit(1);
    });
}

module.exports = { applyRLSPolicies, printSQLForManualExecution };
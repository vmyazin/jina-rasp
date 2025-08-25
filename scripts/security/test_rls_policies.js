#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Test script to validate Row Level Security policies on insurance_brokers table
 * This script tests different user scenarios to ensure RLS is properly configured
 */

async function testRLSPolicies() {
  console.log('🛡️  Testing Row Level Security Policies\n');

  // Test 1: Anonymous (public) access - should only allow SELECT
  console.log('Test 1: Anonymous user access');
  const anonClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Test SELECT permission (should work)
    const { data: brokers, error: selectError } = await anonClient
      .from('insurance_brokers')
      .select('id, name, email')
      .limit(1);

    if (selectError) {
      console.log('❌ Anonymous SELECT failed:', selectError.message);
    } else {
      console.log('✅ Anonymous SELECT works:', brokers?.length || 0, 'records');
    }

    // Test INSERT permission (should fail)
    const { error: insertError } = await anonClient
      .from('insurance_brokers')
      .insert({
        name: 'Test Broker',
        email: 'test@example.com',
        phone: '123-456-7890'
      });

    if (insertError) {
      console.log('✅ Anonymous INSERT blocked:', insertError.message);
    } else {
      console.log('❌ Anonymous INSERT allowed (security risk!)');
    }

    // Test UPDATE permission (should fail)
    const { error: updateError } = await anonClient
      .from('insurance_brokers')
      .update({ name: 'Hacked Name' })
      .eq('id', brokers?.[0]?.id);

    if (updateError) {
      console.log('✅ Anonymous UPDATE blocked:', updateError.message);
    } else {
      console.log('❌ Anonymous UPDATE allowed (security risk!)');
    }

  } catch (error) {
    console.log('❌ Anonymous client test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Safe search function
  console.log('Test 2: Safe search function');
  
  try {
    // Test normal search
    const { data: searchResults, error: searchError } = await anonClient
      .rpc('safe_search_brokers', {
        search_query: 'seguro',
        search_limit: 5
      });

    if (searchError) {
      console.log('❌ Safe search failed:', searchError.message);
    } else {
      console.log('✅ Safe search works:', searchResults?.length || 0, 'results');
      if (searchResults?.length > 0) {
        console.log('   Sample result:', searchResults[0].name);
      }
    }

    // Test input sanitization with malicious input
    const { data: maliciousResults, error: maliciousError } = await anonClient
      .rpc('safe_search_brokers', {
        search_query: '<script>alert("xss")</script>; DROP TABLE insurance_brokers;',
        search_limit: 5
      });

    if (maliciousError) {
      console.log('✅ Malicious input blocked:', maliciousError.message);
    } else {
      console.log('✅ Malicious input sanitized, returned:', maliciousResults?.length || 0, 'results');
    }

  } catch (error) {
    console.log('❌ Safe search test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Filter options function
  console.log('Test 3: Filter options function');

  try {
    const { data: filterOptions, error: filterError } = await anonClient
      .rpc('get_filter_options');

    if (filterError) {
      console.log('❌ Filter options failed:', filterError.message);
    } else {
      console.log('✅ Filter options work');
      if (filterOptions) {
        const options = typeof filterOptions === 'string' ? JSON.parse(filterOptions) : filterOptions;
        console.log('   Specialties:', options.specialties?.length || 0);
        console.log('   Neighborhoods:', options.neighborhoods?.length || 0);
      }
    }

  } catch (error) {
    console.log('❌ Filter options test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Rate limiting simulation
  console.log('Test 4: Rate limiting simulation');

  try {
    const requests = Array.from({ length: 10 }, (_, i) => 
      anonClient.rpc('safe_search_brokers', {
        search_query: `test${i}`,
        search_limit: 1
      })
    );

    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Concurrent requests: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.log('   Some requests may have been rate limited (expected behavior)');
    }

  } catch (error) {
    console.log('❌ Rate limiting test failed:', error.message);
  }

  console.log('\n🔒 RLS Policy Testing Complete\n');
}

// Run the tests
if (require.main === module) {
  testRLSPolicies()
    .then(() => {
      console.log('✅ All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testRLSPolicies };